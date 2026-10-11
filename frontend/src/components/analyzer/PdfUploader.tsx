import React, { useRef, useState } from 'react';

interface PdfUploaderProps {
  selectedFile: File | null;
  fileName: string;
  onFileSelect: (file: File | null, fileName: string) => void;
  error?: string | null;
}

/**
 * Drag-and-drop accessible PDF uploader component.
 *
 * Validates document MIME types (.pdf) and byte limits (<= 5 MB),
 * providing visual drag feedback and accessible keyboard controls.
 */
export const PdfUploader: React.FC<PdfUploaderProps> = ({
  selectedFile,
  fileName,
  onFileSelect,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validates selected File object for PDF format and 5 MB size limit.
   */
  const validateAndSetFile = (file: File) => {
    setInternalError(null);

    // Validate mime type and file extension
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setInternalError('Invalid file format. Please upload a PDF (.pdf) file.');
      return;
    }

    // Validate size (max 5MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setInternalError(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB limit.`
      );
      return;
    }

    onFileSelect(file, file.name);
  };

  /**
   * Handles dragover event to highlight drop target.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  /**
   * Handles dragleave event to reset dropzone visual state.
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /**
   * Handles file drop event and forwards first file for validation.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Handles native file input change event from OS file picker.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  /**
   * Clears selected file from state and resets native file input reference.
   */
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null, '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Formats raw byte count into human-readable KB / MB string.
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const activeError = error || internalError;


  return (
    <div className="pdf-uploader-wrapper">
      <label htmlFor="resume-pdf-input" className="form-label">
        1. Upload Resume PDF <span className="required-indicator">*</span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        id="resume-pdf-input"
        data-testid="resume-pdf-input"
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        className="visually-hidden"
        aria-describedby={activeError ? 'upload-error-msg' : 'upload-help-text'}
      />

      {fileName ? (
        <div className="uploaded-file-card glass-card" data-testid="uploaded-file-card">
          <div className="file-info-group">
            <span className="file-pdf-icon" aria-hidden="true">
              📑
            </span>
            <div className="file-details">
              <span className="file-name" title={fileName}>
                {fileName}
              </span>
              <span className="file-meta">
                {selectedFile ? formatFileSize(selectedFile.size) : 'Ready for analysis'} • Text PDF
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm remove-file-btn"
            onClick={handleRemove}
            aria-label="Remove uploaded file"
          >
            Change File
          </button>
        </div>
      ) : (
        <div
          className={`dropzone-container ${isDragging ? 'is-dragging' : ''} ${
            activeError ? 'has-error' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Click or drag and drop to upload resume PDF"
          data-testid="dropzone-area"
        >
          <div className="dropzone-icon" aria-hidden="true">
            📂
          </div>
          <div className="dropzone-text-group">
            <p className="dropzone-primary-text">
              <strong>Click to upload</strong> or drag & drop your resume PDF
            </p>
            <p id="upload-help-text" className="dropzone-secondary-text">
              Supports standard 1 or 2-column tech resumes • Max 5 MB • Max 3 pages
            </p>
          </div>
        </div>
      )}

      {activeError && (
        <p id="upload-error-msg" className="field-error-text" role="alert" data-testid="upload-error">
          ⚠️ {activeError}
        </p>
      )}
    </div>
  );
};
