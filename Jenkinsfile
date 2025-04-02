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
                // Use buildx for Docker builds if available
                sh '''
                    if command -v docker buildx &> /dev/null; then
                        docker buildx build --load -t flask_app:${VERSION} flask_app
                        docker buildx build --load -t node_app:${VERSION} node_app
                    else
                        docker build -t flask_app:${VERSION} flask_app
                        docker build -t node_app:${VERSION} node_app
                    fi
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

        stage('Deploy to Target') {
            steps {
                // Use SSH credentials - you need to add these to Jenkins
                withCredentials([sshUserPrivateKey(credentialsId: 'target-server-ssh', keyFileVariable: 'SSH_KEY')]) {
                    sh '''
                        # Create deployment script
                        cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

# Setup directories
mkdir -p ~/dual-app/flask_app
mkdir -p ~/dual-app/node_app

# Install Docker if not present using sudo
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo dnf install -y dnf-plugins-core
    sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
    sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "Docker installed successfully"
fi

# Build and run Flask app
cd ~/dual-app/flask_app
echo "Building Flask app..."
sudo docker build -t flask_app:latest .
echo "Running Flask app..."
sudo docker stop flask_app 2>/dev/null || true
sudo docker rm flask_app 2>/dev/null || true
sudo docker run -d --name flask_app -p 5000:5000 --restart always flask_app:latest

# Build and run Node app
cd ~/dual-app/node_app
echo "Building Node app..."
sudo docker build -t node_app:latest .
echo "Running Node app..."
sudo docker stop node_app 2>/dev/null || true
sudo docker rm node_app 2>/dev/null || true
sudo docker run -d --name node_app -p 3000:3000 --restart always node_app:latest

echo "Deployment completed successfully!"
EOF

                        # Set up SSH options with the key
                        SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
                        
                        # Create remote directories
                        ssh $SSH_OPTS ${SSH_USER}@${TARGET_SERVER} "mkdir -p ~/dual-app/flask_app ~/dual-app/node_app"
                        
                        # Copy application files
                        scp $SSH_OPTS -r flask_app/* ${SSH_USER}@${TARGET_SERVER}:~/dual-app/flask_app/
                        scp $SSH_OPTS -r node_app/* ${SSH_USER}@${TARGET_SERVER}:~/dual-app/node_app/
                        
                        # Copy and execute deployment script
                        scp $SSH_OPTS deploy.sh ${SSH_USER}@${TARGET_SERVER}:~/deploy.sh
                        ssh $SSH_OPTS ${SSH_USER}@${TARGET_SERVER} "chmod +x ~/deploy.sh && ~/deploy.sh"
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
                
                // Remote cleanup - optional
                withCredentials([sshUserPrivateKey(credentialsId: 'target-server-ssh', keyFileVariable: 'SSH_KEY')]) {
                    sh '''
                        SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
                        ssh $SSH_OPTS ${SSH_USER}@${TARGET_SERVER} "docker image prune -a --filter until=${RETENTION_DAYS}d --force || true"
                    '''
                }
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
            deleteDir()
        }
    }
}