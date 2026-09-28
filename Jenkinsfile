pipeline {
    agent any

    tools {
        nodejs 'NodeJS 20'
    }

    environment {
        APP_NAME = 'tcg-store-frontend'
        DOCKER_IMAGE = "tcg-store-frontend:${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo '=== Stage 1: Checkout Frontend Repository ==='
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== Stage 2: Install Node Packages ==='
                sh 'npm ci || npm install'
            }
        }

        stage('Run Unit Tests') {
            steps {
                echo '=== Stage 3: Execute Vitest Suite (including Admin Platform Tests) ==='
                sh 'npm test'
            }
        }

        stage('Security & Dependency Audit') {
            steps {
                echo '=== Stage: Dependency Vulnerability Audit (npm audit) ==='
                sh 'npm run audit'
            }
        }

        stage('Typecheck & Build') {
            steps {
                echo '=== Stage 4: Compile TypeScript and Build Web Bundle ==='
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '=== Stage 5: Build NGINX Production Container ==='
                sh "docker build -t ${DOCKER_IMAGE} -t tcg-store-frontend:latest ."
            }
        }
    }

    post {
        success {
            echo "✅ [SUCCESS] Frontend Pipeline (Build #${env.BUILD_NUMBER}) completed successfully."
        }
        failure {
            echo "❌ [FAILURE] Frontend Pipeline (Build #${env.BUILD_NUMBER}) encountered errors."
        }
    }
}
