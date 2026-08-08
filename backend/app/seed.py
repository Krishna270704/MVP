from app.database import get_db
from app.auth.utils import hash_password
from datetime import datetime


async def seed_data():
    """Seed demo entities and users safely."""

    db = get_db()

    print("Checking demo data...")

    # ---------------------------------------------------------
    # 1. Create entities if they don't already exist
    # ---------------------------------------------------------

    abc_entity = await db.entities.find_one(
        {"name": "ABC Technologies"}
    )

    if not abc_entity:
        abc_result = await db.entities.insert_one(
            {
                "name": "ABC Technologies",
                "created_at": datetime.utcnow(),
            }
        )
        abc_id = abc_result.inserted_id
        print("Created entity: ABC Technologies")
    else:
        abc_id = abc_entity["_id"]
        print("Entity already exists: ABC Technologies")

    xyz_entity = await db.entities.find_one(
        {"name": "XYZ Solutions"}
    )

    if not xyz_entity:
        xyz_result = await db.entities.insert_one(
            {
                "name": "XYZ Solutions",
                "created_at": datetime.utcnow(),
            }
        )
        xyz_id = xyz_result.inserted_id
        print("Created entity: XYZ Solutions")
    else:
        xyz_id = xyz_entity["_id"]
        print("Entity already exists: XYZ Solutions")

    # ---------------------------------------------------------
    # 2. Create demo users if they don't already exist
    # ---------------------------------------------------------

    demo_users = [
        {
            "name": "Reception Desk",
            "email": "reception@demo.com",
            "password": "Reception@123",
            "role": "receptionist",
            "entity_id": None,
        },
        {
            "name": "Amit Kumar",
            "email": "amit@demo.com",
            "password": "Employee@123",
            "role": "employee",
            "entity_id": abc_id,
        },
        {
            "name": "Rahul Sharma",
            "email": "rahul@demo.com",
            "password": "Employee@123",
            "role": "employee",
            "entity_id": xyz_id,
        },
    ]

    created_users = 0

    for user_data in demo_users:

        existing_user = await db.users.find_one(
            {"email": user_data["email"]}
        )

        if existing_user:
            print(f"User already exists: {user_data['email']}")
            continue

        user = {
            "name": user_data["name"],
            "email": user_data["email"],
            "password_hash": hash_password(
                user_data["password"]
            ),
            "role": user_data["role"],
            "entity_id": user_data["entity_id"],
            "created_at": datetime.utcnow(),
        }

        await db.users.insert_one(user)

        created_users += 1

        print(f"Created user: {user_data['email']}")

    # ---------------------------------------------------------
    # 3. Summary
    # ---------------------------------------------------------

    total_entities = await db.entities.count_documents({})
    total_users = await db.users.count_documents({})

    print("\nDemo data check completed.")
    print(f"Total entities: {total_entities}")
    print(f"Total users: {total_users}")
    print(f"New users created: {created_users}")

    print("\nDemo credentials:")
    print("Receptionist: reception@demo.com / Reception@123")
    print("Employee:     amit@demo.com / Employee@123")
    print("Employee:     rahul@demo.com / Employee@123")