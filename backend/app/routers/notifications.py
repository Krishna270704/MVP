from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.auth.dependencies import get_current_user, validate_object_id
from bson import ObjectId

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    current_user: dict = Depends(get_current_user),
):
    """Get all notifications for the current user, newest first."""
    db = get_db()
    notifications = []
    async for n in db.notifications.find({"user_id": current_user["_id"]}).sort(
        "created_at", -1
    ).limit(50):
        n["_id"] = str(n["_id"])
        if n.get("created_at"):
            n["created_at"] = n["created_at"].isoformat()
        notifications.append(n)
    return notifications


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Mark a notification as read."""
    oid = validate_object_id(notification_id, "notification_id")
    db = get_db()

    notification = await db.notifications.find_one({"_id": oid})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.notifications.update_one({"_id": oid}, {"$set": {"is_read": True}})

    return {"message": "Notification marked as read"}
