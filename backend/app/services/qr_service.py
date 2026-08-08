import qrcode
import io
import base64
import uuid
from app.services.image_service import upload_qr_image


def generate_pass_id() -> str:
    """Generate a unique pass ID."""
    return f"PASS-{uuid.uuid4().hex[:8].upper()}"


def generate_qr_base64(data: str) -> str:
    """Generate a QR code and return as base64-encoded PNG string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H, # type: ignore
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG") # type: ignore
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode("utf-8")


async def generate_and_store_qr(visitor_id: str, pass_id: str) -> str:
    """
    Generate QR code containing visitor/pass info and return as base64 data URI.
    The QR encodes a JSON-like string with the pass details.
    """
    qr_data = f'{{"visitor_id": "{visitor_id}", "pass_id": "{pass_id}"}}'
    qr_base64 = generate_qr_base64(qr_data)
    return f"data:image/png;base64,{qr_base64}"
