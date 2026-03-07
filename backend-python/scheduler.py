#!/usr/bin/env python3
"""
Scheduler for periodic price updates
Runs prices.py every 6 hours and syncs with Spring Boot backend
"""

import os
import json
import time
import schedule
import requests
import logging
from datetime import datetime
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
PRICES_SCRIPT = os.path.join(os.path.dirname(__file__), 'prices.py')
PRICES_OUTPUT = os.path.join(os.path.dirname(__file__), 'prices_output.json')
SPRING_BOOT_URL = "http://localhost:8080/api/shares/sync/from-prices"
SYNC_INTERVAL_HOURS = 1  # Run every 1 hours

def run_prices_script():
    """Run the prices.py script to generate/update prices_output.json"""
    try:
        logger.info("Starting prices.py execution...")
        os.system(f"python {PRICES_SCRIPT}")
        logger.info("prices.py execution completed")
        return True
    except Exception as e:
        logger.error(f"Error running prices.py: {e}")
        return False

def sync_shares_with_backend():
    """Read prices_output.json and sync with Spring Boot backend"""
    try:
        if not os.path.exists(PRICES_OUTPUT):
            logger.warning(f"prices_output.json not found at {PRICES_OUTPUT}")
            return False

        logger.info("Reading prices_output.json...")
        with open(PRICES_OUTPUT, 'r') as f:
            prices_data = json.load(f)

        logger.info(f"Syncing prices with Spring Boot at {SPRING_BOOT_URL}...")
        response = requests.post(
            SPRING_BOOT_URL,
            json=prices_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            logger.info(f"✅ Sync successful! Response: {result}")
            return True
        else:
            logger.error(f"❌ Sync failed with status {response.status_code}: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        logger.error("❌ Could not connect to Spring Boot server. Is it running at http://localhost:8080?")
        return False
    except Exception as e:
        logger.error(f"❌ Error syncing shares: {e}")
        return False

def scheduled_task():
    """Main scheduled task: run prices and sync with backend"""
    logger.info("="*60)
    logger.info(f"Starting scheduled task at {datetime.now()}")
    logger.info("="*60)

    # Step 1: Run prices.py
    if run_prices_script():
        # Step 2: Sync with backend
        sync_shares_with_backend()
    else:
        logger.error("Skipping sync due to prices.py failure")

    logger.info("="*60)
    logger.info(f"Scheduled task completed at {datetime.now()}")
    logger.info("="*60)

def start_scheduler():
    """Start the scheduler that runs every N hours"""
    logger.info(f"Scheduler started. Will run every {SYNC_INTERVAL_HOURS} hours")

    # Schedule the task
    schedule.every(SYNC_INTERVAL_HOURS).hours.do(scheduled_task)

    # Run initial task immediately (optional - comment out if you don't want initial run)
    logger.info("Running initial sync...")
    scheduled_task()

    # Keep scheduler running
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute if task needs to run
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user")

if __name__ == "__main__":
    logger.info("Tokenapp Price Scheduler Starting...")
    logger.info(f"Configuration:")
    logger.info(f"  - Prices Script: {PRICES_SCRIPT}")
    logger.info(f"  - Prices Output: {PRICES_OUTPUT}")
    logger.info(f"  - Spring Boot URL: {SPRING_BOOT_URL}")
    logger.info(f"  - Sync Interval: {SYNC_INTERVAL_HOURS} hours")
    logger.info("")

    start_scheduler()

