package iam

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"smartops/internal/db"
	"smartops/internal/middleware"
)

type IAMHandler struct {
	DB        *db.DB
	JWTSecret string
}

func NewIAMHandler(database *db.DB, jwtSecret string) *IAMHandler {
	return &IAMHandler{
		DB:        database,
		JWTSecret: jwtSecret,
	}
}

type LoginRequest struct {
	Email string `json:"email"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  UserProfile `json:"user"`
}

type UserProfile struct {
	ID              int    `json:"id"`
	Email           string `json:"email"`
	Role            string `json:"role"`
	TeamID          int    `json:"team_id"`
	TeamsWebhookURL string `json:"teams_webhook_url"`
}

func (h *IAMHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	var u UserProfile
	query := "SELECT id, email, role, team_id, COALESCE(teams_webhook_url, '') FROM users WHERE email = ?"
	if h.DB.Driver == "postgres" {
		query = "SELECT id, email, role, team_id, COALESCE(teams_webhook_url, '') FROM users WHERE email = $1"
	}

	err := h.DB.QueryRow(query, req.Email).Scan(&u.ID, &u.Email, &u.Role, &u.TeamID, &u.TeamsWebhookURL)
	if err != nil {
		if err == sql.ErrNoRows {
			// Auto-create user as employee if not found for easy prototype demo
			u.Email = req.Email
			u.Role = "employee"
			u.TeamID = 1

			insertQuery := "INSERT INTO users (email, role, team_id) VALUES (?, ?, ?)"
			if h.DB.Driver == "postgres" {
				insertQuery = "INSERT INTO users (email, role, team_id) VALUES ($1, $2, $3) RETURNING id"
				err = h.DB.QueryRow(insertQuery, u.Email, u.Role, u.TeamID).Scan(&u.ID)
			} else {
				res, execErr := h.DB.Exec(insertQuery, u.Email, u.Role, u.TeamID)
				if execErr == nil {
					id, _ := res.LastInsertId()
					u.ID = int(id)
				} else {
					err = execErr
				}
			}

			if err != nil {
				http.Error(w, `{"error": "Failed to create user"}`, http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}
	}

	token, err := middleware.GenerateToken(u.ID, u.Email, u.Role, u.TeamID, h.JWTSecret)
	if err != nil {
		http.Error(w, `{"error": "Failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LoginResponse{
		Token: token,
		User:  u,
	})
}

func (h *IAMHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.UserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized context"}`, http.StatusUnauthorized)
		return
	}

	var u UserProfile
	query := "SELECT id, email, role, team_id, COALESCE(teams_webhook_url, '') FROM users WHERE id = ?"
	if h.DB.Driver == "postgres" {
		query = "SELECT id, email, role, team_id, COALESCE(teams_webhook_url, '') FROM users WHERE id = $1"
	}

	err := h.DB.QueryRow(query, claims.UserID).Scan(&u.ID, &u.Email, &u.Role, &u.TeamID, &u.TeamsWebhookURL)
	if err != nil {
		if err == sql.ErrNoRows {
			// Fall back to JWT claims if DB row unavailable
			u = UserProfile{
				ID:     claims.UserID,
				Email:  claims.Email,
				Role:   claims.Role,
				TeamID: claims.TeamID,
			}
		} else {
			http.Error(w, `{"error": "Database error"}`, http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(u)
}

func (h *IAMHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	claims, ok := middleware.UserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error": "Unauthorized context"}`, http.StatusUnauthorized)
		return
	}

	var req struct {
		TeamsWebhookURL string `json:"teams_webhook_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	query := "UPDATE users SET teams_webhook_url = ? WHERE id = ?"
	if h.DB.Driver == "postgres" {
		query = "UPDATE users SET teams_webhook_url = $1 WHERE id = $2"
	}

	cleanedURL := strings.TrimSpace(req.TeamsWebhookURL)
	_, err := h.DB.Exec(query, cleanedURL, claims.UserID)
	if err != nil {
		http.Error(w, `{"error": "Failed updating user settings"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":            "success",
		"teams_webhook_url": cleanedURL,
	})
}
