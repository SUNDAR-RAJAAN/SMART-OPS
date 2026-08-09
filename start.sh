#!/bin/bash
# SmartOps Startup Script (Starts Python AI Microservice, Go Backend, and React Frontend)

echo "=========================================================="
echo "⚡ Starting SmartOps Prototype Microservices..."
echo "=========================================================="

# 1. Start Python AI & Vector Microservice (Port 8000)
echo "[1/3] Starting Python AI Microservice (ChromaDB + FastAPI) on port 8000..."
python -m uvicorn ai_service.main:app --host 0.0.0.0 --port 8000 &
PYTHON_PID=$!
echo "Python AI Service started with PID $PYTHON_PID"

# 2. Start Go Core Backend Engine (Port 8080)
echo "[2/3] Starting Go Core Backend Engine on port 8080..."
go run cmd/server/main.go &
GO_PID=$!
echo "Go Backend Engine started with PID $GO_PID"

# 3. Start Vite React Frontend (Port 5173)
echo "[3/3] Starting React Frontend on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!
echo "React Frontend started with PID $FRONTEND_PID"

echo "=========================================================="
echo "🚀 All services launched successfully!"
echo "   - React Frontend:   http://localhost:5173"
echo "   - Go Backend API:   http://localhost:8080"
echo "   - Python AI Engine: http://localhost:8000"
echo "=========================================================="

# Wait for background processes
wait $PYTHON_PID $GO_PID $FRONTEND_PID
