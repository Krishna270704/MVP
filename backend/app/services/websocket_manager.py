from fastapi import WebSocket
from typing import Dict, List
import json


class WebSocketManager:
    """Manages WebSocket connections per user_id for real-time notifications."""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"WebSocket connected: user {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"WebSocket disconnected: user {user_id}")

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections of a specific user."""
        if user_id in self.active_connections:
            disconnected = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    disconnected.append(ws)
            # Clean up broken connections
            for ws in disconnected:
                self.active_connections[user_id].remove(ws)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_role(self, user_ids: list, message: dict):
        """Send a message to multiple users."""
        for user_id in user_ids:
            await self.send_to_user(user_id, message)

    def is_connected(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(
            self.active_connections[user_id]
        ) > 0


# Singleton instance
ws_manager = WebSocketManager()
