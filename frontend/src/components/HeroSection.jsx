export function HeroSection({ onLogout, user }) {
  return (
    <section className="hero-card">
      <div className="hero-toolbar">
        <div>
          <p className="eyebrow">Policy workflows, upgraded</p>
          <h1>AI Policy Assistant</h1>
        </div>

        <div className="user-chip-wrap">
          <div className="user-chip">
            <span>{user.name}</span>
            <small>{user.email}</small>
          </div>

          <button className="secondary-button" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <p className="hero-copy">
        Turn raw policy details into a short summary, risk snapshot, and a client-ready email in one step.
      </p>

      <div className="hero-metrics">
        <div>
          <span className="metric-value">Private</span>
          <span className="metric-label">user-scoped policy history</span>
        </div>
        <div>
          <span className="metric-value">JSON</span>
          <span className="metric-label">easy for frontend parsing</span>
        </div>
        <div>
          <span className="metric-value">Review</span>
          <span className="metric-label">human-approved final version</span>
        </div>
      </div>
    </section>
  );
}
