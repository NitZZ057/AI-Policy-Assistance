import { useRef } from "react";
import { questionStarters } from "../../constants/policy";

const statusLabels = {
  ready: "Ready",
  queued: "Indexing",
  processing: "Indexing",
  failed: "Failed",
};

function documentMeta(document) {
  const indexed = new Date(document.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (document.status === "ready") {
    return `${document.chunks_count} chunks · indexed ${indexed}`;
  }

  if (document.status === "failed") {
    return document.metadata_?.error || `Could not be indexed · ${indexed}`;
  }

  return `Uploaded ${indexed} · processing`;
}

function badgeLabel(document) {
  return document.mime_type === "application/pdf" ? "PDF" : "TXT";
}

export function DocumentAssistant({
  documentLoading,
  documents,
  onSelectDocument,
  onUpdateQuestion,
  onUploadDocument,
  selectedDocumentId,
}) {
  const fileInputRef = useRef(null);

  return (
    <>
      <section className="panel-card">
        <div className="card-header">
          <div className="card-header-copy">
            <p className="section-label">Document context</p>
            <h3>Indexed documents</h3>
          </div>
        </div>

        {!documents.length ? (
          <p className="empty-state">
            No documents yet. Upload a PDF or text file to ground answers in your own policy wording.
          </p>
        ) : (
          documents.map((document) => {
            const isSelected = String(document.id) === String(selectedDocumentId);

            return (
              <div className="document-row" key={document.id}>
                <span className="document-badge">{badgeLabel(document)}</span>

                <div className="document-row-meta">
                  <strong>{document.original_name}</strong>
                  <span>{documentMeta(document)}</span>
                </div>

                <span className={document.status === "ready" ? "pill pill-accent" : "pill"}>
                  {statusLabels[document.status] || document.status}
                </span>

                <button
                  className={isSelected ? "select-toggle select-toggle-active" : "select-toggle"}
                  type="button"
                  disabled={document.status !== "ready"}
                  onClick={() => onSelectDocument(String(document.id))}
                >
                  {isSelected ? "Selected" : "Select"}
                </button>
              </div>
            );
          })
        )}

        <div className="card-footer">
          <p className="helper-copy">
            Answers stay grounded in the selected document and cite the clause they came from.
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
            {documentLoading ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </section>

      <section className="panel-card">
        <div className="card-header">
          <div className="card-header-copy">
            <p className="section-label">Starters</p>
            <h3>Common questions</h3>
          </div>
        </div>

        <div className="starter-grid">
          {questionStarters.map((starter) => (
            <button className="starter-button" key={starter} type="button" onClick={() => onUpdateQuestion(starter)}>
              {starter}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
