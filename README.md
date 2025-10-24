# Kubernetes Microservices Monitoring System (TypeScript + MongoDB)

Production-ready microservices architecture with TypeScript, MongoDB, Redis, Kubernetes autoscaling, and Prometheus monitoring.

## Architecture

- **job-submitter**: REST API for job submission (TypeScript + Express + MongoDB)
- **job-worker**: Scalable worker processing jobs (TypeScript + BullMQ + CPU-intensive tasks)
- **job-stats**: Analytics and metrics aggregation (TypeScript + MongoDB aggregation)
- **MongoDB**: Persistent job storage with indexing
- **Redis**: Message queue (BullMQ)
- **Prometheus + Grafana**: Monitoring and visualization

## Prerequisites

### Install Required Tools

1. **Docker Desktop** (v24+)
macOS
brew install --cask docker
Windows: Download from docker.com
Linux: https://docs.docker.com/engine/install/


2. **Minikube** (v1.32+)
macOS
brew install minikube
Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 sudo install minikube-linux-amd64 /usr/local/bin/minikube
Windows
choco install minikube


3. **kubectl** (v1.28+)
macOS
brew install kubectl
Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" sudo install kubectl /usr/local/bin/
Windows
choco install kubernetes-cli


4. **Helm** (v3.13+)
macOS/Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
Windows
choco install kubernetes-helm


5. **Apache Bench** (for load testing)
macOS
brew install httpd
Linux
sudo apt-get install apache2-utils
Windows: included with Apache


## Step-by-Step Deployment

### 1. Start Minikube Cluster
minikube start --cpus=4 --memory=8192 --driver=docker minikube addons enable metrics-server minikube addons enable ingress


### 2. Build and Push Docker Images

**Important**: Replace `your-dockerhub-username` with your actual Docker Hub username in all commands and YAML files.

Login to Docker Hub
docker login
Build job-submitter
cd services/job-submitter docker build -t your-dockerhub-username/job-submitter:latest . docker push your-dockerhub-username/job-submitter:latest
Build job-worker
cd ../job-worker docker build -t your-dockerhub-username/job-worker:latest . docker push your-dockerhub-username/job-worker:latest
Build job-stats
cd ../job-stats
docker build -t your-dockerhub-username/job-stats:latest . docker push your-dockerhub-username/job-stats:latest
cd ../..


### 3. Deploy Infrastructure
Create namespace
kubectl apply -f k8s/namespace.yaml
Deploy databases
kubectl apply -f k8s/mongodb.yaml kubectl apply -f k8s/redis.yaml
Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n microservices-monitoring --timeout=120s kubectl wait --for=condition=ready pod -l app=redis -n microservices-monitoring --timeout=120s


### 4. Deploy Services
kubectl apply -f k8s/job-submitter-deployment.yaml kubectl apply -f k8s/job-worker-deployment.yaml kubectl apply -f k8s/job-stats-deployment.yaml kubectl apply -f k8s/hpa.yaml kubectl apply -f k8s/ingress.yaml


### 5. Verify Deployment
Check all pods are running
kubectl get pods -n microservices-monitoring
Check HPA status
kubectl get hpa -n microservices-monitoring
Check services
kubectl get svc -n microservices-monitoring


### 6. Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts helm repo update
helm install prometheus prometheus-community/prometheus  --namespace microservices-monitoring  --set server.persistentVolume.enabled=false  --set server.service.type=NodePort  --set alertmanager.enabled=false


### 7. Install Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana  --namespace microservices-monitoring  --set service.type=NodePort  --set adminPassword=admin123


## Access Services

### Get Service URLs
Job Submitter API
minikube service job-submitter -n microservices-monitoring --url
Prometheus
kubectl port-forward -n microservices-monitoring svc/prometheus-server 9090:80
Grafana
kubectl port-forward -n microservices-monitoring svc/grafana 3000:80
Access: http://localhost:3000 (admin/admin123)


## API Testing

### Submit Jobs
export API_URL=$(minikube service job-submitter -n microservices-monitoring --url)
Submit prime calculation job
curl -X POST $API_URL/api/submit  -H "Content-Type: application/json"  -d '{"type":"prime"}'
Submit bcrypt hashing job
curl -X POST $API_URL/api/submit  -H "Content-Type: application/json"  -d '{"type":"bcrypt"}'
Submit array sorting job
curl -X POST $API_URL/api/submit  -H "Content-Type: application/json"  -d '{"type":"sort"}'


### Check Job Status
Replace JOB_ID with actual ID from submit response
curl $API_URL/api/status/JOB_ID


