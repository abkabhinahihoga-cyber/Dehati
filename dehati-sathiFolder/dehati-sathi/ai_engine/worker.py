import os
import time
import redis
from dotenv import load_dotenv
from recommender import generate_recommendations

load_dotenv(dotenv_path="../.env.local")

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)
QUEUE_NAME = "queue:ai_tasks"

print(f"🤖 AI Queue Worker Started. Listening on '{QUEUE_NAME}'...")

def start_worker():
    while True:
        try:
            # BLPOP blocks until a message is pushed to the queue
            result = redis_client.blpop(QUEUE_NAME, timeout=0)
            if result:
                _, message = result
                print(f"📥 Received Trigger: {message}. Running AI Engine...")
                
                # In a real heavy system, you would only run it for the specific user in the message.
                # Here we are running the global recommendation sweep.
                generate_recommendations()
                
        except Exception as e:
            print(f"⚠️ Worker Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    start_worker()
