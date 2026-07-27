function formatScore(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return value.toFixed(2);
}

export function EvaluationNotes({ evaluationHistory }) {
  return (
    <>
      <div className="context-panel-header">
        <div className="card-header-copy">
          <p className="section-label">Observability</p>
          <h3>Evaluation notes</h3>
        </div>
      </div>

      <div className="rail-body">
        <div className="rail-card">
          <span className="rail-card-title">How scoring works</span>
          <span className="rail-card-body">
            Evaluations run after each RAG-backed response and are stored asynchronously, so reviewer-facing answers
            are never blocked by scoring.
          </span>
        </div>

        {!evaluationHistory.length ? (
          <p className="empty-state">No evaluated queries yet.</p>
        ) : (
          evaluationHistory.map((item) => (
            <article className="rail-card" key={item.id}>
              <div className="rail-card-topline">
                <strong>{item.query}</strong>
                <span className="rail-card-time">
                  {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>

              <div className="rail-scores">
                <span className="pill">{item.agent_type}</span>
                <span className="pill">Faithfulness {formatScore(item.faithfulness_score)}</span>
                <span className="pill">Relevance {formatScore(item.relevance_score)}</span>
              </div>

              <span className="rail-card-body">{item.error_message || item.answer}</span>
            </article>
          ))
        )}
      </div>
    </>
  );
}
