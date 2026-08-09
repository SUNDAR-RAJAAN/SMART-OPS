package stubs

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
			Timeout: 300 * time.Second,
		},
	}
}

// SyncTaskToVectorDB sends task content to Python ChromaDB sync service asynchronously.
// TODO: Hook up outbox pattern or Kafka/RabbitMQ queue worker for production vector DB sync.
func (c *PythonClient) SyncTaskToVectorDB(taskID int, title, description string) {
	go func() {
		log.Printf("[TODO: Python Client] Asynchronously syncing task #%d to ChromaDB vector engine...", taskID)

		payload := map[string]interface{}{
			"task_id":     taskID,
			"title":       title,
			"description": description,
		}

		body, err := json.Marshal(payload)
		if err != nil {
			log.Printf("[TODO: Python Client] Failed to marshal vector sync payload: %v", err)
			return
		}

		resp, err := c.HTTPClient.Post(fmt.Sprintf("%s/api/vector/index", c.BaseURL), "application/json", bytes.NewBuffer(body))
		if err != nil {
			log.Printf("[TODO: Python Client] Vector sync call skipped (Python service offline at %s): %v", c.BaseURL, err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
			log.Printf("[Python Client] Task #%d successfully indexed into ChromaDB", taskID)
		} else {
			log.Printf("[Python Client] ChromaDB index endpoint returned status: %d", resp.StatusCode)
		}
	}()
}

// FetchSemanticMatches calls the Python service for top vector search matches.
// TODO: Connect to Python ChromaDB semantic query endpoint. Returns vector match IDs.
func (c *PythonClient) FetchSemanticMatches(query string) ([]int, error) {
	log.Printf("[TODO: Python Client] Querying ChromaDB semantic vector index for: '%s'", query)

	url := fmt.Sprintf("%s/api/vector/search?q=%s", c.BaseURL, query)
	resp, err := c.HTTPClient.Get(url)
	if err != nil {
		log.Printf("[TODO: Python Client] Python service offline (%s). Using empty vector search fallback.", c.BaseURL)
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
