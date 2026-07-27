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
    <>
      <div className="context-panel-header">
        <div className="card-header-copy">
          <p className="section-label">Output</p>
          <h3>Analysis results</h3>
        </div>
        <button
          className="rail-save-button"
          type="button"
          onClick={onSaveReview}
          disabled={savingReview || !currentAnalysisId}
        >
          {savingReview ? "Saving…" : "Save final"}
        </button>
      </div>

      <div className="rail-body">
        <FeedbackBanner error={error} successMessage={successMessage} />

        {!currentAnalysisId ? (
          <p className="empty-state">
            No data yet. Run a policy analysis to review the summary, risk analysis, and client email here.
          </p>
        ) : (
          <>
            {draftFieldConfig.map((field) => (
              <article className="result-card" key={field.key}>
                <div className="result-card-header">
                  <p className="result-label">{field.label}</p>
                  <button className="tertiary-button" type="button" onClick={() => onCopy(draft[field.key])}>
                    Copy
                  </button>
                </div>
                <textarea
                  className="review-textarea"
                  rows={field.rows}
                  value={draft[field.key]}
                  onChange={(event) => onUpdateDraftField(field.key, event.target.value)}
                />
              </article>
            ))}

            <div className="notice-block">
              <strong>Reviewer action required</strong>
              <span>
                Saving marks this version final and locks it into the audit record under your name.
              </span>
            </div>
          </>
        )}

        <SourcesPanel references={references || []} />
      </div>
    </>
  );
}
