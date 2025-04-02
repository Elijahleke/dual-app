pipeline {
    agent { label 'ubuntu-agent' }

    environment {
        GIT_REPO = 'https://github.com/Elijahleke/dual-app.git'
        VERSION = "v1.0.${BUILD_NUMBER}"
        NEXUS_REPO = "http://172.31.26.135:8081/repository/dual-app-artifacts"
        RETENTION_DAYS = "7"
        TARGET_SERVER = "172.31.90.68"
        SSH_USER = "fedora"
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

                withCredentials([usernamePassword(credentialsId: 'Nexus', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh '''
                        curl -u $NEXUS_USER:$NEXUS_PASS --upload-file flask_app-${VERSION}.tar.gz ${NEXUS_REPO}/flask_app-${VERSION}.tar.gz
                        curl -u $NEXUS_USER:$NEXUS_PASS --upload-file node_app-${VERSION}.tar.gz ${NEXUS_REPO}/node_app-${VERSION}.tar.gz
                    '''
                }

                archiveArtifacts artifacts: '*.tar.gz'
            }
        }

        stage('Manual Deployment') {
            steps {
                script {
                    // Create a deployment script
                    sh '''
                    cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

# Install required packages if not present
echo "Installing required packages..."
sudo dnf install -y docker python3-pip python3-docker || sudo yum install -y docker python3-pip python3-docker || true

# Make sure Docker service is running
echo "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
echo "Adding user to docker group..."
sudo usermod -aG docker $USER

# Use sudo for Docker commands until permissions take effect
echo "Pulling application code..."
mkdir -p ~/dual-app/flask_app
mkdir -p ~/dual-app/node_app

# Deploy both applications
echo "Deploying applications..."
cd ~/dual-app/flask_app
sudo docker build -t flask_app:latest .
sudo docker run -d --name flask_app -p 5000:5000 --restart always flask_app:latest || sudo docker restart flask_app

cd ~/dual-app/node_app
sudo docker build -t node_app:latest .
sudo docker run -d --name node_app -p 3000:3000 --restart always node_app:latest || sudo docker restart node_app

echo "Deployment completed successfully!"
EOF
                    chmod +x deploy.sh
                    '''
                    
                    // Copy application files to target server
                    sh '''
                    scp -r flask_app/* ${SSH_USER}@${TARGET_SERVER}:~/dual-app/flask_app/
                    scp -r node_app/* ${SSH_USER}@${TARGET_SERVER}:~/dual-app/node_app/
                    scp deploy.sh ${SSH_USER}@${TARGET_SERVER}:~/deploy.sh
                    '''
                    
                    // Execute deployment script on target server
                    sh '''
                    ssh ${SSH_USER}@${TARGET_SERVER} "bash ~/deploy.sh"
                    '''
                }
            }
        }

        stage('Cleanup Old Artifacts') {
            steps {
                // Local cleanup
                sh 'find ./ -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete || true'
                
                // Docker cleanup
                sh '''
                    # Remove old Docker images
                    docker image prune -a --filter "until=${RETENTION_DAYS}d" --force || true
                    
                    # List images to keep only the 3 most recent per app
                    for app in flask_app node_app; do
                        echo "Cleaning up old $app images..."
                        docker images $app --format "{{.Repository}}:{{.Tag}}" | sort -r | tail -n +4 | xargs -r docker rmi || true
                    done
                '''
            }
        }
    }

    post {
        success {
            mail to: 'elijahleked@gmail.com, boyodebby@gmail.com',
                 subject: "✅ Jenkins Build Successful - Dual App",
                 body: "Your Dual App Build & Deploy succeeded at ${VERSION}!"
        }
        failure {
            mail to: 'elijahleked@gmail.com, boyodebby@gmail.com',
                 subject: "❌ Jenkins Build Failed - Dual App",
                 body: "Your Dual App Build & Deploy failed. Please check Jenkins logs."
        }
        always {
            // Clean workspace using deleteDir
            deleteDir()
        }
    }
}