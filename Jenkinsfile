pipeline {
    agent { label 'built-in' }

    environment {
        APP_SERVER = 'cms@10.10.20.251'
        APP_DIR    = '/home/cms/conference-system'
        REPO_URL   = 'https://github.com/MoA-Eth/Ministry-of-Agriculture-Conference-Center-Venue-Booking-Portal.git'
    }

    triggers { githubPush() }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh 'docker build -t moa-backend:latest .'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('system-builder') {
                            sh 'docker build -t moa-frontend:latest .'
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['deploy-server']) {
                    sh """
                        echo "==> Preparing remote directory..."
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'mkdir -p ${APP_DIR}'

                        echo "==> Copying deployment files..."
                        scp -o StrictHostKeyChecking=no docker-compose.yml ${APP_SERVER}:${APP_DIR}/

                        if [ -f .env ]; then
                            scp -o StrictHostKeyChecking=no .env ${APP_SERVER}:${APP_DIR}/
                        else
                            echo "⚠️  Warning: .env file not found locally"
                        fi

                        echo "==> Loading Docker images on remote server..."
                        docker save moa-backend:latest  | gzip | ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'gunzip | docker load'
                        docker save moa-frontend:latest | gzip | ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'gunzip | docker load'

                        echo "==> Deploying containers..."
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                            cd ${APP_DIR}

                            if [ ! -f .env ]; then
                                echo "Creating default .env file..."
                                SECRET=\$(openssl rand -base64 50)
                                cat > .env << ENVEOF
DEBUG=False
DB_PASSWORD=StrongP@ssw0rd123
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
VITE_API_BASE=http://10.10.20.251/api
ENVEOF
                                echo "SECRET_KEY=\$SECRET" >> .env
                            fi

                            docker-compose down --remove-orphans  true
                            docker-compose up -d --no-build

                            echo "Waiting for database..."
                            sleep 10

                            echo "Container Status:"
                            docker-compose ps

                            echo "Backend logs:"
                            docker-compose logs --tail=30 backend

                            echo "Testing backend internally..."
                            docker-compose exec -T backend curl -sf http://localhost:8000/api/health/ \
                                && echo "✅ Backend internal check passed" \
                                 echo "⚠️  Health endpoint not available yet"

                            docker system prune -f
                            docker exec backend python manage.py migrate --noinput
                            docker exec backend python manage.py loaddata seed_data
                        '
                    """
                }
            }
        }

       
        stage('Run Migrations & Seed') {
            steps {
                sshagent(['deploy-server']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                            cd ${APP_DIR}



                            echo "==> Running Django migrations..."
                            docker-compose exec -T backend python manage.py migrate

                            echo "==> Running seed data..."
                            docker-compose exec -T backend python manage.py shell < seed_data.py
                        '
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    sleep time: 15, unit: 'SECONDS'

                    def backendHealthy  = false
                    def frontendHealthy = false

                    for (int i = 1; i <= 5; i++) {
                        def httpCode = sh(
                            script: "curl -s -o /dev/null -w '%{http_code}' http://10.10.20.251/api/health/",
                            returnStdout: true
                        ).trim()
                        echo "Backend health check attempt ${i}/5 — HTTP ${httpCode}"
                        if (httpCode == '200') {
                            backendHealthy = true
                            break
                        }
                        if (i < 5) sleep time: 10, unit: 'SECONDS'
                    }

                    def frontendCode = sh(
                        script: "curl -s -o /dev/null -w '%{http_code}' http://10.10.20.251/",
                        returnStdout: true
                    ).trim()
                    echo "Frontend health check — HTTP ${frontendCode}"
                    frontendHealthy = (frontendCode == '200')

                    if (!backendHealthy) {
                        error "❌ Backend health check failed after 5 attempts"
                    }
                    if (!frontendHealthy) {
                        echo "⚠️  Warning: Frontend not returning 200 (got ${frontendCode})"
                    }

                    echo "✅ Deployment verified"
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful!'
            sh '''
                echo "==================================="
                echo "🎉 DEPLOYMENT COMPLETE 🎉"
                echo "==================================="
                echo "Frontend:    http://10.10.20.251"
                echo "Backend API: http://10.10.20.251/api/"
                echo "Admin:       http://10.10.20.251/admin/"
                echo "==================================="
            '''
        }
        failure {
            echo '❌ Deployment failed'
            sshagent(['deploy-server']) {
                sh """
                    echo "Fetching diagnostic information..."
                    ssh -o StrictHostKeyChecking=no ${APP_SERVER} \
                        "cd ${APP_DIR} && docker-compose logs --tail=100" \
                         echo "Could not fetch logs"
                    ssh -o StrictHostKeyChecking=no ${APP_SERVER} \
                        "cd ${APP_DIR} && docker-compose ps" \
                         echo "Could not check status"
                """
            }
        }
        always {
            sh 'docker logout || true'
        }
    }
}