pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/SUNDAR-RAJAAN/SmartOps.git'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t smartops:latest .'
            }
        }
        
        stage('Load Image into Minikube') {
            steps {
                // Directs image directly to minikube's Docker registry
                sh 'minikube image load smartops:latest'
            }
        }
    }
}
