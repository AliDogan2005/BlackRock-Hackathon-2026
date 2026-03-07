#!/bin/bash
# Start the tokenapp scheduler
# This script runs the scheduler that syncs prices every 6 hours

PROJECT_DIR="/Users/alidogan/Projects/Hackathon/HackathonProject/backend-python"
SCHEDULER_SCRIPT="$PROJECT_DIR/scheduler.py"
LOG_FILE="$PROJECT_DIR/scheduler.log"

echo "Starting Tokenapp Price Scheduler..."
echo "Project Directory: $PROJECT_DIR"
echo "Log File: $LOG_FILE"
echo ""

cd "$PROJECT_DIR"

# Kill any existing scheduler processes
pkill -f "python3 scheduler.py" 2>/dev/null || true
sleep 1

# Start scheduler in foreground (will stop when terminal closes)
echo "✅ Scheduler started"
echo ""
echo "Scheduler will:"
echo "  - Run prices.py every 6 hours"
echo "  - Sync updated prices with Spring Boot backend"
echo "  - Log all activities to scheduler.log"
echo ""
echo "When terminal closes, scheduler will stop."
echo "Press Ctrl+C to stop."
echo ""

python3 "$SCHEDULER_SCRIPT"

