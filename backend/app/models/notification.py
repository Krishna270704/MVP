from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NotificationCreate(BaseModel):
    user_id: str
    message: str
    type: str  # visitor_arrival | visitor_approved | visitor_declined
    visitor_id: str


class NotificationResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    message: str
    type: str
    visitor_id: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class NotificationInDB(BaseModel):
    user_id: str
    message: str
    type: str
    visitor_id: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
