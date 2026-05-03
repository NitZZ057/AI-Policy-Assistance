export function DocumentUpload({
  documentLoading,
  documents,
  onSelectDocument,
  onUploadDocument,
  selectedDocumentId,
}) {
  const selectedDocument = documents.find((document) => String(document.id) === String(selectedDocumentId));
  const processingStatuses = new Set(["queued", "processing"]);
  const isProcessing = selectedDocument && processingStatuses.has(selectedDocument.status);
  const hasFailed = selectedDocument?.status === "failed";

  return (
    <section className="panel-card document-panel">
      <div className="card-header">
        <div>
        <p className="section-label">Document Library</p>
        <h2>Policy source</h2>
        </div>
      </div>

      <label className="field">
        <span>PDF or text document</span>
        <input
          accept=".pdf,.txt,application/pdf,text/plain"
          className="file-input"
          disabled={documentLoading}
          type="file"
          onChange={(event) => onUploadDocument(event.target.files?.[0])}
        />
      </label>

      <label className="field">
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
      </label>

      {selectedDocument ? (
        <div className={`document-status document-status-${selectedDocument.status}`}>
          {isProcessing ? <span className="inline-loader" aria-hidden="true" /> : null}
          <div>
            <strong>
              {isProcessing
                ? "Processing document"
                : hasFailed
                  ? "Processing failed"
                  : "Document ready"}
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
      ) : null}

      <p className="helper-copy">
        {documentLoading || isProcessing
          ? "Extracting text, chunking, and creating embeddings..."
          : "Ready documents can ground policy analysis and document questions."}
      </p>
    </section>
  );
}
