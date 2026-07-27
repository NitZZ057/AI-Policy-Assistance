import { policyFieldConfig } from "../../constants/policy";
import { DocumentUpload } from "../DocumentUpload";

export function PolicyForm({
  documentLoading,
  documents,
  form,
  loading,
  onLoadDemo,
  onSelectDocument,
  onSubmit,
  onUpdateField,
  onUploadDocument,
  selectedDocumentId,
}) {
  return (
    <>
      <section className="panel-card">
        <form onSubmit={onSubmit}>
          <div className="card-header">
            <div className="card-header-copy">
              <p className="section-label">Policy input</p>
              <h3>Policy details</h3>
            </div>
            <button className="secondary-button" type="button" onClick={onLoadDemo}>
              Load demo
            </button>
          </div>

          <div className="card-body policy-grid">
            {policyFieldConfig.map((field) => (
              <label className="field" key={field.key}>
                <span>{field.label}</span>
                {field.control === "textarea" ? (
                  <textarea
                    rows={field.rows}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(event) => onUpdateField(field.key, event.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(event) => onUpdateField(field.key, event.target.value)}
                  />
                )}
              </label>
            ))}
          </div>

          <div className="card-footer">
            <p className="helper-copy">
              Output is drafted for review — nothing is sent to a client automatically.
            </p>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Analyzing…" : "Run analysis"}
            </button>
          </div>
        </form>
      </section>

      <DocumentUpload
        documentLoading={documentLoading}
        documents={documents}
        onSelectDocument={onSelectDocument}
        onUploadDocument={onUploadDocument}
        selectedDocumentId={selectedDocumentId}
      />
    </>
  );
}
