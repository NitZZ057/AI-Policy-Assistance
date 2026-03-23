import { draftFieldConfig } from "../constants/policy";
import { FeedbackBanner } from "./FeedbackBanner";

export function ReviewWorkspace({
  currentAnalysisId,
  draft,
  error,
  onCopy,
  onSaveReview,
  onUpdateDraftField,
  savingReview,
  successMessage,
}) {
  return (
    <section className="results-panel">
      <div className="form-heading">
        <div>
          <p className="section-label">Review Workspace</p>
          <h2>Edit and approve output</h2>
        </div>
        <button className="primary-button" type="button" onClick={onSaveReview} disabled={savingReview}>
          {savingReview ? "Saving..." : "Save final version"}
        </button>
      </div>

      <FeedbackBanner error={error} successMessage={successMessage} />

      {!error && !currentAnalysisId ? (
        <div className="empty-state">
          Generate a new analysis or open one from history to review and save the final version.
        </div>
      ) : null}

      {currentAnalysisId ? (
        <div className="result-grid">
          {draftFieldConfig.map((field) => (
            <article
              className={field.key === "email" ? "result-card result-card-wide" : "result-card"}
              key={field.key}
            >
              <div className="result-card-header">
                <p className="result-label">{field.label}</p>
                <button className="copy-button" type="button" onClick={() => onCopy(draft[field.key])}>
                  Copy
                </button>
              </div>
              <textarea
                className={field.key === "email" ? "review-textarea review-textarea-large" : "review-textarea"}
                rows={field.rows}
                value={draft[field.key]}
                onChange={(event) => onUpdateDraftField(field.key, event.target.value)}
              />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
