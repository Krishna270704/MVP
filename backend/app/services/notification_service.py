from datetime import datetime
from app.database import get_db
from app.services.websocket_manager import ws_manager


async def create_notification(
    user_id: str,
    message: str,
    notification_type: str,
    visitor_id: str,
) -> dict:
    """Create a notification in MongoDB and push via WebSocket if user is online."""
    db = get_db()

    notification = {
        "user_id": user_id,
        "message": message,
        "type": notification_type,
        "visitor_id": visitor_id,
        "is_read": False,
        "created_at": datetime.utcnow(),
    }

    result = await db.notifications.insert_one(notification)
    notification["_id"] = str(result.inserted_id)

    # Send via WebSocket if user is connected
    ws_message = {
        "type": "notification",
        "data": {
            "_id": notification["_id"],
            "user_id": user_id,
            "message": message,
            "notification_type": notification_type,
            "visitor_id": visitor_id,
            "is_read": False,
            "created_at": notification["created_at"].isoformat(),
        },
    }

    await ws_manager.send_to_user(user_id, ws_message)

    return notification
