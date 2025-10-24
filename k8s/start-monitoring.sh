#!/bin/bash

echo "🧹 Cleaning up old port forwards..."
pkill -f "port-forward"
sleep 2

echo "🚀 Starting port forwards..."

# Start all port forwards in background
kubectl port-forward -n microservices-monitoring svc/my-prometheus-server 9090:80 > /dev/null 2>&1 &
kubectl port-forward -n microservices-monitoring svc/grafana 3001:80 > /dev/null 2>&1 &
kubectl port-forward -n microservices-monitoring svc/job-submitter 8080:80 > /dev/null 2>&1 &
kubectl port-forward -n microservices-monitoring svc/job-stats 3002:3002 > /dev/null 2>&1 &

sleep 3

echo "✅ All services ready!"
echo ""
echo "📊 Prometheus:    http://localhost:9090"
echo "📈 Grafana:       http://localhost:3001 (admin/admin123)"
echo "🔧 Job Submitter: http://localhost:8080"
echo "📉 Job Stats:     http://localhost:3002"
echo ""
echo "Test with:"
echo "curl -X POST http://localhost:8080/api/submit -H 'Content-Type: application/json' -d '{\"type\":\"prime\"}'"
