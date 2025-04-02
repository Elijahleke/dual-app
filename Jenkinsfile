pipeline {
    agent { label 'ubuntu-agent' }

    environment {
        GIT_REPO     = 'https://github.com/Elijahleke/dual-app.git'
        VERSION      = "v1.0.${BUILD_NUMBER}"
        NEXUS_REPO   = "http://172.31.26.135:8081/repository/dual-app-artifacts"
        RETENTION_DAYS = "7"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'dev', url: "${GIT_REPO}"
            }
        }

        stage('Static Code Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=dual-app \
                          -Dsonar.sources=. \
                          -Dsonar.sourceEncoding=UTF-8
                    '''
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

        stage('Package & Push Artifacts') {
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

        stage('Deploy with Ansible') {
            steps {
                sh '''
                    echo "app_version: ${VERSION}" > version_vars.yml
                    cp play.yml play.yml.original

                    cat > play.yml << 'EOF'
---
- name: Setup and Deploy Dual App to Shared Host
  hosts: app
  become: yes

  pre_tasks:
    - name: Install dependencies
      ansible.builtin.dnf:
        name:
          - python3-pip
          - python3-docker
          - docker
        state: present
      when: ansible_distribution == 'Fedora'

    - name: Install Docker SDK for Python
      ansible.builtin.pip:
        name: docker
        state: present

    - name: Ensure Docker is running
      ansible.builtin.service:
        name: docker
        state: started
        enabled: yes

    - name: Add SSH user to docker group
      ansible.builtin.user:
        name: "{{ ansible_ssh_user }}"
        groups: docker
        append: yes

    - name: Reset SSH connection to apply group changes
      meta: reset_connection

  roles:
    - postgresql
    - flask_app
    - node_app
EOF

                    ansible-playbook -i inventory.ini play.yml --extra-vars "@version_vars.yml"
                '''
            }
        }

        stage('Cleanup Old Artifacts') {
            steps {
                sh '''
                    find ./ -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete || true

                    for app in flask_app node_app; do
                        docker image prune -a --filter "until=${RETENTION_DAYS}d" --force || true
                        docker images $app --format "{{.Repository}}:{{.Tag}}" | sort -r | tail -n +4 | xargs -r docker rmi || true
                    done
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

        always {
            deleteDir()

            // Restore original playbook
            sh 'test -f play.yml.original && mv play.yml.original play.yml || true'
        }
    }
}
