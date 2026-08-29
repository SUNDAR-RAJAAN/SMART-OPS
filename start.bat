@echo off
TITLE SmartOps Launcher
echo ==========================================================
echo ⚡ Starting SmartOps Prototype Microservices...
echo ==========================================================

:: 1. Start Python AI Microservice (Port 8000)
echo [1/3] Starting Python AI Microservice on http://localhost:8000...
start "SmartOps - Python AI Service" cmd /k "python -m uvicorn ai_service.main:app --port 8000"

:: 2. Start Go Core Backend (Port 8080)
echo [2/3] Starting Go Backend Server on http://localhost:8080...
start "SmartOps - Go Backend" cmd /k "go run cmd/server/main.go"

:: 3. Start React Frontend (Port 5173)
echo [3/3] Starting Vite React Frontend on http://localhost:5173...
start "SmartOps - React Frontend" cmd /k "cd frontend && npm run dev"

echo ==========================================================
echo 🚀 All services launched!
echo    - Frontend UI:   http://localhost:5173
echo    - Go Backend:    http://localhost:8080
echo    - Python AI:     http://localhost:8000
echo ==========================================================
