package gateway

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"smartops/internal/db"
	"smartops/internal/stubs"
	"smartops/internal/tasks"
)

type GatewayHandler struct {
	DB           *db.DB
	PythonClient *stubs.PythonClient
}

func NewGatewayHandler(database *db.DB, pythonClient *stubs.PythonClient) *GatewayHandler {
	return &GatewayHandler{
		DB:           database,
		PythonClient: pythonClient,
	}
}

type SearchResponse struct {
	Query   string       `json:"query"`
	Results []tasks.Task `json:"results"`
}

func (g *GatewayHandler) Search(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	queryStr := r.URL.Query().Get("q")
	if queryStr == "" {
		allQuery := "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks ORDER BY id DESC LIMIT 50"
		allTasks, err := g.queryTasks(allQuery)
		if err != nil {
			allTasks = []tasks.Task{}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(SearchResponse{
			Query:   "",
			Results: allTasks,
		})
		return
	}

	seenIDs := make(map[int]bool)
	var finalResults []tasks.Task

	// -------------------------------------------------------------
	// Tier 1: Exact Match (Numeric ID or Title Substring match)
	// -------------------------------------------------------------
	var tier1IDs []int
	if id, err := strconv.Atoi(queryStr); err == nil {
		tier1IDs = append(tier1IDs, id)
	}

	substringPattern := "%" + queryStr + "%"
	var queryT1 string

	if len(tier1IDs) > 0 {
		if g.DB.Driver == "postgres" {
			queryT1 = "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE id = $1 OR title ILIKE $2"
		} else {
			queryT1 = "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE id = ? OR title LIKE ?"
		}
	} else {
		if g.DB.Driver == "postgres" {
			queryT1 = "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE title ILIKE $1"
		} else {
			queryT1 = "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE title LIKE ?"
		}
	}

	var t1Rows []tasks.Task
	var err error
	if len(tier1IDs) > 0 {
		t1Rows, err = g.queryTasks(queryT1, tier1IDs[0], substringPattern)
	} else {
		t1Rows, err = g.queryTasks(queryT1, substringPattern)
	}

	if err == nil {
		for _, t := range t1Rows {
			if !seenIDs[t.ID] {
				seenIDs[t.ID] = true
				finalResults = append(finalResults, t)
			}
		}
	}

	// -------------------------------------------------------------
	// Tier 2: Fuzzy Typo / Missing Character Match (e.g. "vldation" -> "validation")
	// -------------------------------------------------------------
	fuzzyPattern := "%" + strings.Join(strings.Split(queryStr, ""), "%") + "%"
	var queryT2 string

	if g.DB.Driver == "postgres" {
		queryT2 = "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE title ILIKE $1 ORDER BY id DESC LIMIT 20"
	} else {
		queryT2 = "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE title LIKE ? ORDER BY id DESC LIMIT 20"
	}

	t2Rows, err := g.queryTasks(queryT2, fuzzyPattern)
	if err == nil {
		for _, t := range t2Rows {
			if !seenIDs[t.ID] {
				seenIDs[t.ID] = true
				finalResults = append(finalResults, t)
			}
		}
	}

	// -------------------------------------------------------------
	// Tier 3: Enhanced Semantic Match via Python Vector Service (ChromaDB)
	// -------------------------------------------------------------
	vectorMatchedIDs, err := g.PythonClient.FetchSemanticMatches(queryStr)
	if err == nil && len(vectorMatchedIDs) > 0 {
		for _, vectorID := range vectorMatchedIDs {
			if seenIDs[vectorID] {
				continue
			}

			t3Query := "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE id = ?"
			if g.DB.Driver == "postgres" {
				t3Query = "SELECT id, title, description, status, priority, assignee_id, reporter_id, parent_task_id, created_at FROM tasks WHERE id = $1"
			}

			t3Rows, err := g.queryTasks(t3Query, vectorID)
			if err == nil {
				for _, t := range t3Rows {
					if !seenIDs[t.ID] {
						seenIDs[t.ID] = true
						finalResults = append(finalResults, t)
					}
				}
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SearchResponse{
		Query:   queryStr,
		Results: finalResults,
	})
}

func (g *GatewayHandler) queryTasks(query string, args ...interface{}) ([]tasks.Task, error) {
	rows, err := g.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []tasks.Task
	for rows.Next() {
		var t tasks.Task
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority, &t.AssigneeID, &t.ReporterID, &t.ParentTaskID, &t.CreatedAt); err == nil {
			result = append(result, t)
		}
	}
	return result, nil
}
