pipeline {
    agent { label 'built-in' }

    environment {
        APP_SERVER = 'cms@10.10.20.251'
        APP_DIR    = '/home/cms/conference-system'
    }

    triggers {
        githubPush()
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        // ── Stage 1: Checkout ────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        // ── Stage 2: Build both images in parallel ───────────────────────
        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        sh 'docker build -t moa-backend:latest ./backend'
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh 'docker build -t moa-frontend:latest ./system-builder'
                    }
                }
            }
        }

        // ── Stage 3: Deploy ──────────────────────────────────────────────
        stage('Deploy') {
            steps {
                sshagent(['deploy-server']) {
                    sh """
                        # ── 3a. Ensure app directory exists on server ──
                        echo "==> Preparing app server directory..."
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'mkdir -p ${APP_DIR}'

                        # ── 3b. Transfer images via docker save | docker load ──
                        # rsync is NOT used — it is not installed in the Jenkins container
                        echo "==> Transferring backend image..."
                        docker save moa-backend:latest | ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'docker load'

                        echo "==> Transferring frontend image..."
                        docker save moa-frontend:latest | ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'docker load'

                        # ── 3c. Copy compose file and nginx config to server ──
                        # We use scp instead of rsync (no rsync in Jenkins container)
                        echo "==> Copying deployment files..."
                        scp -o StrictHostKeyChecking=no docker-compose.yml ${APP_SERVER}:${APP_DIR}/docker-compose.yml
                        scp -o StrictHostKeyChecking=no -r nginx ${APP_SERVER}:${APP_DIR}/

                        # ── 3d. Start containers on app server ──
                        echo "==> Starting containers..."
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                            cd ${APP_DIR}

                            # .env must already exist on the server
                            if [ ! -f .env ]; then
                                echo "ERROR: .env file not found at ${APP_DIR}/.env"
                                echo "Create it manually on the server first."
                                exit 1
                            fi

                            # Bring containers up with pre-built images
                            docker compose up -d --no-build --remove-orphans

                            # Wait for backend to be healthy before running management commands
                            echo "==> Waiting for backend to be ready..."
                            sleep 15

                            # Run Django management commands
                            docker compose exec -T backend python manage.py migrate --no-input
                            docker compose exec -T backend python manage.py collectstatic --no-input

                            # Clean up old unused images
                            docker image prune -f

                            echo "==> Containers running:"
                            docker compose ps
                        '
                    """
                }
            }
        }

        // ── Stage 4: Health Check ────────────────────────────────────────
        stage('Health Check') {
            steps {
                // Give Nginx time to finish starting
                sh 'sleep 10'

                // Hit the Django health endpoint via Nginx
                // Returns 200 if backend is alive
                sh 'curl -f --retry 3 --retry-delay 5 http://10.10.20.251/api/health/ || exit 1'
            }
        }
    }

    // ── Post actions ─────────────────────────────────────────────────────
    post {
        success {
            echo '✅ Pipeline succeeded — MoA Conference Portal is live!'
        }
        failure {
            echo '❌ Pipeline failed — check the stage logs above'
        }
        always {
            // Always logout to avoid leaving credentials on disk
            sh 'docker logout || true'
        }
    }
}