# Visitor Management System

## Overview
A full-stack Visitor Management System for office reception. Built with React + TypeScript (frontend) and FastAPI + Python (backend) with MongoDB, real-time WebSocket notifications, QR code pass generation, and Cloudinary image storage.

## Features
- Receptionist dashboard to register, view, and checkout visitors.
- Employee dashboard with real-time notifications for incoming visitors.
- Approve/Decline workflows for employees.
- Auto-generated QR codes and passes for approved visitors.
- Visitor photo capture via webcam or file upload.
- Filterable visitor history and live status tracking.
- Role-based authentication (Receptionist vs Employee).

## Tech Stack
Frontend: React 18, TypeScript, Vite, Tailwind CSS v4, React Router
Backend: Python 3.11+, FastAPI, Pydantic, Motor (async MongoDB)
Database: MongoDB (Atlas or local)
Authentication: JWT (python-jose), bcrypt
Notifications: Native FastAPI WebSockets
Image storage: Cloudinary SDK (primary) / Local Filesystem (fallback)
QR generation: python-qrcode + Pillow

## Architecture
React frontend → FastAPI backend → MongoDB. 
Images and QR codes are uploaded to Cloudinary, and MongoDB stores the secure URLs along with visitor metadata. The FastAPI backend pushes live notifications to the React frontend via WebSockets.

## User Roles
Receptionist: Registers new visitors, monitors live status, checks out visitors, views history.
Employee: Receives notifications of pending visitors, can approve or decline them, views pass details.

## Visitor Flow
Receptionist registration → Waiting → Employee notification → Approve/Decline → QR pass → Checkout → History

## Database Structure
`users`: Stores Receptionists and Employees with role-based access, bcrypt hashed passwords.
`entities`: Organizations (e.g. ABC Technologies).
`visitors`: Stores visitor details, host employee reference, status (waiting/approved/declined/checked_out), check-in/out times, photo URL.
`notifications`: WebSocket notification history tied to users.

## API Endpoints
- `POST /auth/login`: Issue JWT token
- `GET /entities`: List available entities
- `GET /entities/{entity_id}/employees`: List hosts for a given entity
- `POST /visitors`: Register visitor (multipart form data)
- `GET /visitors`: Role-filtered dashboard list
- `PATCH /visitors/{id}/approve`: Approve visitor
- `PATCH /visitors/{id}/decline`: Decline visitor
- `PATCH /visitors/{id}/checkout`: Checkout visitor
- `GET /visitors/history`: Paginated and filterable history
- `GET /notifications`: Get read/unread notifications
- `WS /ws/{user_id}`: Real-time websocket connection

## Authentication
JSON Web Tokens (JWT) using HS256 algorithm. The token is attached to the Authorization header in the frontend. Passwords are mathematically hashed using bcrypt. Route guards protect specific views.

## Notifications
The backend creates a notification document in MongoDB and immediately pushes the payload to the connected WebSocket client. If the client is disconnected, it fetches unread notifications via REST upon reconnecting.

## Visitor Photo
Photos are uploaded as multipart form-data. The FastAPI backend processes the image, optionally uploading it to Cloudinary with face-centered cropping, or saves it to the local `backend/uploads/photos` directory if Cloudinary is not configured.

## QR Visitor Pass
Upon approval, the backend dynamically generates a QR code image using `python-qrcode`. The QR code contains visitor verification details. It is uploaded to Cloudinary/local storage and a unique `pass_id` is assigned.

## Project Structure
```text
MVP/
├── backend/
│   ├── app/          # FastAPI application
│   ├── uploads/      # Local image fallback
│   ├── requirements.txt
│   ├── .env.example
│   └── seed.py       # DB seeder
├── frontend/
│   ├── src/          # React application
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── .gitignore
└── README.md
```

## Local Setup
### Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables
Backend: `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CORS_ORIGINS`.
Frontend: `VITE_API_URL`, `VITE_WS_URL`.

## Demo Credentials
Receptionist: reception@demo.com / Reception@123
Employee: amit@demo.com / Employee@123

## Known Limitations
- In-memory WebSocket manager won't scale across multiple backend instances without Redis.
- Local fallback image storage relies on the backend file system.
- No external SMS/Email provider integrations.

## Production Improvements
- Implement Redis pub/sub for WebSocket scalability.
- Add granular rate limiting.
- Containerize using Docker and Docker Compose.
