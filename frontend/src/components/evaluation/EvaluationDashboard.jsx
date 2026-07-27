function formatScore(value) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return value.toFixed(2);
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "0%";
  }

  return `${Math.round(value * 100)}%`;
}

function scoreWidth(value) {
  if (value === null || value === undefined) {
    return "0%";
  }

  return `${Math.max(0, Math.min(100, value * 100))}%`;
}

/* The chart floor is 0.75 so week-to-week movement in a healthy score range
   stays legible; anything at or below the floor renders as the min-height stub. */
const CHART_FLOOR = 0.75;

function barHeight(value) {
  if (value === null || value === undefined) {
    return "0%";
  }

  const ratio = ((value - CHART_FLOOR) / (1 - CHART_FLOOR)) * 100;
  return `${Math.max(0, Math.min(100, ratio))}%`;
}

function shortDate(value) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function EvaluationDashboard({ evaluationLoading, evaluationSummary, onRefresh }) {
  const averages = evaluationSummary?.averages || {};
  const trend = evaluationSummary?.trend || [];
  const agents = evaluationSummary?.agents || [];
  const total = evaluationSummary?.total_evaluations || 0;
  const failed = evaluationSummary?.failed_evaluations || 0;

  return (
    <>
      <section className="panel-card">
        <div className="card-header">
          <div className="card-header-copy">
            <p className="section-label">All evaluations</p>
            <h3>Quality metrics</h3>
          </div>
          <button className="secondary-button" type="button" onClick={onRefresh} disabled={evaluationLoading}>
            {evaluationLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="metric-grid">
          <MetricCard
            caption="RAGAS online score"
            label="Faithfulness"
            value={averages.faithfulness}
            display={formatScore(averages.faithfulness)}
          />
          <MetricCard
            caption="Scored on new evaluations"
            label="Answer relevance"
            value={averages.relevance}
            display={formatScore(averages.relevance)}
          />
          <MetricCard
            caption="Failed scoring runs"
            label="Evaluation errors"
            value={total ? failed / total : 0}
            display={formatPercent(total ? failed / total : 0)}
            delta={`${failed} of ${total}`}
          />
        </div>
      </section>

      <section className="panel-card">
        <div className="card-header">
          <div className="card-header-copy">
            <p className="section-label">Trend</p>
            <h3>Faithfulness over time</h3>
          </div>
          <span className="card-header-meta">Daily average</span>
        </div>

        {!trend.length ? (
          <p className="empty-state">
            No evaluation trend yet. Run document Q&amp;A or a RAG-backed policy analysis.
          </p>
        ) : (
          <div className="trend-chart">
            {trend.map((point, index) => (
              <div className="trend-column" key={point.date}>
                <div
                  className={index === trend.length - 1 ? "trend-bar trend-bar-latest" : "trend-bar"}
                  style={{ height: barHeight(point.faithfulness) }}
                  title={`${shortDate(point.date)} · ${formatScore(point.faithfulness)}`}
                />
                <span className="trend-label">{shortDate(point.date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel-card">
        <div className="card-header">
          <div className="card-header-copy">
            <p className="section-label">Agents</p>
            <h3>Per-agent performance</h3>
          </div>
        </div>

        {!agents.length ? (
          <p className="empty-state">No per-agent metrics yet.</p>
        ) : (
          <div className="data-table">
            <div className="table-head agents-grid">
              <span>Agent</span>
              <span>Runs</span>
              <span>Faithfulness</span>
              <span>Relevance</span>
              <span>Precision</span>
            </div>

            {agents.map((agent) => (
              <div className="table-row agents-grid" key={agent.agent_type}>
                <strong>{agent.agent_type}</strong>
                <span className="table-cell">{agent.count}</span>
                <span className="table-cell">{formatScore(agent.faithfulness)}</span>
                <span className="table-cell">{formatScore(agent.relevance)}</span>
                <span className="table-cell">{formatScore(agent.context_precision)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function MetricCard({ caption, delta, display, label, value }) {
  return (
    <article className="metric-card">
      <p className="section-label">{label}</p>

      <div className="metric-value-row">
        <strong>{display}</strong>
        {delta ? <span className="metric-delta">{delta}</span> : null}
      </div>

      <div className="metric-track">
        <div className="metric-bar" style={{ width: scoreWidth(value) }} />
      </div>

      <span className="metric-caption">{caption}</span>
    </article>
  );
}
