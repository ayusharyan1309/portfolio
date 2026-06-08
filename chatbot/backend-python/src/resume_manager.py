"""
Resume Manager — Handles PDF parsing, chunking, embedding, and
multi-profile storage for different resume versions.

Each profile (e.g. "Java Software Dev", "AI/ML Engineer") can have its own
uploaded resume PDF. The chatbot uses the currently active profile's
chunks for RAG retrieval.

When a PDF is uploaded:
1. It's uploaded to S3-compatible storage (Cloudflare R2) for permanent storage
2. The text is extracted, chunked, and embedded for RAG
3. Chunks + embeddings are cached locally for fast startup

Profiles are stored as JSON files in `resumes_cache/` with pre-computed
embeddings for instant chatbot startup.
"""

import json
import logging
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from src.rag.knowledge import KnowledgeChunk
from src.rag.embedder import embed_batch

logger = logging.getLogger("portfolio-chatbot")

# ─── PDF parsing ────────────────────────────────────────────────────────

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

# ─── S3 (Cloudflare R2) Storage ─────────────────────────────────────────

try:
    import boto3
    from botocore.config import Config as BotoConfig
    HAS_S3 = True
except ImportError:
    HAS_S3 = False

S3_ENDPOINT = os.getenv("UPLOAD_STORAGE_S3_ENDPOINT", "")
S3_BUCKET = os.getenv("UPLOAD_STORAGE_S3_BUCKET", "ride-share-profile")
S3_REGION = os.getenv("UPLOAD_STORAGE_S3_REGION", "ap-south-1")
S3_ACCESS_KEY = os.getenv("UPLOAD_STORAGE_S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.getenv("UPLOAD_STORAGE_S3_SECRET_KEY", "")
S3_PUBLIC_URL_BASE = os.getenv(
    "UPLOAD_STORAGE_PUBLIC_URL",
    f"https://{S3_BUCKET}.{S3_REGION}.cloudflarestorage.com",
)

_resume_s3_client = None


def _get_s3_client():
    """Get or create the S3 client singleton."""
    global _resume_s3_client
    if _resume_s3_client is None and HAS_S3 and S3_ENDPOINT and S3_ACCESS_KEY:
        _resume_s3_client = boto3.client(
            "s3",
            endpoint_url=S3_ENDPOINT,
            region_name=S3_REGION,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            config=BotoConfig(signature_version="s3v4"),
        )
    return _resume_s3_client


def _upload_to_s3(profile_id: str, pdf_bytes: bytes, file_name: str) -> Optional[str]:
    """Upload resume PDF to S3-compatible storage. Returns the public URL or None."""
    s3 = _get_s3_client()
    if not s3:
        logger.warning("S3 not configured — skipping cloud storage upload")
        return None

    key = f"resumes/{profile_id}/{file_name}"
    try:
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
        )
        url = f"{S3_PUBLIC_URL_BASE}/{key}"
        logger.info("Resume uploaded to S3: %s", url)
        return url
    except Exception as e:
        logger.warning("Failed to upload resume to S3: %s", str(e))
        return None


def _delete_from_s3(profile_id: str):
    """Delete resume PDF from S3-compatible storage."""
    s3 = _get_s3_client()
    if not s3:
        return

    try:
        # List and delete all objects with this profile prefix
        response = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=f"resumes/{profile_id}/")
        if "Contents" in response:
            objects = [{"Key": obj["Key"]} for obj in response["Contents"]]
            s3.delete_objects(Bucket=S3_BUCKET, Delete={"Objects": objects})
            logger.info("Deleted %d objects from S3 for profile %s", len(objects), profile_id)
    except Exception as e:
        logger.warning("Failed to delete resume from S3: %s", str(e))


# ─── Storage ────────────────────────────────────────────────────────────

CACHE_DIR = Path(__file__).resolve().parent / "resumes_cache"
INDEX_PATH = CACHE_DIR / "index.json"

# ─── Predefined resume profiles ─────────────────────────────────────────

RESUME_PROFILES = [
    {"id": "mobile-dev",       "label": "Mobile Developer",     "icon": "📱"},
    {"id": "java-software-dev", "label": "Java Software Dev",    "icon": "☕"},
    {"id": "backend-software",  "label": "Backend Software",     "icon": "⚙️"},
    {"id": "aiml",              "label": "AI/ML Engineer",       "icon": "🤖"},
    {"id": "nodejs-dev",        "label": "Node.js Developer",    "icon": "🟢"},
    {"id": "fullstack-dev",     "label": "Fullstack Developer",  "icon": "🌐"},
]


