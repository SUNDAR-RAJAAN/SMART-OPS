package stubs

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"
)

type PythonClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

type SubTaskSuggestion struct {
	Title           string `json:"title"`
	Description     string `json:"description"`
	EstimatedEffort string `json:"estimated_effort"`
}

func NewPythonClient(baseURL string) *PythonClient {
	return &PythonClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

// SyncTaskToVectorDB sends task content to Python ChromaDB sync service asynchronously.
// TODO: Hook up outbox pattern or Kafka/RabbitMQ queue worker for production vector DB sync.
func (c *PythonClient) SyncTaskToVectorDB(taskID int, title, description string) {
	go func() {
		payload := map[string]interface{}{
			"task_id":     taskID,
			"title":       title,
			"description": description,
		}
		jsonBytes, _ := json.Marshal(payload)

		targetURL := fmt.Sprintf("%s/api/vector/index", c.BaseURL)
		resp, err := c.HTTPClient.Post(targetURL, "application/json", bytes.NewBuffer(jsonBytes))
		if err != nil {
			log.Printf("[TODO: Python Client] Vector sync call skipped (Python service offline at %s): %v", c.BaseURL, err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			log.Printf("[Python Client] Task #%d successfully indexed into ChromaDB vector engine", taskID)
		}
	}()
}

type VectorMatchDetail struct {
	TaskID   int     `json:"task_id"`
	Title    string  `json:"title"`
	MaxScore float64 `json:"max_score"`
}

// FetchSemanticMatches calls the Python service for top vector search matches.
func (c *PythonClient) FetchSemanticMatches(query string) ([]int, error) {
	log.Printf("[Python Client] Querying ChromaDB semantic vector index for: '%s'", query)

	searchURL := fmt.Sprintf("%s/api/vector/search?q=%s", c.BaseURL, url.QueryEscape(query))
	resp, err := c.HTTPClient.Get(searchURL)
	if err != nil {
		log.Printf("[Python Client] Python service offline (%s). Using empty vector search fallback.", c.BaseURL)
		return []int{}, nil
	}
	defer resp.Body.Close()

	var result struct {
		TaskIDs []int `json:"task_ids"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return []int{}, nil
	}

	return result.TaskIDs, nil
}

// FetchSemanticMatchesWithDetails queries Python AI service with a specific threshold and returns detailed match scores.
func (c *PythonClient) FetchSemanticMatchesWithDetails(query string, threshold float64) ([]VectorMatchDetail, error) {
	log.Printf("[Python Client] 🔍 Triage query for '%s' with threshold %.2f", query, threshold)

	searchURL := fmt.Sprintf("%s/api/vector/search?q=%s&threshold=%.2f", c.BaseURL, url.QueryEscape(query), threshold)
	resp, err := c.HTTPClient.Get(searchURL)
	if err != nil {
		log.Printf("[Python Client] Python service offline for triage query: %v", err)
		return []VectorMatchDetail{}, nil
	}
	defer resp.Body.Close()

	var result struct {
		TaskIDs []int               `json:"task_ids"`
		Results []VectorMatchDetail `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return []VectorMatchDetail{}, nil
	}

	return result.Results, nil
}

// GenerateSubTasks forwards a task description to Python/LangChain service for agentic task breakdown.
// TODO: Connect to Python LangChain endpoint for LLM-driven sub-task decomposition.
func (c *PythonClient) GenerateSubTasks(parentTaskID int, title, description string) ([]SubTaskSuggestion, error) {
	log.Printf("[Python Client] 🤖 Dispatching Agentic Breakdown for task #%d: '%s' to Python service (%s/api/tasks/breakdown)", parentTaskID, title, c.BaseURL)

	payload := map[string]interface{}{
		"parent_task_id": parentTaskID,
		"title":          title,
		"description":    description,
	}

	body, _ := json.Marshal(payload)
	resp, err := c.HTTPClient.Post(fmt.Sprintf("%s/api/tasks/breakdown", c.BaseURL), "application/json", bytes.NewBuffer(body))
	if err == nil && (resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated) {
		defer resp.Body.Close()
		var suggestions []SubTaskSuggestion
		if err := json.NewDecoder(resp.Body).Decode(&suggestions); err == nil && len(suggestions) > 0 {
			log.Printf("[Python Client] ✅ Successfully received %d sub-tasks from Python AI service!", len(suggestions))
			return suggestions, nil
		} else {
			log.Printf("[Python Client] ⚠️ Failed decoding JSON sub-tasks from Python response: %v", err)
		}
	} else if err != nil {
		log.Printf("[Python Client] ❌ HTTP error calling Python AI service: %v", err)
	} else {
		log.Printf("[Python Client] ⚠️ Python AI service returned status code %d", resp.StatusCode)
	}

	log.Printf("[Python Client] 🔄 Falling back to default Go sub-task generator.")

	// Fallback mock breakdown generator so Phase 1 runs standalone
	return []SubTaskSuggestion{
		{
			Title:           fmt.Sprintf("Design Architecture for %s", title),
			Description:     fmt.Sprintf("Define technical specs and API schemas for %s.", title),
			EstimatedEffort: "2h",
		},
		{
			Title:           fmt.Sprintf("Implement Core Logic for %s", title),
			Description:     fmt.Sprintf("Build database entities and service layer for %s.", title),
			EstimatedEffort: "4h",
		},
		{
			Title:           fmt.Sprintf("Unit & Integration Testing for %s", title),
			Description:     fmt.Sprintf("Write comprehensive unit tests and verify edge cases for %s.", title),
			EstimatedEffort: "2h",
		},
	}, nil
}
