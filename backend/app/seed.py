from app.database import get_db
from app.auth.utils import hash_password
from datetime import datetime


async def seed_data():
    """Seed demo entities and users. Idempotent — skips if data already exists."""
    db = get_db()

    # Check if already seeded
    existing_entities = await db.entities.count_documents({})
    if existing_entities > 0:
        print("Database already seeded, skipping...")
        return

    print("Seeding demo data...")

    # Create entities
    abc_result = await db.entities.insert_one(
        {"name": "ABC Technologies", "created_at": datetime.utcnow()}
    )
    xyz_result = await db.entities.insert_one(
        {"name": "XYZ Solutions", "created_at": datetime.utcnow()}
    )

    abc_id = abc_result.inserted_id
    xyz_id = xyz_result.inserted_id

    # Create users
    users = [
        {
            "name": "Reception Desk",
            "email": "reception@demo.com",
            "password_hash": hash_password("Reception@123"),
            "role": "receptionist",
            "entity_id": None,
            "created_at": datetime.utcnow(),
        },
        {
            "name": "Amit Kumar",
            "email": "amit@demo.com",
            "password_hash": hash_password("Employee@123"),
            "role": "employee",
            "entity_id": abc_id,
            "created_at": datetime.utcnow(),
        },
        {
            "name": "Rahul Sharma",
            "email": "rahul@demo.com",
            "password_hash": hash_password("Employee@123"),
            "role": "employee",
            "entity_id": xyz_id,
            "created_at": datetime.utcnow(),
        },
    ]

    await db.users.insert_many(users)

    print(f"Seeded 2 entities and {len(users)} users:")
    print(f"  - reception@demo.com / Reception@123 (Receptionist)")
    print(f"  - amit@demo.com / Employee@123 (Employee @ ABC Technologies)")
    print(f"  - rahul@demo.com / Employee@123 (Employee @ XYZ Solutions)")
