from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from app.database import get_db
from app.auth.dependencies import get_current_user, require_role, validate_object_id
from app.services.image_service import upload_image
from app.services.qr_service import generate_pass_id, generate_and_store_qr
from app.services.notification_service import create_notification
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional
import re

router = APIRouter(prefix="/visitors", tags=["Visitors"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_visitor(
    name: str = Form(...),
    mobile: str = Form(...),
    company: str = Form(""),
    purpose: str = Form(...),
    visitor_type: str = Form("Guest"),
    entity_id: str = Form(...),
    host_employee_id: str = Form(...),
    check_in_time: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    current_user: dict = Depends(require_role("receptionist")),
):
    """Register a new visitor. Receptionist only."""
    # Validate fields
    errors = []
    if not name or not name.strip():
        errors.append("Visitor name is required")
    if not mobile or not re.match(r"^[6-9]\d{9}$", mobile):
        errors.append("Valid Indian mobile number is required (10 digits starting with 6-9)")
    if not purpose or not purpose.strip():
        errors.append("Purpose of visit is required")
    if not entity_id:
        errors.append("Entity is required")
    if not host_employee_id:
        errors.append("Host employee is required")

    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=errors,
        )

    db = get_db()

    # Validate entity
    entity_oid = validate_object_id(entity_id, "entity_id")
    entity = await db.entities.find_one({"_id": entity_oid})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Validate host employee
    host_oid = validate_object_id(host_employee_id, "host_employee_id")
    host = await db.users.find_one({"_id": host_oid, "role": "employee"})
    if not host:
        raise HTTPException(status_code=404, detail="Host employee not found")

    # Upload photo
    photo_url = await upload_image(photo)

    # Parse check-in time or use current
    if check_in_time:
        try:
            parsed_time = datetime.fromisoformat(check_in_time.replace("Z", "+00:00"))
        except ValueError:
            parsed_time = datetime.utcnow()
    else:
        parsed_time = datetime.utcnow()

    visitor_doc = {
        "name": name.strip(),
        "mobile": mobile.strip(),
        "company": company.strip(),
        "purpose": purpose.strip(),
        "visitor_type": visitor_type.strip(),
        "entity_id": entity_id,
        "host_employee_id": host_employee_id,
        "photo_url": photo_url,
        "check_in_time": parsed_time,
        "check_out_time": None,
        "status": "waiting",
        "pass_id": None,
        "qr_code_data": None,
        "registered_by": current_user["_id"],
        "created_at": datetime.utcnow(),
    }

    result = await db.visitors.insert_one(visitor_doc)
    visitor_id = str(result.inserted_id)

    # Send notification to host employee
    await create_notification(
        user_id=host_employee_id,
        message=f"{name.strip()} has arrived at reception to meet you.",
        notification_type="visitor_arrival",
        visitor_id=visitor_id,
    )

    visitor_doc["_id"] = visitor_id
    visitor_doc["entity_name"] = entity["name"]
    visitor_doc["host_name"] = host["name"]

    return _serialize_visitor(visitor_doc)


@router.get("")
async def list_visitors(
    status_filter: Optional[str] = None,
    today_only: bool = True,
    current_user: dict = Depends(get_current_user),
):
    """List visitors. Receptionist sees all, employee sees only their own."""
    db = get_db()
    query = {}

    if current_user["role"] == "employee":
        query["host_employee_id"] = current_user["_id"]

    if status_filter:
        query["status"] = status_filter

    if today_only:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        query["check_in_time"] = {"$gte": today_start, "$lt": today_end}

    visitors = []
    async for v in db.visitors.find(query).sort("created_at", -1):
        visitor = await _enrich_visitor(db, v)
        visitors.append(visitor)

    return visitors


@router.get("/history")
async def visitor_history(
    name: Optional[str] = None,
    mobile: Optional[str] = None,
    status_filter: Optional[str] = None,
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Search visitor history with filters."""
    db = get_db()
    query = {}

    if current_user["role"] == "employee":
        query["host_employee_id"] = current_user["_id"]

    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if mobile:
        query["mobile"] = {"$regex": mobile}
    if status_filter:
        query["status"] = status_filter
    if date:
        try:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            next_day = date_obj + timedelta(days=1)
            query["check_in_time"] = {"$gte": date_obj, "$lt": next_day}
        except ValueError:
            pass

    visitors = []
    async for v in db.visitors.find(query).sort("created_at", -1).limit(100):
        visitor = await _enrich_visitor(db, v)
        visitors.append(visitor)

    return visitors


@router.get("/search")
async def search_visitors(
    name: Optional[str] = None,
    mobile: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Search visitors by name or mobile."""
    db = get_db()
    query = {}

    if current_user["role"] == "employee":
        query["host_employee_id"] = current_user["_id"]

    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if mobile:
        query["mobile"] = {"$regex": mobile}

    if not name and not mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least a name or mobile number to search",
        )

    visitors = []
    async for v in db.visitors.find(query).sort("created_at", -1).limit(50):
        visitor = await _enrich_visitor(db, v)
        visitors.append(visitor)

    return visitors


@router.get("/{visitor_id}")
async def get_visitor(
    visitor_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a single visitor by ID."""
    db = get_db()
    oid = validate_object_id(visitor_id, "visitor_id")
    visitor = await db.visitors.find_one({"_id": oid})

    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    # Employee can only see their own visitors
    if current_user["role"] == "employee":
        if visitor.get("host_employee_id") != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Access denied")

    enriched = await _enrich_visitor(db, visitor)
    return enriched


@router.patch("/{visitor_id}/approve")
async def approve_visitor(
    visitor_id: str,
    current_user: dict = Depends(require_role("employee")),
):
    """Employee approves a visitor. Generates pass and QR code."""
    db = get_db()
    oid = validate_object_id(visitor_id, "visitor_id")
    visitor = await db.visitors.find_one({"_id": oid})

    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    if visitor.get("host_employee_id") != current_user["_id"]:
        raise HTTPException(
            status_code=403, detail="You can only approve visitors assigned to you"
        )

    if visitor["status"] != "waiting":
        raise HTTPException(
            status_code=400, detail=f"Cannot approve visitor with status: {visitor['status']}"
        )

    # Generate pass and QR
    pass_id = generate_pass_id()
    qr_code_data = await generate_and_store_qr(visitor_id, pass_id)

    await db.visitors.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "approved",
                "pass_id": pass_id,
                "qr_code_data": qr_code_data,
            }
        },
    )

    # Notify all receptionists
    receptionists = []
    async for user in db.users.find({"role": "receptionist"}):
        receptionists.append(str(user["_id"]))

    for receptionist_id in receptionists:
        await create_notification(
            user_id=receptionist_id,
            message=f"{current_user['name']} approved visitor {visitor['name']}. Pass ID: {pass_id}",
            notification_type="visitor_approved",
            visitor_id=visitor_id,
        )

    updated = await db.visitors.find_one({"_id": oid})
    enriched = await _enrich_visitor(db, updated)
    return enriched


@router.patch("/{visitor_id}/decline")
async def decline_visitor(
    visitor_id: str,
    current_user: dict = Depends(require_role("employee")),
):
    """Employee declines a visitor."""
    db = get_db()
    oid = validate_object_id(visitor_id, "visitor_id")
    visitor = await db.visitors.find_one({"_id": oid})

    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    if visitor.get("host_employee_id") != current_user["_id"]:
        raise HTTPException(
            status_code=403, detail="You can only decline visitors assigned to you"
        )

    if visitor["status"] != "waiting":
        raise HTTPException(
            status_code=400, detail=f"Cannot decline visitor with status: {visitor['status']}"
        )

    await db.visitors.update_one({"_id": oid}, {"$set": {"status": "declined"}})

    # Notify all receptionists
    receptionists = []
    async for user in db.users.find({"role": "receptionist"}):
        receptionists.append(str(user["_id"]))

    for receptionist_id in receptionists:
        await create_notification(
            user_id=receptionist_id,
            message=f"{current_user['name']} declined visitor {visitor['name']}.",
            notification_type="visitor_declined",
            visitor_id=visitor_id,
        )

    updated = await db.visitors.find_one({"_id": oid})
    enriched = await _enrich_visitor(db, updated)
    return enriched


@router.patch("/{visitor_id}/checkout")
async def checkout_visitor(
    visitor_id: str,
    current_user: dict = Depends(require_role("receptionist")),
):
    """Receptionist checks out an approved visitor."""
    db = get_db()
    oid = validate_object_id(visitor_id, "visitor_id")
    visitor = await db.visitors.find_one({"_id": oid})

    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    if visitor["status"] != "approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved visitors can be checked out",
        )

    checkout_time = datetime.utcnow()
    await db.visitors.update_one(
        {"_id": oid},
        {"$set": {"status": "checked_out", "check_out_time": checkout_time}},
    )

    updated = await db.visitors.find_one({"_id": oid})
    enriched = await _enrich_visitor(db, updated)
    return enriched


# --- Helpers ---

async def _enrich_visitor(db, visitor: dict) -> dict:
    """Add entity_name and host_name to visitor dict."""
    visitor["_id"] = str(visitor["_id"])

    # Get entity name
    entity_name = ""
    if visitor.get("entity_id"):
        try:
            entity = await db.entities.find_one({"_id": ObjectId(visitor["entity_id"])})
            if entity:
                entity_name = entity["name"]
        except Exception:
            pass
    visitor["entity_name"] = entity_name

    # Get host name
    host_name = ""
    if visitor.get("host_employee_id"):
        try:
            host = await db.users.find_one({"_id": ObjectId(visitor["host_employee_id"])})
            if host:
                host_name = host["name"]
        except Exception:
            pass
    visitor["host_name"] = host_name

    return _serialize_visitor(visitor)


def _serialize_visitor(visitor: dict) -> dict:
    """Ensure all fields are JSON-serializable."""
    result = {}
    for key, value in visitor.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result
