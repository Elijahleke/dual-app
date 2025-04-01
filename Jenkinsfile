pipeline {
    agent { label 'ubuntu' }

    environment {
        GIT_REPO = 'https://github.com/Elijahleke/dual-app.git'
        VERSION = "v1.0.${BUILD_NUMBER}"
        NEXUS_REPO = "http://172.31.26.135:8081/repository/dual-app-artifacts"
    }

    tools {
        sonarQubeScanner 'SonarQube Scanner'
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
                    sh 'sonar-scanner -Dsonar.projectKey=dual-app -Dsonar.sources=. -Dsonar.sourceEncoding=UTF-8'
                }
            }
        }

        stage('Unit Tests') {
            steps {
                sh '''
                    pytest flask_app/test_app.py
                    cd node_app && npm install && npm test
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    docker build -t flask_app:${VERSION} flask_app
                    docker build -t node_app:${VERSION} node_app
                '''
            }
        }

        stage('Archive & Push to Nexus') {
            steps {
                sh '''
                    tar -czf flask_app-${VERSION}.tar.gz flask_app/
                    tar -czf node_app-${VERSION}.tar.gz node_app/
                '''

                withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh '''
                        curl -u $NEXUS_USER:$NEXUS_PASS --upload-file flask_app-${VERSION}.tar.gz ${NEXUS_REPO}/flask_app-${VERSION}.tar.gz
                        curl -u $NEXUS_USER:$NEXUS_PASS --upload-file node_app-${VERSION}.tar.gz ${NEXUS_REPO}/node_app-${VERSION}.tar.gz
                    '''
                }

                archiveArtifacts artifacts: '*.tar.gz'
            }
        }

        stage('Deploy via Ansible') {
            steps {
                sh 'ansible-playbook -i inventory.ini site.yml'
            }
        }

        stage('Cleanup Old Artifacts') {
            steps {
                sh 'find ./ -name "*.tar.gz" -mtime +7 -delete'
            }
        }
    }

    post {
        success {
            mail to: 'elijahleked@gmail.com',
                 subject: "✅ Jenkins Build Successful - Dual App",
                 body: "Your Dual App Build & Deploy succeeded at ${VERSION}!"

            // Optional: Slack
            // slackSend(channel: '#devops', message: "✅ SUCCESS: Dual App Build ${VERSION}")
        }
        failure {
            mail to: 'elijahleked@gmail.com',
                 subject: "❌ Jenkins Build Failed - Dual App",
                 body: "Your Dual App Build & Deploy failed. Please check Jenkins logs."

            // Optional: Slack
            // slackSend(channel: '#devops', message: "❌ FAILURE: Dual App Build ${VERSION}")
        }
    }
}
