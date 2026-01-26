"""
File validation utilities to prevent crashes and security issues.
"""
from fastapi import UploadFile, HTTPException
from typing import List, Set
from loguru import logger

# Try to import magic, but make it optional
try:
    import magic
    MAGIC_AVAILABLE = True
except (ImportError, OSError) as e:
    logger.warning(f"python-magic not available: {e}. File type validation will be limited.")
    MAGIC_AVAILABLE = False

# Maximum file size: 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

# Allowed MIME types
ALLOWED_IMAGE_TYPES: Set[str] = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/dicom",
    "image/x-dicom",
}

ALLOWED_DOCUMENT_TYPES: Set[str] = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
}

ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_DOCUMENT_TYPES

# Allowed file extensions
ALLOWED_EXTENSIONS: Set[str] = {
    ".jpg", ".jpeg", ".png", ".pdf", ".txt", ".docx", ".dcm"
}


class FileValidator:
    """Validates uploaded files for size, type, and security."""

    @staticmethod
    async def validate_file(file: UploadFile) -> bytes:
        """
        Validate a single file and return its content.

        Raises:
            HTTPException: If validation fails
        """
        # Read content
        content = await file.read()
        file_size = len(content)

        # 1. Check file size
        if file_size == 0:
            logger.warning(f"Empty file uploaded: {file.filename}")
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' is empty")

        if file_size > MAX_FILE_SIZE:
            logger.warning(f"File too large: {file.filename} ({file_size} bytes)")
            raise HTTPException(
                status_code=413,
                detail=f"File '{file.filename}' exceeds maximum size of {MAX_FILE_SIZE // (1024*1024)}MB"
            )

        # 2. Check file extension
        if file.filename:
            extension = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
            if extension not in ALLOWED_EXTENSIONS:
                logger.warning(f"Invalid file extension: {file.filename}")
                raise HTTPException(
                    status_code=400,
                    detail=f"File type '{extension}' not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
                )

        # 3. Check MIME type (client-provided)
        if file.content_type and file.content_type not in ALLOWED_TYPES:
            logger.warning(f"Invalid MIME type: {file.content_type} for {file.filename}")
            raise HTTPException(
                status_code=400,
                detail=f"File type '{file.content_type}' not allowed"
            )

        # 4. Verify actual file type (magic bytes) - SECURITY CHECK
        if MAGIC_AVAILABLE:
            try:
                mime = magic.from_buffer(content[:2048], mime=True)
                if mime not in ALLOWED_TYPES:
                    logger.error(f"File type mismatch! Claimed: {file.content_type}, Actual: {mime}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"File content does not match declared type. Actual type: {mime}"
                    )
            except Exception as e:
                logger.warning(f"Could not verify file magic bytes: {e}")
                # Continue if magic check fails
        else:
            logger.debug(f"Skipping magic byte validation (library not available) for {file.filename}")

        logger.info(f"File validated: {file.filename} ({file_size} bytes, {file.content_type})")
        return content

    @staticmethod
    async def validate_files(files: List[UploadFile]) -> dict:
        """
        Validate multiple files and return their contents.

        Returns:
            dict: {filename: {'content': bytes, 'type': str}}
        """
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="No files provided")

        if len(files) > 10:  # Maximum 10 files per request
            raise HTTPException(status_code=400, detail="Too many files. Maximum 10 files allowed")

        validated_files = {}
        total_size = 0

        for file in files:
            content = await FileValidator.validate_file(file)
            total_size += len(content)

            # Check total payload size
            if total_size > MAX_FILE_SIZE * 2:  # Max 100MB total
                raise HTTPException(
                    status_code=413,
                    detail="Total file size exceeds maximum allowed"
                )

            validated_files[file.filename] = {
                'content': content,
                'type': file.content_type
            }

        logger.info(f"Validated {len(validated_files)} files, total size: {total_size} bytes")
        return validated_files
