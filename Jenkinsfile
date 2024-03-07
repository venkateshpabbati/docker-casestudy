pipeline {
    agent any

    environment {
        NODEJS_VERSION = '20.11.0'  
        MONGODB_URL = 'mongodb://localhost:27017/testDB'  
    }

      tools {
        nodejs 'Node.js'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    def nodejsHome = tool name: 'Node.js', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
                    env.PATH = "${nodejsHome}/bin:${env.PATH}"

                    // Install Node.js dependencies
                    sh 'npm install'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    sh 'npm test'
                }
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    env.MONGODB_URL = MONGODB_URL

                    sh 'npm run build'
                    sh 'npm start'
                }
            }
        }
    }
}
