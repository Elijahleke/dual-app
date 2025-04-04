pipeline {
    agent { label 'ubuntu-agent' }

    environment {
        GIT_REPO = 'https://github.com/Elijahleke/dual-app.git'
        VERSION = "v2.0.${BUILD_NUMBER}"
        NEXUS_REPO = "http://172.31.26.135:8081/repository/dual-app-artifacts"
    }

    stages {
        stage('Clone Repo') {
            steps {
                git branch: 'test', url: "${GIT_REPO}"
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
                withCredentials([usernamePassword(credentialsId: 'Nexus', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh '''
                        export NEXUS_USER=$NEXUS_USER
                        export NEXUS_PASS=$NEXUS_PASS
                        ansible-playbook -i inventory.ini play.yml --extra-vars "version=${VERSION}"
                    '''
                }
            }
        }

        stage('Cleanup Old Artifacts') {
            steps {
                sh 'find ./ -name "*.tar.gz" -mtime +2 -delete'
            }
        }
    }

        stage('Cleanup Old Artifacts from Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'Nexus', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh '''
                echo "Fetching list of .tar.gz files in Nexus..."

                curl -s -u "$NEXUS_USER:$NEXUS_PASS" \
                "http://54.90.132.154:8081/service/rest/v1/search/assets?repository=dual-app-artifacts" \
                | jq -r '.items[] | select(.downloadUrl | endswith(".tar.gz")) | .id' > delete-list.txt

                echo " Deleting matching .tar.gz artifacts from Nexus..."

                while read -r id; do
                    echo " Deleting asset ID: $id"
                    curl -s -X DELETE -u "$NEXUS_USER:$NEXUS_PASS" \
                    "http://54.90.132.154:8081/service/rest/v1/assets/$id"
                done < delete-list.txt
            '''
        }
    }
}


    post {
        success {
            mail to: 'elijahleked@gmail.com, boyodebby@gmail.com, derachukwudi08@gmail.com',
                 subject: "✅ Jenkins Build Successful - Dual App",
                 body: "Your Dual App Build & Deploy succeeded at ${VERSION}!"
        }
        failure {
            mail to: 'elijahleked@gmail.com, boyodebby@gmail.com, derachukwudi08@gmail.com',
                 subject: "❌ Jenkins Build Failed - Dual App",
                 body: "Your Dual App Build & Deploy failed. Please check Jenkins logs."
        }
    }
}
