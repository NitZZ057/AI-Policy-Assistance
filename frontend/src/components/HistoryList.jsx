function relativeTime(value) {
  const created = new Date(value);
  const minutes = Math.round((Date.now() - created.getTime()) / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (minutes < 60 * 24) {
    const hours = Math.round(minutes / 60);
    return `${hours} hr ago`;
  }

  if (minutes < 60 * 48) {
    return "Yesterday";
  }

  return created.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function statusPill(entry) {
  if (entry.status === "reviewed" || entry.reviewed_at) {
    return { className: "pill pill-solid", label: "Final" };
  }

  if (entry.error_message) {
    return { className: "pill", label: "Failed" };
  }

  return { className: "pill pill-accent", label: "Awaiting review" };
}

export function HistoryList({ history, historyLoading, onLoadHistory, onOpenForReview }) {
  return (
    <section className="panel-card">
      <div className="card-header">
        <div className="card-header-copy">
          <p className="section-label">Audit trail</p>
          <h3>Recent analyses</h3>
        </div>
        <button className="secondary-button" type="button" onClick={onLoadHistory} disabled={historyLoading}>
          {historyLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {!history.length ? (
        <p className="empty-state">
          No saved analyses yet. This workspace only ever shows its own requests, outputs, and review states.
        </p>
      ) : (
        <div className="data-table">
          <div className="table-head history-grid">
            <span>Reference</span>
            <span>Line of business</span>
            <span>Status</span>
            <span>Updated</span>
            <span />
          </div>

          {history.map((entry) => {
            const reviewSource = entry.final_output_payload || entry.output_payload || {};
            const pill = statusPill(entry);

            return (
              <div className="table-row history-grid" key={entry.id}>
                <div className="history-ref">
                  <strong>AN-{entry.id}</strong>
                  <span className="history-note">
                    {reviewSource.summary || entry.error_message || "No output stored."}
                  </span>
                </div>

                <span className="table-cell">{entry.policy_type}</span>
                <span className={pill.className}>{pill.label}</span>
                <span className="table-cell-muted">{relativeTime(entry.created_at)}</span>

                <button className="row-action" type="button" onClick={() => onOpenForReview(entry)}>
                  Open review
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
