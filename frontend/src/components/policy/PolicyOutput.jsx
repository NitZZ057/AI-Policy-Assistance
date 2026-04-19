import { draftFieldConfig } from "../../constants/policy";
import { FeedbackBanner } from "../FeedbackBanner";
import { SourcesPanel } from "../SourcesPanel";

export function PolicyOutput({
  currentAnalysisId,
  draft,
  error,
  onCopy,
  onSaveReview,
  onUpdateDraftField,
  references,
  savingReview,
  successMessage,
}) {
  return (
    <div className="output-stack">
      <div className="context-panel-header">
        <div>
          <p className="section-label">Output</p>
          <h3>Analysis results</h3>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={onSaveReview}
          disabled={savingReview || !currentAnalysisId}
        >
          {savingReview ? "Saving..." : "Save Final Version"}
        </button>
      </div>

      <FeedbackBanner error={error} successMessage={successMessage} />

      {!currentAnalysisId ? (
        <div className="empty-state">
          No data yet. Run a policy analysis to review the summary, risk analysis, and client email here.
        </div>
      ) : (
        <div className="output-list">
          {draftFieldConfig.map((field) => (
            <article className="result-card" key={field.key}>
              <div className="result-card-header">
                <p className="result-label">{field.label}</p>
                <button className="tertiary-button" type="button" onClick={() => onCopy(draft[field.key])}>
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
      )}

      <SourcesPanel references={references || []} />
    </div>
  );
}
