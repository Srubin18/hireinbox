#!/bin/bash
# HIREINBOX Training Pipeline Runner
# Run this to generate synthetic training data

cd "$(dirname "$0")"

# Load environment variables
if [ -f "../../.env.local" ]; then
  export $(grep -v '^#' ../../.env.local | grep -E '^[A-Z]' | xargs)
fi

echo "Starting HIREINBOX Training Data Pipeline..."
echo "Estimated time: 2-3 hours"
echo "Estimated cost: ~\$50-70"
echo ""
echo "Output will be saved to: scripts/training-data/data/"
echo "Logs saved to: scripts/training-data/pipeline.log"
echo ""

# Run the pipeline
npx ts-node run-pipeline.ts 2>&1 | tee pipeline.log
