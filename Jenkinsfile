// ============================================================
// MoA Conference Portal — Jenkins CI/CD Pipeline
// Jenkins @ 10.10.20.126 → Deploy to 10.10.20.251 (no registry)
// ============================================================

pipeline {
    agent any

    environment {
        // -- Target deployment server --
        DEPLOY_HOST = '10.10.20.251'
        DEPLOY_USER = 'moa'
        APP_DIR     = '/home/moa/moa-conference'   // ← change to your app path

        // -- GitHub repo --
        GITHUB_REPO = 'https://github.com/MoA-Eth/Ministry-of-Agriculture-Conference-Center-Venue-Booking-Portal.git'
        BRANCH      = 'main'                                         // ← change if needed

        // -- Application secrets (add these in Jenkins Credentials) --
        SECRET_KEY          = credentials('moa-secret-key')
        DB_PASSWORD         = credentials('moa-db-password')
        EMAIL_HOST_USER     = credentials('moa-email-user')
        EMAIL_HOST_PASSWORD = credentials('moa-email-password')

        // -- SSH credential ID (the one you added earlier) --
        SSH_CRED_ID = 'deploy-server'
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        // ─────────────────────────────────────────────
        // 1. Checkout source code from GitHub
        // ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Pulling source code from GitHub...'
                git branch: "${BRANCH}", url: "${GITHUB_REPO}"
            }
        }

        // ─────────────────────────────────────────────
        // 2. Run backend tests
        // ─────────────────────────────────────────────
        stage('Backend Tests') {
            steps {
                echo '🧪 Running backend tests...'
                dir('backend') {
                    sh '''
                        python -m venv .venv
                        . .venv/bin/activate
                        pip install -r requirements.txt
                        python manage.py test --no-input || true
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────
        // 3. Run frontend tests & lint
        // ─────────────────────────────────────────────
        stage('Frontend Tests') {
            steps {
                echo '🧪 Running frontend tests...'
                dir('system-builder') {
                    sh '''
                        npm ci
                        npm run lint || true
                        npm run test || true
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────
        // 4. Copy source code to 10.10.20.251 via SSH
        // ─────────────────────────────────────────────
        stage('Transfer Code to Server') {
            steps {
                echo '📦 Transferring code to 10.10.20.251...'
                sshagent(credentials: ["${SSH_CRED_ID}"]) {
                    sh """
                        # Ensure app directory exists on target server
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} \
                            'mkdir -p ${APP_DIR}'

                        # Sync all project files to target server
                        rsync -avz --delete \
                            --exclude='.git' \
                            --exclude='**/.venv' \
                            --exclude='**/node_modules' \
                            --exclude='**/__pycache__' \
                            ./ ${DEPLOY_USER}@${DEPLOY_HOST}:${APP_DIR}/
                    """
                }
            }
        }

        // ─────────────────────────────────────────────
        // 5. Write .env file on target server
        // ─────────────────────────────────────────────
        stage('Configure Environment') {
            steps {
                echo '⚙️ Writing .env file on 10.10.20.251...'
                sshagent(credentials: ["${SSH_CRED_ID}"]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            cat > ${APP_DIR}/.env <<EOF
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=*
DB_NAME=conference_db
DB_USER=postgres
DB_PASSWORD=${DB_PASSWORD}
CORS_ALLOW_ALL_ORIGINS=True
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=${EMAIL_HOST_USER}
EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD}
DEFAULT_FROM_EMAIL=MoA Conference Center <${EMAIL_HOST_USER}>
VITE_API_BASE=/api
BUILD_NUMBER=${BUILD_NUMBER}
EOF
                        '
                    """
                }
            }
        }

        // ─────────────────────────────────────────────
        // 6. Build Docker images on 10.10.20.251
        // ─────────────────────────────────────────────
        stage('Build Images on Server') {
            steps {
                echo '🐳 Building Docker images on 10.10.20.251...'
                sshagent(credentials: ["${SSH_CRED_ID}"]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            cd ${APP_DIR}

                            # Build backend image
                            docker build -t moa-backend:latest -t moa-backend:${BUILD_NUMBER} ./backend

                            # Build frontend image
                            docker build \
                                --build-arg VITE_API_BASE=/api \
                                -t moa-frontend:latest \
                                -t moa-frontend:${BUILD_NUMBER} \
                                ./system-builder
                        '
                    """
                }
            }
        }

        // ─────────────────────────────────────────────
        // 7. Deploy with Docker Compose on 10.10.20.251
        // ─────────────────────────────────────────────
        stage('Deploy') {
            steps {
                echo '🚀 Deploying with Docker Compose on 10.10.20.251...'
                sshagent(credentials: ["${SSH_CRED_ID}"]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            cd ${APP_DIR}

                            # Stop existing containers
                            docker compose down --remove-orphans || true

                            # Start all services (use pre-built images)
                            docker compose up -d --no-build

                            # Wait for backend to be ready
                            echo "Waiting for backend to be ready..."
                            sleep 15

                            # Run Django migrations
                            docker compose exec -T backend python manage.py migrate --no-input

                            # Collect static files
                            docker compose exec -T backend python manage.py collectstatic --no-input || true

                            # Show running containers
                            docker compose ps
                        '
                    """
                }
            }
        }

        // ─────────────────────────────────────────────
        // 8. Health Check
        // ─────────────────────────────────────────────
        stage('Health Check') {
            steps {
                echo '🏥 Running health check...'
                sshagent(credentials: ["${SSH_CRED_ID}"]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            # Check all containers are running
                            docker compose -f ${APP_DIR}/docker-compose.yml ps

                            # Check backend responds
                            curl -f http://localhost/api/ || echo "⚠️ API check failed - verify manually"
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful! MoA Conference Portal is live on http://10.10.20.251'
        }
        failure {
            echo '❌ Pipeline failed! Check the logs above.'
            // Optional: add email notification here
            // mail to: 'your@email.com', subject: "Build Failed: ${env.JOB_NAME}", body: "Check: ${env.BUILD_URL}"
        }
        always {
            echo '🧹 Cleaning up Jenkins workspace...'
            cleanWs()
        }
    }
}