pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    environment {
        APP_NAME = 'smartops'
        IMAGE_TAG = "v${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image: ${APP_NAME}:${IMAGE_TAG}"
                sh "docker build -t ${APP_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${APP_NAME}:${IMAGE_TAG} ${APP_NAME}:latest"
            }
        }

        stage('Load Image to Minikube') {
            steps {
                echo "Loading image ${APP_NAME}:${IMAGE_TAG} into Minikube runtime..."
                sh "minikube image load ${APP_NAME}:${IMAGE_TAG}"
                sh "minikube image load ${APP_NAME}:latest"
            }
        }

        stage('Update K8s Manifest for Argo CD') {
            steps {
                echo "Updating k8s/deployment.yaml with new tag for GitOps..."
                sh "sed -i 's|image: ${APP_NAME}:.*|image: ${APP_NAME}:${IMAGE_TAG}|g' k8s/deployment.yaml"
            }
        }
    }

    post {
        success {
            echo "CI pipeline completed successfully! Argo CD will auto-sync the cluster."
        }
    }
}
