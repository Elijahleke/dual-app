pipeline {
    agent { label 'ubuntu' }

    environment {
        GIT_REPO = 'https://github.com/Elijahleke/dual-app.git'
    }

    stages {
        stage('Clone Repo') {
            steps {
                git branch: 'dev', url: "${GIT_REPO}"
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'sonar-scanner'
                }
            }
        }

        stage('Build & Push to Nexus') {
            steps {
                sh '''
                    docker build -t flask_app:latest flask_app
                    docker build -t node_app:latest node_app
                    # Optional: Push to Nexus registry
                '''
            }
        }

        stage('Deploy via Ansible') {
            steps {
                sh '''
                    ansible-playbook -i inventory.ini site.yml
                '''
            }
        }
    }

    post {
        success {
            mail to: 'elijahleked@gmail.com',
                 subject: "✅ Jenkins Build Successful",
                 body: "Your Dual App Build & Deploy succeeded!"
        }
        failure {
            mail to: 'elijahleked@gmail.com',
                 subject: "❌ Jenkins Build Failed",
                 body: "Your Dual App Build & Deploy failed!"
        }
    }
}
