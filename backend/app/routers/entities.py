from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.auth.dependencies import get_current_user, validate_object_id
from bson import ObjectId

router = APIRouter(prefix="/entities", tags=["Entities"])


@router.get("")
async def list_entities(current_user: dict = Depends(get_current_user)):
    """List all entities."""
    db = get_db()
    entities = []
    async for entity in db.entities.find():
        entities.append(
            {
                "_id": str(entity["_id"]),
                "name": entity["name"],
                "created_at": entity.get("created_at"),
            }
        )
    return entities


@router.get("/{entity_id}/employees")
async def list_entity_employees(
    entity_id: str, current_user: dict = Depends(get_current_user)
):
    """List employees belonging to an entity."""
    oid = validate_object_id(entity_id, "entity_id")

    db = get_db()
    # Verify entity exists
    entity = await db.entities.find_one({"_id": oid})
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entity not found",
        )

    employees = []
    async for user in db.users.find({"entity_id": oid, "role": "employee"}):
        employees.append(
            {
                "_id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "entity_id": str(user["entity_id"]),
            }
        )
    return employees
