package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	Port           string
	DBDriver       string
	DBSource       string
	JWTSecret      string
	UploadDir      string
	PythonServiceURL string
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	driver := os.Getenv("DB_DRIVER")
	if driver == "" {
		driver = "sqlite"
	}

	dbSource := os.Getenv("DB_SOURCE")
	if dbSource == "" {
		if driver == "sqlite" {
			dbSource = "smartops.db"
		} else {
			dbSource = "postgres://postgres:postgres@localhost:5432/smartops?sslmode=disable"
		}
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "smartops_super_secret_jwt_key_2026"
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	// Ensure uploadDir is cleaned
	uploadDir = filepath.Clean(uploadDir)

	pythonURL := os.Getenv("PYTHON_SERVICE_URL")
	if pythonURL == "" {
		pythonURL = "http://localhost:8000"
	}

	return &Config{
		Port:             port,
		DBDriver:         driver,
		DBSource:         dbSource,
		JWTSecret:        jwtSecret,
		UploadDir:        uploadDir,
		PythonServiceURL: pythonURL,
	}
}
