import { FeedbackBanner } from "./FeedbackBanner";
import { PageShell } from "./PageShell";

export function AuthScreen({
  authForm,
  authLoading,
  authMode,
  error,
  onModeChange,
  onSubmit,
  onUpdateField,
  successMessage,
}) {
  return (
    <PageShell>
      <section className="auth-layout">
        <section className="hero-card auth-hero auth-hero-card">
          <div className="auth-hero-badge">Secure AI workflow</div>

          <p className="eyebrow">Operational Intelligence For Policy Teams</p>
          <h1>AI Policy Assistant</h1>
          <p className="hero-copy auth-hero-copy">
            Review AI-generated policy summaries, risk insights, and client communication in a secure workspace built
            for accountable decision-making.
          </p>

          <div className="auth-hero-metrics">
            <div>
              <span className="metric-value">Private</span>
              <span className="metric-label">user-scoped analysis history</span>
            </div>
            <div>
              <span className="metric-value">Reviewed</span>
              <span className="metric-label">human-approved final outputs</span>
            </div>
          </div>

          <div className="auth-feature-list">
            <article className="auth-feature-card">
              <p className="result-label">Structured AI Output</p>
              <p>Generate consistent summaries, risk assessments, and draft emails in system-friendly JSON.</p>
            </article>
            <article className="auth-feature-card">
              <p className="result-label">Audit Trail</p>
              <p>Track every analysis with status, history, and reviewed final versions for safer workflows.</p>
            </article>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-toggle">
            <button
              className={authMode === "login" ? "auth-tab auth-tab-active" : "auth-tab"}
              type="button"
              onClick={() => onModeChange("login")}
            >
              Login
            </button>
            <button
              className={authMode === "register" ? "auth-tab auth-tab-active" : "auth-tab"}
              type="button"
              onClick={() => onModeChange("register")}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <div>
              <p className="section-label">Account Access</p>
              <h2>{authMode === "register" ? "Create your account" : "Welcome back"}</h2>
              <p className="auth-form-copy">
                {authMode === "register"
                  ? "Create a secure workspace to generate, review, and store private policy analyses."
                  : "Sign in to continue reviewing policy drafts and approved outputs."}
              </p>
            </div>

            {authMode === "register" ? (
              <label className="field">
                <span>Name</span>
                <input
                  className="auth-input"
                  type="text"
                  value={authForm.name}
                  onChange={(event) => onUpdateField("name", event.target.value)}
                  placeholder="Aarav Sharma"
                />
              </label>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input
                className="auth-input"
                type="email"
                value={authForm.email}
                onChange={(event) => onUpdateField("email", event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                className="auth-input"
                type="password"
                value={authForm.password}
                onChange={(event) => onUpdateField("password", event.target.value)}
                placeholder="At least 8 characters"
              />
            </label>

            <FeedbackBanner error={error} successMessage={successMessage} />

            <button className="primary-button" type="submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : authMode === "register" ? "Create account" : "Login"}
            </button>
          </form>
        </section>
      </section>
    </PageShell>
  );
}
