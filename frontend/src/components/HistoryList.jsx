export function HistoryList({ history, historyLoading, onLoadHistory, onOpenForReview }) {
  return (
    <section className="history-card">
      <div className="form-heading">
        <div>
          <p className="section-label">Audit Trail</p>
          <h2>Your recent analyses</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onLoadHistory} disabled={historyLoading}>
          {historyLoading ? "Refreshing..." : "Refresh history"}
        </button>
      </div>

      {!history.length ? (
        <div className="empty-state">
          No saved analyses yet. Your signed-in account will only see its own requests, outputs, and review states.
        </div>
      ) : (
        <div className="history-list">
          {history.map((entry) => {
            const reviewSource = entry.final_output_payload || entry.output_payload || {};

            return (
              <article className="history-item" key={entry.id}>
                <div className="history-topline">
                  <div>
                    <p className="result-label">{entry.policy_type}</p>
                    <h3>Analysis #{entry.id}</h3>
                  </div>
                  <span className={`status-pill status-pill-${entry.status}`}>{entry.status}</span>
                </div>

                <div className="history-badges">
                  <span className={`review-pill ${entry.reviewed_at ? "review-pill-reviewed" : "review-pill-draft"}`}>
                    {entry.reviewed_at ? "Reviewed" : "Draft only"}
                  </span>
                </div>

                <p className="history-meta">{new Date(entry.created_at).toLocaleString()}</p>
                <p className="history-snippet">{reviewSource.summary || entry.error_message || "No output stored."}</p>

                <button className="secondary-button history-action" type="button" onClick={() => onOpenForReview(entry)}>
                  Open in review
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
