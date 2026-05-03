function formatScore(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${Math.round(value * 100)}%`;
}

function formatMetricHint(metric) {
  if (metric === "Answer relevance") {
    return "Scored on new evaluations";
  }

  return "RAGAS online score";
}

function scoreWidth(value) {
  if (value === null || value === undefined) {
    return "0%";
  }

  return `${Math.max(0, Math.min(100, value * 100))}%`;
}

export function EvaluationDashboard({ evaluationHistory, evaluationLoading, evaluationSummary, onRefresh }) {
  const averages = evaluationSummary?.averages || {};
  const trend = evaluationSummary?.trend || [];
  const agents = evaluationSummary?.agents || [];

  return (
    <section className="evaluation-stack">
      <div className="panel-card">
        <div className="form-heading">
          <div>
            <p className="section-label">AI Evaluation</p>
            <h2>Quality metrics</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onRefresh} disabled={evaluationLoading}>
            {evaluationLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="evaluation-grid">
          <MetricCard label="Faithfulness" value={averages.faithfulness} />
          <MetricCard label="Answer relevance" value={averages.relevance} />
          <MetricCard label="Evaluation errors" value={errorRate(evaluationSummary)} formatter={formatErrorRate} />
        </div>

        <div className="evaluation-meta-row">
          <span>{evaluationSummary?.total_evaluations || 0} evaluations</span>
          <span>{evaluationSummary?.failed_evaluations || 0} evaluation errors</span>
        </div>
      </div>

      <div className="panel-card">
        <div className="form-heading">
          <div>
            <p className="section-label">Trend</p>
            <h2>Faithfulness over time</h2>
          </div>
        </div>

        {!trend.length ? (
          <div className="empty-state">No evaluation trend yet. Run document Q&A or RAG-backed policy analysis.</div>
        ) : (
          <div className="trend-list">
            {trend.map((point) => (
              <div className="trend-row" key={point.date}>
                <span>{point.date}</span>
                <div className="trend-track">
                  <div className="trend-bar" style={{ width: scoreWidth(point.faithfulness) }} />
                </div>
                <strong>{formatScore(point.faithfulness)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-card">
        <div className="form-heading">
          <div>
            <p className="section-label">Agents</p>
            <h2>Per-agent metrics</h2>
          </div>
        </div>

        {!agents.length ? (
          <div className="empty-state">No per-agent metrics yet.</div>
        ) : (
          <div className="evaluation-table">
            <div className="evaluation-table-row evaluation-table-head">
              <span>Agent</span>
              <span>Faithfulness</span>
              <span>Relevance</span>
              <span>Runs</span>
            </div>
            {agents.map((agent) => (
              <div className="evaluation-table-row" key={agent.agent_type}>
                <span>{agent.agent_type}</span>
                <span>{formatScore(agent.faithfulness)}</span>
                <span>{formatScore(agent.relevance)}</span>
                <span>{agent.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-card">
        <div className="form-heading">
          <div>
            <p className="section-label">Recent</p>
            <h2>Evaluated queries</h2>
          </div>
        </div>

        {!evaluationHistory.length ? (
          <div className="empty-state">No evaluated queries yet.</div>
        ) : (
          <div className="evaluation-history-list">
            {evaluationHistory.map((item) => (
              <article className="evaluation-history-item" key={item.id}>
                <div className="history-topline">
                  <div>
                    <p className="result-label">{item.agent_type}</p>
                    <h3>{item.query}</h3>
                  </div>
                  <span className={item.error_message ? "status-pill status-pill-failed" : "status-pill status-pill-completed"}>
                    {item.error_message ? "error" : "scored"}
                  </span>
                </div>
                <p className="history-meta">{new Date(item.created_at).toLocaleString()}</p>
                <div className="evaluation-score-row">
              <span>Faithfulness {formatScore(item.faithfulness_score)}</span>
              <span>Relevance {formatScore(item.relevance_score)}</span>
            </div>
                <p className="history-snippet">{item.error_message || item.answer}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({ formatter = formatScore, label, value }) {
  return (
    <article className="metric-card">
      <p className="result-label">{label}</p>
      <strong>{formatter(value)}</strong>
      <span className="metric-hint">{formatMetricHint(label)}</span>
      <div className="metric-track">
        <div className="metric-bar" style={{ width: scoreWidth(value) }} />
      </div>
    </article>
  );
}

function errorRate(summary) {
  if (!summary?.total_evaluations) {
    return null;
  }

  return summary.failed_evaluations / summary.total_evaluations;
}

function formatErrorRate(value) {
  if (value === null || value === undefined) {
    return "0%";
  }

  return `${Math.round(value * 100)}%`;
}
