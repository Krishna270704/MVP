import os
import uuid
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException, status
from app.config import settings


def _configure_cloudinary():
    """Configure Cloudinary SDK if credentials are available."""
    if settings.cloudinary_configured:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
        )
        return True
    return False


async def upload_image(file: UploadFile) -> str:
    """
    Upload an image to Cloudinary or local filesystem.
    Returns the URL of the uploaded image.
    """
    # Validate file type
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type: {file.content_type}. Allowed: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > settings.MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum size: {settings.MAX_IMAGE_SIZE // (1024 * 1024)}MB",
        )

    # Try Cloudinary first
    if _configure_cloudinary():
        try:
            result = cloudinary.uploader.upload(
                content,
                folder="visitor_management/photos",
                resource_type="image",
                transformation=[
                    {"width": 400, "height": 400, "crop": "fill", "gravity": "face"}
                ],
            )
            return result["secure_url"]
        except Exception as e:
            print(f"Cloudinary upload failed, falling back to local: {e}")

    # Local fallback
    return await _save_locally(content, file.filename or "unknown.jpg", "photos")


async def upload_qr_image(content: bytes, filename: str) -> str:
    """Upload a QR code image to Cloudinary or local filesystem."""
    if _configure_cloudinary():
        try:
            result = cloudinary.uploader.upload(
                content,
                folder="visitor_management/qrcodes",
                resource_type="image",
                public_id=filename.rsplit(".", 1)[0],
            )
            return result["secure_url"]
        except Exception as e:
            print(f"Cloudinary QR upload failed, falling back to local: {e}")

    return await _save_locally(content, filename or "unknown.jpg", "qrcodes")


async def _save_locally(content: bytes, original_filename: str, subfolder: str) -> str:
    """Save file to local uploads directory and return the access URL."""
    upload_dir = os.path.join(settings.LOCAL_UPLOAD_DIR, subfolder)
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    # Return URL path that will be served by FastAPI static files
    return f"/uploads/{subfolder}/{filename}"
