from typing import Optional
# pyrefly: ignore [missing-import]
from mongomock_motor import AsyncMongoMockClient
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.config import settings

client: Optional[AsyncMongoMockClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_db():
    global client, db
    client = AsyncMongoMockClient()
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
