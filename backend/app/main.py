import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import connect_db, close_db
from app.seed import seed_data
from app.auth.router import router as auth_router
from app.routers.entities import router as entities_router
from app.routers.visitors import router as visitors_router
from app.routers.notifications import router as notifications_router
from app.services.websocket_manager import ws_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    await seed_data()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Visitor Management System",
    description="Office reception visitor management with real-time notifications",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for local image uploads
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Routers
app.include_router(auth_router)
app.include_router(entities_router)
app.include_router(visitors_router)
app.include_router(notifications_router)


# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive, receive any client messages (heartbeats)
            data = await websocket.receive_text()
            # Client can send pings; we just acknowledge
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
    except Exception:
        ws_manager.disconnect(websocket, user_id)


@app.get("/")
async def root():
    return {
        "message": "Visitor Management System API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
