from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class EntityResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class EmployeeResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: str
    entity_id: Optional[str] = None

    class Config:
        populate_by_name = True
