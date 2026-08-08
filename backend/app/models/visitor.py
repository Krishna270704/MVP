from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VisitorCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Visitor name")
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$", description="Indian mobile number")
    company: str = Field(default="", description="Visitor company/organization")
    purpose: str = Field(..., min_length=1, description="Purpose of visit")
    visitor_type: str = Field(default="Guest", description="Visitor type/relation")
    entity_id: str = Field(..., description="Entity ID")
    host_employee_id: str = Field(..., description="Host employee ID")
    check_in_time: Optional[datetime] = None


class VisitorResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    mobile: str
    company: str = ""
    purpose: str
    visitor_type: str = "Guest"
    entity_id: str
    entity_name: Optional[str] = None
    host_employee_id: str
    host_name: Optional[str] = None
    photo_url: Optional[str] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    status: str  # waiting | approved | declined | checked_out
    pass_id: Optional[str] = None
    qr_code_data: Optional[str] = None
    registered_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class VisitorInDB(BaseModel):
    name: str
    mobile: str
    company: str = ""
    purpose: str
    visitor_type: str = "Guest"
    entity_id: str
    host_employee_id: str
    photo_url: Optional[str] = None
    check_in_time: datetime = Field(default_factory=datetime.utcnow)
    check_out_time: Optional[datetime] = None
    status: str = "waiting"
    pass_id: Optional[str] = None
    qr_code_data: Optional[str] = None
    registered_by: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
