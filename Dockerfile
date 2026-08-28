# Multi-stage build: Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage: Go Backend compilation
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o smartops-server ./cmd/server

# Final runtime image
FROM alpine:3.19
WORKDIR /app
COPY --from=backend-builder /app/smartops-server .
COPY --from=frontend-builder /app/frontend/dist ./static
EXPOSE 8080
CMD ["./smartops-server"]
