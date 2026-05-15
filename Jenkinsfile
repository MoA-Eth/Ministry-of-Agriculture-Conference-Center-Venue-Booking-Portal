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

        stage('Deploy') {
    steps {
        sshagent(['deploy-server']) {
            sh """
                echo "==> Preparing remote directory..."
                ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'mkdir -p ${APP_DIR}'

                echo "==> Copying deployment files..."
                scp -o StrictHostKeyChecking=no docker-compose.yml ${APP_SERVER}:${APP_DIR}/
                scp -o StrictHostKeyChecking=no -r nginx ${APP_SERVER}:${APP_DIR}/ || true

                echo "==> Transferring images..."
                docker save moa-backend:latest  | ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'docker load'
                docker save moa-frontend:latest | ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'docker load'

                echo "==> Deploying containers..."
                ssh -o StrictHostKeyChecking=no ${APP_SERVER} "
                    cd ${APP_DIR}

                    docker-compose up -d --no-build

                    sleep 10

                    docker-compose exec -T backend python manage.py migrate --no-input || true
                    docker-compose exec -T backend python manage.py collectstatic --no-input || true

                    docker image prune -f

                    docker-compose ps
                "
            """
        }
    }
}

        stage('Health Check') {
            steps {
                sh 'sleep 10'
                sh 'curl -f http://10.10.20.251/api/health/ || exit 1'
            }
        }
    }

    post {
        success { echo '✅ Deployed successfully!' }
        failure { echo '❌ Deployment failed — check logs above' }
        always  { sh 'docker logout || true' }
    }
}