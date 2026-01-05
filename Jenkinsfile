pipeline {
    agent any
    
    stages {
        stage('Code') {
            steps {
                echo "Cloning code from repo"
                git url: "https://github.com/Parikshit-Wayal/jenkins_automated_ExpressApp.git", branch:"main"
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies'
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running minimal tests'
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                echo "Building Docker image for Express App"
                sh "docker build -t expressapp:latest ."
            }
        }

        stage('Push Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerHubCred', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        sh 'docker login -u $USER -p $PASS'
                        sh 'docker tag expressapp:latest parikshit1212/expressapp:latest'
                        sh 'docker push parikshit1212/expressapp:latest'
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                echo "Deploying container locally"
                sh 'docker run -d -p 3006:3006 --name expressapp expressapp:latest'
            }
        }
    }
}