### View Statistics
kubectl port-forward -n microservices-monitoring svc/job-stats 3002:3002
Get comprehensive stats
curl http://localhost:3002/api/stats
Get analytics
curl http://localhost:3002/api/analytics



### View Metrics
Worker metrics
kubectl port-forward -n microservices-monitoring svc/job-worker 3001:3001 curl http://localhost:3001/metrics
Stats metrics
curl http://localhost:3002/metrics



## Load Testing

### Prepare Test
Create payload file
echo '{"type":"prime"}' > payload.json
Get API endpoint
export API_URL=$(minikube service job-submitter -n microservices-monitoring --url)


### Run Stress Test
Submit 5000 jobs with 200 concurrent requests
ab -n 5000 -c 200 -p payload.json -T application/json $API_URL/api/submit


### Monitor During Test

**Terminal 1 - Watch HPA:**
watch -n 1 kubectl get hpa -n microservices-monitoring


**Terminal 2 - Watch Pods:**
watch -n 1 "kubectl get pods -n microservices-monitoring | grep job-worker"


**Terminal 3 - Watch Queue:**
watch -n 2 "curl -s http://localhost:3002/api/stats | jq '.queue'"


## Grafana Dashboard Setup

1. Access Grafana: http://localhost:3000
2. Login: admin / admin123
3. Add Data Source:
   - Type: Prometheus
   - URL: http://prometheus-server.microservices-monitoring.svc.cluster.local
   - Save & Test

4. Create Dashboard with panels:

**Panel 1: Jobs Processed Rate**
rate(jobs_processed_total[5m])


**Panel 2: Queue Length**
queue_length


**Panel 3: Job Processing Time (95th percentile)**
histogram_quantile(0.95, rate(job_processing_time_seconds_bucket[5m]))


**Panel 4: Worker CPU Usage**
rate(container_cpu_usage_seconds_total{namespace="microservices-monitoring",pod=~"job-worker.*"}[5m]) * 100


**Panel 5: Worker Replicas**
count(kube_pod_info{namespace="microservices-monitoring",pod=~"job-worker.*"})


**Panel 6: Job Errors**
sum(job_errors_total)


## Expected Behavior During Load Test

1. **Initial State**: 2 job-worker replicas
2. **Load Applied**: Queue length increases, CPU usage spikes
3. **Scaling Triggered**: When CPU > 70%, HPA adds replicas (up to 10)
4. **Processing**: Multiple workers consume queue in parallel
5. **Queue Drains**: As workers process jobs, queue length decreases
6. **Scale Down**: After load, HPA gradually reduces replicas

## Troubleshooting

### Check Pod Logs
Job submitter logs
kubectl logs -f deployment/job-submitter -n microservices-monitoring
Job worker logs
kubectl logs -f deployment/job-worker -n microservices-monitoring
Job stats logs
kubectl logs -f deployment/job-stats -n microservices-monitoring


### Check MongoDB Connection
kubectl exec -it deployment/mongodb -n microservices-monitoring -- mongosh jobs_db --eval "db.jobs.countDocuments()"


### Check Redis Queue
kubectl exec -it deployment/redis -n microservices-monitoring -- redis-cli

LLEN bull:jobs:wait LLEN bull:jobs:active


### Reset Everything
Delete all jobs from MongoDB
kubectl exec -it deployment/mongodb -n microservices-monitoring -- mongosh jobs_db --eval "db.jobs.deleteMany({})"
Clear Redis
kubectl exec -it deployment/redis -n microservices-monitoring -- redis-cli FLUSHALL


## Cleanup
helm uninstall prometheus -n microservices-monitoring helm uninstall grafana -n microservices-monitoring kubectl delete namespace microservices-monitoring minikube stop minikube delete



## Project Structure Benefits

- **TypeScript**: Type safety, better IDE support, fewer runtime errors
- **MongoDB**: Persistent storage, powerful aggregations, indexing
- **Redis + BullMQ**: Fast message queue with retry logic
- **src/ folder**: Clean code organization, separation of concerns
- **Docker multi-stage builds**: Smaller images, faster deployments
- **Kubernetes HPA**: Automatic scaling based on CPU/memory
- **Prometheus metrics**: Custom business metrics + system metrics
- **Microservices**: Independent scaling, easier maintenance

## Key Metrics to Observe

- `jobs_processed_total`: Total jobs completed
- `job_processing_time_seconds`: How long jobs take
- `job_errors_total`: Failed job count
- `queue_length`: Current backlog
- `total_jobs_completed`: Cumulative completions



