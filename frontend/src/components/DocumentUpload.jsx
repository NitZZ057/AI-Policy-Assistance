import { useRef, useState } from "react";

export function DocumentUpload({
  documentLoading,
  documents,
  onSelectDocument,
  onUploadDocument,
  selectedDocumentId,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedDocument = documents.find((document) => String(document.id) === String(selectedDocumentId));
  const processingStatuses = new Set(["queued", "processing"]);
  const isProcessing = selectedDocument && processingStatuses.has(selectedDocument.status);
  const hasFailed = selectedDocument?.status === "failed";

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (!documentLoading) {
      onUploadDocument(event.dataTransfer.files?.[0]);
    }
  };

  return (
    <section className="panel-card">
      <div className="card-header">
        <div className="card-header-copy">
          <p className="section-label">Document library</p>
          <h3>Grounding source</h3>
        </div>
        <span className="card-header-meta">Optional</span>
      </div>

      <div className="card-body grounding-grid">
        <div className="field">
          <span>Upload PDF or text</span>
          <div
            className="dropzone"
            style={isDragging ? { borderColor: "var(--green)", background: "var(--green-wash)" } : undefined}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <p className="dropzone-prompt">
              {documentLoading ? "Uploading document…" : "Drop a policy document here"}
            </p>
            <input
              ref={fileInputRef}
              accept=".pdf,.txt,application/pdf,text/plain"
              className="file-input-hidden"
              disabled={documentLoading}
              type="file"
              onChange={(event) => onUploadDocument(event.target.files?.[0])}
            />
            <button
              className="file-trigger"
              type="button"
              disabled={documentLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
            </button>
            <span className="dropzone-hint">PDF or .txt · up to 25 MB</span>
          </div>
        </div>

        <div className="field">
          <span>Selected document</span>
          <select
            className="select-input"
            value={selectedDocumentId}
            onChange={(event) => onSelectDocument(event.target.value)}
          >
            <option value="">No document context</option>
            {documents.map((document) => (
              <option key={document.id} value={document.id} disabled={document.status !== "ready"}>
                {document.original_name} ({document.status})
              </option>
            ))}
          </select>

          {selectedDocument ? (
            <div className={`document-status document-status-${selectedDocument.status}`}>
              {isProcessing ? <span className="inline-loader" aria-hidden="true" /> : null}
              <div>
                <strong>
                  {isProcessing ? "Processing document" : hasFailed ? "Processing failed" : "Document ready"}
                </strong>
                <span>
                  {isProcessing
                    ? "Extracting text, chunking content, creating embeddings, and updating the vector index."
                    : hasFailed
                      ? selectedDocument.metadata_?.error || "The document could not be indexed."
                      : "This document is ready for policy analysis and Q&A."}
                </span>
              </div>
            </div>
          ) : (
            <p className="helper-copy">
              Ready documents ground both policy analysis and document questions.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
