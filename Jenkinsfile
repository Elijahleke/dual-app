pipeline {
    agent { label 'ubuntu-agent' }

    environment {
        GIT_REPO = 'https://github.com/Elijahleke/dual-app.git'
        VERSION = "v1.0.${BUILD_NUMBER}"
        NEXUS_REPO = "http://172.31.26.135:8081/repository/dual-app-artifacts"
        RETENTION_DAYS = "7"
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

        stage('Deploy via Ansible') {
            steps {
                // Create an Ansible variable file with the version
                sh "echo 'app_version: ${VERSION}' > version_vars.yml"
                
                // Fix the package module issue by modifying play.yml
                sh '''
                    # Replace 'package' with 'yum' for better compatibility
                    sed -i 's/package:/yum:/g' play.yml
                    
                    # Run the playbook with extra vars
                    ansible-playbook -i inventory.ini play.yml --extra-vars "@version_vars.yml"
                '''
            }
        }

        stage('Cleanup Old Artifacts') {
            steps {
                // Local cleanup
                sh 'find ./ -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete'
                
                // Docker cleanup
                sh '''
                    # Remove old Docker images (keeping the last 3 versions)
                    docker image prune -a --filter "until=${RETENTION_DAYS}d" --force
                    
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
            // Clean workspace using deleteDir instead of cleanWs
            deleteDir()
        }
    }
}