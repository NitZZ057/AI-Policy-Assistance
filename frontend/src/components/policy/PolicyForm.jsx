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
    <div className="workflow-stack">
      <section className="panel-card">
        <div className="card-header">
          <div>
            <p className="section-label">Policy Input</p>
            <h3>Policy details</h3>
          </div>
          <button className="secondary-button" type="button" onClick={onLoadDemo}>
            Load demo
          </button>
        </div>

        <form className="policy-form" onSubmit={onSubmit}>
          <div className="form-grid">
            {policyFieldConfig.map((field) => (
              <label className="field" key={field.key}>
                <span>{field.label}</span>
                <textarea
                  rows={field.key === "coverage" || field.key === "risk" ? 4 : 2}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(event) => onUpdateField(field.key, event.target.value)}
                />
              </label>
            ))}
          </div>

          <button className="primary-button primary-button-wide" type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Policy"}
          </button>
        </form>
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
