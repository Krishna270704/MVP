from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    assert client is not None
    db = client[settings.DATABASE_NAME]
    assert db is not None
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.visitors.create_index("mobile")
    await db.visitors.create_index("host_employee_id")
    await db.visitors.create_index("status")
    await db.notifications.create_index("user_id")
    print(f"Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database not initialized")
    return db