import os
import json
import pymongo
import redis
import google.generativeai as genai
from dotenv import load_dotenv
from collections import Counter
from bson.objectid import ObjectId

# Load Env
load_dotenv(dotenv_path="../.env.local")

# Connect to DBs
print("🔌 Connecting to MongoDB & Redis...")
mongo_uri = os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI")
mongo_client = pymongo.MongoClient(mongo_uri)

try:
    db = mongo_client.get_default_database()
except pymongo.errors.ConfigurationError:
    print("⚠️ No DB name in URI. Defaulting to 'test' database.")
    db = mongo_client["test"] 

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
generation_config = {"response_mime_type": "application/json"}
model = genai.GenerativeModel('gemini-1.5-flash', generation_config=generation_config)

print("🧠 AI Worker Started with Google Generative AI...")

def generate_recommendations():
    users = db.users.find({})
    
    for user in users:
        user_id = str(user["_id"])
        user_name = user.get("name", "Unknown")
        
        # --- 1. GATHER USER CONTEXT ---
        past_orders = list(db.orders.find({"user": ObjectId(user_id)}))
        if not past_orders:
            past_orders = list(db.orders.find({"userId": ObjectId(user_id)}))

        if not past_orders:
            continue 
        
        print(f"Analyzing User: {user_name} ({len(past_orders)} orders)")
        
        viewed_products = set()
        user_history = []

        for order in past_orders:
            for item in order.get("items", []):
                p_id = item.get("productId") or item.get("product") or item.get("_id")
                name = item.get("name", "Unknown Product")
                cat = item.get("category", "Unknown Category")
                
                user_history.append({"name": name, "category": cat})
                if p_id: viewed_products.add(str(p_id))

        if not user_history:
            continue

        # Fetch available catalog samples to rank
        available_groceries = list(db.groceries.find({
            "productType": {"$ne": "book"},
            "_id": {"$nin": [ObjectId(pid) for pid in viewed_products]}
        }).limit(50))
        
        available_books = list(db.groceries.find({
            "productType": "book",
            "_id": {"$nin": [ObjectId(pid) for pid in viewed_products]}
        }).limit(50))

        # --- 2. AI DYNAMIC RANKING ---
        grocery_catalog = [{"id": str(g["_id"]), "name": g.get("name"), "category": g.get("category")} for g in available_groceries]
        book_catalog = [{"id": str(b["_id"]), "name": b.get("name"), "category": b.get("category")} for b in available_books]

        prompt = f"""
        You are an AI recommendation engine for a rural SaaS platform.
        The user has previously bought: {json.dumps(user_history)}
        
        Based on this history, rank the following grocery catalog and book catalog by predicting what the user is most likely to buy next. 
        Focus on relevance to rural demographics (e.g., farming supplies, essential grains, relevant textbooks).
        
        Grocery Catalog: {json.dumps(grocery_catalog)}
        Book Catalog: {json.dumps(book_catalog)}
        
        Return a JSON object with exactly two keys: "recommended_grocery_ids" (list of top 10 string IDs) and "recommended_book_ids" (list of top 10 string IDs).
        """
        
        try:
            response = model.generate_content(prompt)
            ranked_data = json.loads(response.text)
            grocery_ids = ranked_data.get("recommended_grocery_ids", [])
            student_ids = ranked_data.get("recommended_book_ids", [])
        except Exception as e:
            print(f"❌ AI Generation Failed for {user_name}: {e}")
            continue

        # --- 3. SAVE TO SEPARATE KEYS ---
        if grocery_ids:
            key_g = f"user:rec:{user_id}:grocery"
            redis_client.delete(key_g)
            redis_client.rpush(key_g, *grocery_ids)
            redis_client.expire(key_g, 86400)
            print(f" -> 🥦 Saved {len(grocery_ids)} AI Grocery Recs")

        if student_ids:
            key_s = f"user:rec:{user_id}:student"
            redis_client.delete(key_s)
            redis_client.rpush(key_s, *student_ids)
            redis_client.expire(key_s, 86400)
            print(f" -> 📚 Saved {len(student_ids)} AI Student Recs")

if __name__ == "__main__":
    generate_recommendations()
    print("✨ AI Analysis Complete. Sleeping...")