@dataclass
class ResumeProfileInfo:
    """Public info about a resume profile."""
    id: str
    label: str
    icon: str
    uploaded_at: Optional[str] = None
    chunk_count: int = 0
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    cloud_url: Optional[str] = None
    active: bool = False


# ─── Manager ────────────────────────────────────────────────────────────

def _ensure_index():
    """Create the cache dir and index file if they don't exist."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if not INDEX_PATH.exists():
        _write_index({})


def _read_index() -> dict:
    _ensure_index()
    with open(INDEX_PATH) as f:
        return json.load(f)


def _write_index(data: dict):
    with open(INDEX_PATH, "w") as f:
        json.dump(data, f, indent=2)


def list_profiles() -> list[ResumeProfileInfo]:
    """List all profiles with their upload status."""
    _ensure_index()
    index = _read_index()
    active_id = index.get("_active")

    profiles = []
    for p in RESUME_PROFILES:
        data = index.get(p["id"], {})
        profiles.append(ResumeProfileInfo(
            id=p["id"],
            label=p["label"],
            icon=p["icon"],
            uploaded_at=data.get("uploaded_at"),
            chunk_count=data.get("chunk_count", 0),
            file_name=data.get("file_name"),
            file_size=data.get("file_size"),
            cloud_url=data.get("cloud_url"),
            active=(p["id"] == active_id),
        ))
    return profiles


def get_active_profile_id() -> Optional[str]:
    """Get the currently active profile ID."""
    index = _read_index()
    return index.get("_active")


def set_active_profile(profile_id: str) -> bool:
    """Activate a profile (must have been uploaded)."""
    index = _read_index()
    if profile_id not in [p["id"] for p in RESUME_PROFILES]:
        return False
    if profile_id not in index:
        return False  # Not uploaded yet
    index["_active"] = profile_id
    _write_index(index)
    return True


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from a PDF using PyMuPDF."""
    if not HAS_PYMUPDF:
        raise ImportError(
            "PyMuPDF is required for PDF parsing. Run: pip install PyMuPDF"
        )
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = "\n".join(page.get_text() for page in doc)
    doc.close()
    return text.strip()


def chunk_resume_text(text: str, profile_id: str, chunk_size: int = 400, overlap: int = 80) -> list[KnowledgeChunk]:
    """
    Split resume text into overlapping chunks, trying to respect
    section boundaries (Education, Experience, Skills, etc.).
    """
    # Identify section headers
    section_pattern = re.compile(
        r'(?im)^\s*(education|experience|work\s*history|work\s*experience|'
        r'professional\s*experience|skills|technical\s*skills|projects|'
        r'certifications|certification|summary|professional\s*summary|'
        r'objective|about|contact|achievements|publications|languages|'
        r'interests|volunteering|leadership|profile|personal\s*projects|'
        r'core\s*competencies|technologies|tools|employment|'
        r'relevant\s*experience|research|publication)\s*[\:\n]'
    )

    # Split by section headers
    parts = section_pattern.split(text)
    parts = [p.strip() for p in parts if p.strip()]

    chunks: list[KnowledgeChunk] = []
    current_section = "General"
    chunk_counter = 0

    for part in parts:
        # Check if this part is a section header
        if section_pattern.match(part + "\n"):
            current_section = part.strip().rstrip(":").strip().title()
            continue

        # Chunk the section text by word count
        words = part.split()
        if len(words) < 20:
            # Small fragments, attach to previous section info
            if chunks:
                chunks[-1].content += "\n" + part
            continue

        for i in range(0, len(words), chunk_size - overlap):
            word_slice = words[i:i + chunk_size]
            if len(word_slice) < 15:  # Skip tiny chunks
                continue
            chunk_text = " ".join(word_slice)
            chunks.append(KnowledgeChunk(
                id=f"resume-{profile_id}-{chunk_counter}",
                content=chunk_text,
                category=f"Resume - {current_section}",
                metadata={"section": current_section, "profile": profile_id},
            ))
            chunk_counter += 1

    # Fallback: if no chunks were created (no clear sections), chunk evenly
    if not chunks:
        words = text.split()
        for i in range(0, len(words), chunk_size - overlap):
            word_slice = words[i:i + chunk_size]
            if len(word_slice) < 15:
                continue
            chunk_text = " ".join(word_slice)
            chunks.append(KnowledgeChunk(
                id=f"resume-{profile_id}-{chunk_counter}",
                content=chunk_text,
                category="Resume",
                metadata={"profile": profile_id},
            ))
            chunk_counter += 1

    return chunks


