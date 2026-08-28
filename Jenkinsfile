pipeline {
    agent any

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
                sh "docker build --no-cache -t ${AAME_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${AAME_NAME}:${IMAGE_TAG} ${APP_NAME}:latest"
            }
        }

        stage('Load Image to Minikube') {
            steps {
                echo "Loading image ${APP_NAME}:${IMAGE_TAG} into Minikube..."
                sh "minikube image load ${AAME_NAME}:${IMAGE_TAG}"
                sh "minikube image load ${APP_NAME}:latest"
            }
        }

        stage('Update K8s Manifest') {
            steps {
                echo "UpdatingZÎ3/deployment.yaml with tag ${IMAGE_TAG}"
                sh """
                    sed -i 's|image: ${APP_NAME}:.*|image: ${APP_NAME}:${IMAGE_TAG}|g' k8s/deployment.yaml
                """
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Applying updated deployment to Minikube..."
                sh "kubectl apply -f k8s/deployment.yaml"
                sh "kubectl rollout status deployment/smartops-app --timeout=60s"
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully! Argo CD will auto-sync the new manifest changes."
        }
        failure {
            echo "Pipeline failed. Check stage logs for details."
        }
    }
}
