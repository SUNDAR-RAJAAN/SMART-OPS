# SmartOps 🚀

SmartOps is a cloud-native application featuring a **Go** backend server and a **Node.js (Vite)** frontend client. This repository demonstrates an automated GitOps CI/CD pipeline built with **Jenkins**, **Docker**, **Minikube**, and **Argo CD**.

---

## 🏗️ Architecture & Workflow

1. **Jenkins CI:** Monitors GitHub via SCM polling, builds multi-stage Docker images, loads them into Minikube, and updates image tags in `k8s/deployment.yaml`.
2. **Argo CD GitOps:** Continuously monitors `k8s/deployment.yaml` in GitHub and auto-syncs state to the Minikube cluster with self-healing enabled.

---

## 🛠️ Tech Stack

* **Frontend:** Node.js 20, Vite, React
* **Backend:** Go (Golang) 1.25, SQLite
* **Containers:** Docker (Multi-stage build)
* **Orchestration:** Kubernetes (Minikube single-node)
* **CI/CD:** Jenkins & Argo CD

---

## 📁 Project Structure

```text
SmartOps/
├── cmd/server/          # Go backend application
├── frontend/            # Node.js frontend client
├── k8s/deployment.yaml  # Kubernetes manifests
├── Jenkinsfile          # Jenkins CI pipeline
├── argocd-app.yaml      # Argo CD Application spec
└── Dockerfile           # Multi-stage container file