def upload_resume(profile_id: str, pdf_bytes: bytes, file_name: str = "resume.pdf") -> dict:
    """
    Upload and parse a PDF resume for a given profile.
    Returns stats about the upload.
    """
    if profile_id not in [p["id"] for p in RESUME_PROFILES]:
        raise ValueError(f"Unknown profile: {profile_id}")

    # Extract text
    text = extract_text_from_pdf(pdf_bytes)

    if not text:
        raise ValueError("No text could be extracted from the PDF")

    # Chunk
    chunks = chunk_resume_text(text, profile_id)

    # Compute embeddings
    texts = [c.content for c in chunks]
    embeddings = embed_batch(texts)

    # Store chunks with embeddings
    chunk_data = [
        {
            "id": c.id,
            "content": c.content,
            "category": c.category,
            "metadata": c.metadata,
            "embedding": emb,
        }
        for c, emb in zip(chunks, embeddings)
    ]

    # Save chunks to disk
    profile_path = CACHE_DIR / f"{profile_id}.json"
    with open(profile_path, "w") as f:
        json.dump(chunk_data, f, indent=2)

    # Save original PDF to disk for download
    pdf_dir = CACHE_DIR / profile_id
    pdf_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = pdf_dir / "resume.pdf"
    with open(pdf_path, "wb") as f:
        f.write(pdf_bytes)

    # Upload to S3 (Cloudflare R2) for permanent storage
    cloud_url = _upload_to_s3(profile_id, pdf_bytes, file_name)

    # Update index
    index = _read_index()
    index[profile_id] = {
        "uploaded_at": datetime.now().isoformat(),
        "chunk_count": len(chunks),
        "file_name": file_name,
        "file_size": len(pdf_bytes),
    }
    if cloud_url:
        index[profile_id]["cloud_url"] = cloud_url
    index["_active"] = profile_id  # Auto-activate on upload
    _write_index(index)

    return {
        "profile_id": profile_id,
        "chunks": len(chunks),
        "characters": len(text),
        "cloud_url": cloud_url,
    }


def get_active_chunks() -> list[KnowledgeChunk]:
    """Get the chunks for the active profile. Returns empty list if none."""
    profile_id = get_active_profile_id()
    if not profile_id:
        return []

    profile_path = CACHE_DIR / f"{profile_id}.json"
    if not profile_path.exists():
        return []

    with open(profile_path) as f:
        chunk_data = json.load(f)

    chunks = []
    for d in chunk_data:
        chunk = KnowledgeChunk(
            id=d["id"],
            content=d["content"],
            category=d.get("category", "Resume"),
            metadata=d.get("metadata", {}),
        )
        chunk.embedding = d["embedding"]
        chunks.append(chunk)

    return chunks


def get_pdf_path(profile_id: str) -> Optional[Path]:
    """Get the local path to the saved PDF for a profile, if it exists."""
    pdf_path = CACHE_DIR / profile_id / "resume.pdf"
    if pdf_path.exists():
        return pdf_path
    return None


def delete_profile(profile_id: str) -> bool:
    """Delete a resume profile and its data."""
    # Delete from S3
    _delete_from_s3(profile_id)

    # Delete local cache
    profile_path = CACHE_DIR / f"{profile_id}.json"
    if profile_path.exists():
        profile_path.unlink()

    # Delete saved PDF
    pdf_path = CACHE_DIR / profile_id / "resume.pdf"
    if pdf_path.exists():
        pdf_path.unlink()
    pdf_dir = CACHE_DIR / profile_id
    if pdf_dir.exists():
        try:
            pdf_dir.rmdir()  # Remove empty directory
        except OSError:
            pass

    index = _read_index()
    index.pop(profile_id, None)
    if index.get("_active") == profile_id:
        index.pop("_active", None)
    _write_index(index)
    return True
