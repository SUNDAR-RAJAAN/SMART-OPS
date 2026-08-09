package analytics

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"smartops/internal/db"
)

type AnalyticsHandler struct {
	DB               *db.DB
	mu               sync.RWMutex
	completionCache  *cacheItem
	overdueCache     *cacheItem
	cacheTTL         time.Duration
}

type cacheItem struct {
	data      interface{}
	expiresAt time.Time
}

func NewAnalyticsHandler(database *db.DB) *AnalyticsHandler {
	return &AnalyticsHandler{
		DB:       database,
		cacheTTL: 5 * time.Minute,
	}
}

type CompletionStats struct {
	TotalTasks      int            `json:"total_tasks"`
	CompletedTasks  int            `json:"completed_tasks"`
	CompletionRate  float64        `json:"completion_rate_percentage"`
	StatusCounts    map[string]int `json:"status_counts"`
	PriorityCounts  map[string]int `json:"priority_counts"`
	CachedAt        time.Time      `json:"cached_at"`
}

type OverdueStats struct {
	PendingCount int         `json:"pending_count"`
	OverdueCount int         `json:"overdue_count"`
	Tasks        []TaskSummary `json:"tasks"`
	CachedAt     time.Time   `json:"cached_at"`
}

type TaskSummary struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	Priority  string    `json:"priority"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *AnalyticsHandler) GetCompletionRate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	h.mu.RLock()
	if h.completionCache != nil && time.Now().Before(h.completionCache.expiresAt) {
		cachedData := h.completionCache.data
		h.mu.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		json.NewEncoder(w).Encode(cachedData)
		return
	}
	h.mu.RUnlock()

	// Query Database
	statusCounts := make(map[string]int)
	priorityCounts := make(map[string]int)
	total := 0
	completed := 0

	sRows, err := h.DB.Query("SELECT status, COUNT(*) FROM tasks GROUP BY status")
	if err == nil {
		defer sRows.Close()
		for sRows.Next() {
			var st string
			var cnt int
			if sRows.Scan(&st, &cnt) == nil {
				statusCounts[st] = cnt
				total += cnt
				if st == "done" {
					completed = cnt
				}
			}
		}
	}

	pRows, err := h.DB.Query("SELECT priority, COUNT(*) FROM tasks GROUP BY priority")
	if err == nil {
		defer pRows.Close()
		for pRows.Next() {
			var pr string
			var cnt int
			if pRows.Scan(&pr, &cnt) == nil {
				priorityCounts[pr] = cnt
			}
		}
	}

	rate := 0.0
	if total > 0 {
		rate = (float64(completed) / float64(total)) * 100.0
	}

	stats := CompletionStats{
		TotalTasks:     total,
		CompletedTasks: completed,
		CompletionRate: rate,
		StatusCounts:   statusCounts,
		PriorityCounts: priorityCounts,
		CachedAt:       time.Now(),
	}

	// Update TTL Cache
	h.mu.Lock()
	h.completionCache = &cacheItem{
		data:      stats,
		expiresAt: time.Now().Add(h.cacheTTL),
	}
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(stats)
}

func (h *AnalyticsHandler) GetOverdue(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	h.mu.RLock()
	if h.overdueCache != nil && time.Now().Before(h.overdueCache.expiresAt) {
		cachedData := h.overdueCache.data
		h.mu.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		json.NewEncoder(w).Encode(cachedData)
		return
	}
	h.mu.RUnlock()

	query := "SELECT id, title, status, priority, created_at FROM tasks WHERE status != 'done' ORDER BY id DESC"
	rows, err := h.DB.Query(query)
	if err != nil {
		http.Error(w, `{"error": "Database error query overdue tasks"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var pending []TaskSummary
	for rows.Next() {
		var t TaskSummary
		if rows.Scan(&t.ID, &t.Title, &t.Status, &t.Priority, &t.CreatedAt) == nil {
			pending = append(pending, t)
		}
	}

	if pending == nil {
		pending = []TaskSummary{}
	}

	stats := OverdueStats{
		PendingCount: len(pending),
		OverdueCount: len(pending), // In real DB, filtered by due_date < now
		Tasks:        pending,
		CachedAt:     time.Now(),
	}

	h.mu.Lock()
	h.overdueCache = &cacheItem{
		data:      stats,
		expiresAt: time.Now().Add(h.cacheTTL),
	}
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(stats)
}
