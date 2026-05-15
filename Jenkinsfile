pipeline {
    agent { label 'built-in' }

    environment {
        APP_SERVER = 'cms@10.10.20.251'
        APP_DIR    = '/home/cms/conference-system'
        REPO_URL   = 'https://github.com/MoA-Eth/Ministry-of-Agriculture-Conference-Center-Venue-Booking-Portal.git'
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
                        
                        # Copy .env if exists
                        if [ -f .env ]; then
                            scp -o StrictHostKeyChecking=no .env ${APP_SERVER}:${APP_DIR}/
                        else
                            echo "⚠️  Warning: .env file not found locally"
                        fi

                        echo "==> Loading Docker images on remote server..."
                        # Use compression to avoid corruption and suppress output
                        docker save moa-backend:latest | gzip | ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'gunzip | docker load'
                        docker save moa-frontend:latest | gzip | ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'gunzip | docker load'

                        echo "==> Deploying containers..."
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} "
                            cd ${APP_DIR}
                            
                            # Create default .env if missing
                            if [ ! -f .env ]; then
                                echo 'Creating default .env file...'
                                cat > .env << 'EOF'
SECRET_KEY=\$(openssl rand -base64 50)
DEBUG=False
DB_PASSWORD=StrongP@ssw0rd123
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
VITE_API_BASE=http://10.10.20.251:8000/api
EOF
                            fi
                            
                            # Stop and remove old containers
                            docker-compose down --remove-orphans || true
                            
                            # Start new containers
                            docker-compose up -d --no-build
                            
                            # Wait for database to be ready
                            echo 'Waiting for database...'
                            sleep 10
                            
                            # Check container status
                            echo ''
                            echo 'Container Status:'
                            docker-compose ps
                            
                            echo ''
                            echo 'Backend logs:'
                            docker-compose logs --tail=30 backend
                            
                            # Test backend internally
                            echo ''
                            echo 'Testing backend internally...'
                            docker-compose exec -T backend curl -s http://localhost:8000/api/health/ || echo 'Health endpoint not yet available'
                            
                            # Cleanup
                            docker system prune -f
                        "
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    // Give containers time to fully initialize
                    sleep time: 15, unit: 'SECONDS'
                    
                    // Test backend health
                    def backendHealthy = false
                    def frontendHealthy = false
                    
                    // Try multiple attempts for backend
                    for (int i = 0; i < 5; i++) {
                        def backendCheck = sh(
                            script: "curl -s -o /dev/null -w '%{http_code}' http://10.10.20.251:8000/api/health/",
                            returnStatus: true
                        )
                        if (backendCheck == 0) {
                            backendHealthy = true
                            break
                        }
                        echo "Waiting for backend... attempt ${i+1}/5"
                        sleep time: 5, unit: 'SECONDS'
                    }
                    
                    // Test frontend
                    def frontendCheck = sh(
                        script: "curl -s -o /dev/null -w '%{http_code}' http://10.10.20.251/",
                        returnStatus: true
                    )
                    if (frontendCheck == 0) {
                        frontendHealthy = true
                    }
                    
                    if (!backendHealthy) {
                        error "Backend health check failed"
                    }
                    
                    if (!frontendHealthy) {
                        echo "⚠️  Warning: Frontend not responding (might be config issue)"
                    }
                    
                    echo "✅ Backend is healthy"
                }
            }
        }
    }

    post {
        success { 
            echo '✅ Deployment successful!'
            sh '''
                echo ""
                echo "==================================="
                echo "🎉 DEPLOYMENT COMPLETE 🎉"
                echo "==================================="
                echo "Frontend:    http://10.10.20.251"
                echo "Backend API: http://10.10.20.251:8000/api/"
                echo "Admin:       http://10.10.20.251:8000/admin/"
                echo "==================================="
            '''
        }
        failure { 
            echo '❌ Deployment failed'
            sh '''
                echo "Fetching diagnostic information..."
                ssh -o StrictHostKeyChecking=no ${APP_SERVER} "cd ${APP_DIR} && docker-compose logs --tail=100" || echo "Could not fetch logs"
                ssh -o StrictHostKeyChecking=no ${APP_SERVER} "cd ${APP_DIR} && docker-compose ps" || echo "Could not check status"
            '''
        }
        always { 
            sh 'docker logout || true'
        }
    }
}