from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: str
    role: str
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None

    class Config:
        populate_by_name = True


class UserInDB(BaseModel):
    name: str
    email: str
    password_hash: str
    role: str  # "receptionist" | "employee"
    entity_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
