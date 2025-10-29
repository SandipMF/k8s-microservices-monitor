#!/bin/bash

# Configuration
SUBMITTER_URL="http://localhost:8080"
NUM_JOBS=1000
CONCURRENT=50

echo "Starting Load Test"
echo "Target: $SUBMITTER_URL"
echo "Jobs: $NUM_JOBS"
echo "Concurrent: $CONCURRENT"
echo ""

# Function to submit a job
submit_job() {
    local types=("prime" "bcrypt" "sort")
    local random_index=$((RANDOM % 3))
    local job_type=${types[$random_index]}
    
    curl -s -X POST "$1/api/submit" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"$job_type\"}" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -n "."
    else
        echo -n "X"
    fi
}

export -f submit_job

# Run load test
echo "Submitting jobs..."
seq $NUM_JOBS | xargs -P $CONCURRENT -I {} bash -c "submit_job $SUBMITTER_URL"

echo ""
echo ""
echo "Load test completed!"
echo ""
echo "Check results:"
echo "  Stats API: curl http://localhost:3002/api/stats | jq"
echo "  Grafana: http://localhost:3001"
echo "  Prometheus: http://localhost:9090"
