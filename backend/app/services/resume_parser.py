from fastapi import UploadFile
from typing import Union
from PyPDF2 import PdfReader
import docx  # python-docx
import io


async def extract_text_from_upload(file: UploadFile) -> str:
    """Extract plain text from an uploaded resume file.

    Supports:
    - PDF (.pdf)
    - Word (.docx)
    - Image (.jpg, .jpeg, .png) via optional OCR (Pillow + pytesseract)
    """
    filename = (file.filename or "").lower()
    content = await file.read()

    if filename.endswith(".pdf"):
        return _extract_text_from_pdf(content)
    if filename.endswith(".docx"):
        return _extract_text_from_docx(content)
    if filename.endswith((".jpg", ".jpeg", ".png")):
        return _extract_text_from_image(content)

    raise ValueError("Unsupported file type. Please upload PDF, DOCX, or image (JPG/PNG).")


def _extract_text_from_pdf(content: bytes) -> str:
    buffer = io.BytesIO(content)
    reader = PdfReader(buffer)
    texts = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        texts.append(page_text)
    return "\n".join(texts).strip()


def _extract_text_from_docx(content: bytes) -> str:
    buffer = io.BytesIO(content)
    document = docx.Document(buffer)
    texts = [p.text for p in document.paragraphs if p.text]
    return "\n".join(texts).strip()


def _extract_text_from_image(content: bytes) -> str:
    """Best-effort OCR for images.

    This function tries to use Pillow + pytesseract if available.
    If dependencies or system Tesseract are missing, it raises a
    RuntimeError with a clear message so the API layer can return
    a helpful error.
    """
    try:
        from PIL import Image  # type: ignore
        import pytesseract  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "Image OCR is not available. Please install Pillow and pytesseract "
            "and ensure Tesseract OCR is installed on the system."
        ) from exc

    image = Image.open(io.BytesIO(content))

    # 优先尝试中英混合识别，如果对应语言包未安装则退回默认配置
    try:
        text = pytesseract.image_to_string(image, lang="chi_sim+eng")
    except Exception:
        text = pytesseract.image_to_string(image)

    return text.strip()
