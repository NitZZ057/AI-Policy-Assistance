import { DocumentUpload } from "../DocumentUpload";

export function DocumentAssistant({
  documentLoading,
  documents,
  onSelectDocument,
  onUploadDocument,
  selectedDocumentId,
}) {
  return (
    <div className="workflow-stack">
      <section className="panel-card">
        <div className="card-header">
          <div>
            <p className="section-label">Document Context</p>
            <h3>Choose a policy document</h3>
          </div>
        </div>
        <p className="body-copy">
          Upload a PDF or text file, then ask focused questions in the chat panel. Answers stay grounded in the selected document.
        </p>
      </section>

      <DocumentUpload
        documentLoading={documentLoading}
        documents={documents}
        onSelectDocument={onSelectDocument}
        onUploadDocument={onUploadDocument}
        selectedDocumentId={selectedDocumentId}
      />
    </div>
  );
}
