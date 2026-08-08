from fastapi import APIRouter, HTTPException, status
from app.models.user import LoginRequest, TokenResponse, UserResponse
from app.auth.utils import verify_password, create_access_token
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": request.email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Get entity name if user has entity_id
    entity_name = None
    if user.get("entity_id"):
        entity = await db.entities.find_one({"_id": user["entity_id"]})
        if entity:
            entity_name = entity["name"]

    token_data = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "entity_id": str(user["entity_id"]) if user.get("entity_id") else None,
    }
    access_token = create_access_token(token_data)

    user_response = UserResponse(
        _id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        entity_id=str(user["entity_id"]) if user.get("entity_id") else None,
        entity_name=entity_name,
    )

    return TokenResponse(
        access_token=access_token,
        user=user_response,
    )
