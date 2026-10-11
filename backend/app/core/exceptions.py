class JobMateError(Exception):
    """Base exception for JobMate AI domain errors."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class PDFValidationError(JobMateError):
    """Raised when file signature, extension, or format is invalid."""

    def __init__(self, message: str = "Invalid file signature. File is not a valid PDF."):
        super().__init__(message, status_code=400)


class PDFSizeLimitExceededError(JobMateError):
    """Raised when uploaded file exceeds allowed size."""

    def __init__(self, message: str = "File size exceeds the maximum limit."):
        super().__init__(message, status_code=413)


class PDFPageLimitExceededError(JobMateError):
    """Raised when page count exceeds maximum resume length."""

    def __init__(self, message: str = "Resume page count exceeds allowed limit."):
        super().__init__(message, status_code=422)


class PDFEncryptedError(JobMateError):
    """Raised when PDF is encrypted or password-protected."""

    def __init__(
        self,
        message: str = "The uploaded PDF is password-protected or encrypted. Please upload an unencrypted document.",
    ):
        super().__init__(message, status_code=400)


class PDFMalformedError(JobMateError):
    """Raised when PDF structure is corrupt or unreadable."""

    def __init__(self, message: str = "The uploaded PDF is corrupt or malformed."):
        super().__init__(message, status_code=400)


class PDFEmptyError(JobMateError):
    """Raised when PDF contains zero pages."""

    def __init__(self, message: str = "The uploaded PDF contains no pages."):
        super().__init__(message, status_code=400)


class PDFScannedImageError(JobMateError):
    """Raised when PDF has no digital text layer (scanned or image-only)."""

    def __init__(
        self,
        message: str = (
            "The uploaded PDF appears to be a scanned image or contains no selectable digital text. "
            "JobMate AI requires a text-based digital PDF (e.g. exported from Google Docs, MS Word, or LaTeX)."
        ),
    ):
        super().__init__(message, status_code=422)


class JobDescriptionValidationError(JobMateError):
    """Raised when job description text fails validation criteria."""

    def __init__(self, message: str = "Job description text is invalid."):
        super().__init__(message, status_code=422)


class UserConsentRequiredError(JobMateError):
    """Raised when explicit user processing consent is missing."""

    def __init__(
        self,
        message: str = "Explicit consent is required for ephemeral resume processing under India's DPDP Act 2023.",
    ):
        super().__init__(message, status_code=400)
