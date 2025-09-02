# 🚀 Jenkins Automated Pipeline for Node.js Express App

## 📌 Project Overview
Earlier, while learning **Web Development**, I created a **Node.js + Express.js app** (live at 👉 [postwebapp.onrender.com](https://postwebapp.onrender.com)).  

As a **DevOps learner**, I extended this project by automating its build, test, and deployment process using **Jenkins** and **Docker**.  
To get started, I took reference from this [YouTube tutorial](https://www.youtube.com/watch?v=XaSdKR2fOU4) and then customized it for my own use case.  

This documentation explains the setup, pipeline stages, and workflow.

---

## ⚙️ Jenkins Setup
1. Installed and configured **Jenkins** on a server (accessible at `http://localhost:8080`).  
2. Logged in with credentials and set up Jenkins as the **Automation Server**.  
3. Created a new **Pipeline project** in Jenkins and linked it with my GitHub repo.  
4. Configured a **GitHub Webhook** so every commit triggers the pipeline automatically.

📸 *Suggested Screenshot*: Jenkins Dashboard after setup.  

---

## 🔗 Repository
Source Code Repo: [Jenkins Automated Express App](https://github.com/Parikshit-Wayal/jenkins_automated_ExpressApp)  

---

## 🛠️ Pipeline Stages

The pipeline was written in **Groovy syntax** inside `Jenkinsfile`.  
Below are the defined stages:

```
Developer Commit → GitHub → Jenkins → Docker Build → DockerHub → Deploy Container (Port 3006)
```

---

```groovy
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
                // Example: mocha/jest
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
