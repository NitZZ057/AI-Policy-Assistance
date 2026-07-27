import { Fragment } from "react";
import { FeedbackBanner } from "./FeedbackBanner";

const capabilities = [
  {
    label: "Structured output",
    copy: "Summaries, exclusions, and risk scores returned in a consistent schema your systems can consume.",
  },
  {
    label: "Audit trail",
    copy: "Every draft, edit, and approval is timestamped and attributed for regulatory review.",
  },
  {
    label: "Scoped access",
    copy: "Analysis history is user- and book-scoped, with role permissions across teams.",
  },
  {
    label: "Reviewed finals",
    copy: "Nothing reaches a client until a licensed reviewer signs the final version.",
  },
];

const proofStats = [
  { value: "41%", caption: "faster first-pass review" },
  { value: "100%", caption: "outputs human-approved" },
  { value: "7 yr", caption: "retention on record" },
];

export function AuthScreen({
  authForm,
  authLoading,
  authMode,
  error,
  guestLoading,
  onGuestLogin,
  onModeChange,
  onSubmit,
  onToggleRemember,
  onUpdateField,
  rememberMe,
  successMessage,
}) {
  const isRegister = authMode === "register";

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header-left">
          <div className="brand-lockup">
            <span className="brand-mark">AP</span>
            <span className="brand-wordmark">Policy Assistant</span>
          </div>

          <nav className="landing-nav">
            <a href="#platform">Platform</a>
            <a href="#controls">Controls</a>
            <a href="#security">Security</a>
            <a href="#docs">Documentation</a>
          </nav>
        </div>

        <div className="landing-header-right">
          <a href="#contact">Contact sales</a>
          <button className="landing-signin-link" type="button" onClick={() => onModeChange("login")}>
            Sign in
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-pitch">
          <div className="trust-pill">
            <span />
            <span>SOC 2 Type II · Human-in-the-loop</span>
          </div>

          <h1>Policy intelligence your underwriters can defend.</h1>

          <p className="landing-lede">
            Generate structured policy summaries, coverage risk assessments, and client-ready correspondence — every
            output reviewed, versioned, and traceable to the analyst who approved it.
          </p>

          <div className="capability-grid">
            {capabilities.map((capability) => (
              <div className="capability-cell" key={capability.label}>
                <p>{capability.label}</p>
                <p>{capability.copy}</p>
              </div>
            ))}
          </div>

          <div className="proof-row">
            <p className="proof-label">Deployed across commercial lines teams</p>
            <div className="proof-stats">
              {proofStats.map((stat, index) => (
                <Fragment key={stat.value}>
                  {index > 0 ? <div className="proof-divider" /> : null}
                  <div className="proof-stat">
                    <span className="proof-value">{stat.value}</span>
                    <span className="proof-caption">{stat.caption}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        <aside className="landing-auth">
          <div className="auth-card">
            <div className="auth-tabs">
              <button
                className={isRegister ? "auth-tab" : "auth-tab auth-tab-active"}
                type="button"
                onClick={() => onModeChange("login")}
              >
                Sign in
              </button>
              <button
                className={isRegister ? "auth-tab auth-tab-active" : "auth-tab"}
                type="button"
                onClick={() => onModeChange("register")}
              >
                Create account
              </button>
            </div>

            <div className="auth-card-body">
              <h2>{isRegister ? "Create your workspace" : "Sign in to your workspace"}</h2>
              <p className="auth-form-copy">
                {isRegister
                  ? "Set up a secure workspace to generate, review, and retain policy analyses."
                  : "Access your analysis history, pending reviews, and approved finals."}
              </p>

              <form className="auth-form" onSubmit={onSubmit}>
                {isRegister ? (
                  <label className="field">
                    <span>Full name</span>
                    <input
                      type="text"
                      value={authForm.name}
                      placeholder="Aarav Sharma"
                      onChange={(event) => onUpdateField("name", event.target.value)}
                    />
                  </label>
                ) : null}

                <label className="field">
                  <span>Work email</span>
                  <input
                    type="email"
                    value={authForm.email}
                    placeholder="you@company.com"
                    onChange={(event) => onUpdateField("email", event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={authForm.password}
                    placeholder="At least 8 characters"
                    onChange={(event) => onUpdateField("password", event.target.value)}
                  />
                </label>

                {!isRegister ? (
                  <div className="auth-options">
                    <label className="auth-remember">
                      <input type="checkbox" checked={rememberMe} onChange={onToggleRemember} />
                      Keep me signed in
                    </label>
                    <a className="auth-reset-link" href="#reset">
                      Forgot password?
                    </a>
                  </div>
                ) : null}

                <FeedbackBanner error={error} successMessage={successMessage} />

                <button
                  className="primary-button auth-submit"
                  type="submit"
                  disabled={authLoading || guestLoading}
                >
                  {authLoading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
                </button>

                {isRegister ? (
                  <p className="auth-legal">
                    By creating an account you agree to the <a href="#terms">Terms of Service</a> and{" "}
                    <a href="#dpa">Data Processing Addendum</a>.
                  </p>
                ) : null}
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                className="auth-guest-button"
                type="button"
                disabled={authLoading || guestLoading}
                onClick={onGuestLogin}
              >
                {guestLoading ? "Starting guest session..." : "Continue as guest"}
              </button>

              <p className="auth-guest-note">
                No signup needed. A temporary workspace is created for you and stays private to this session.
              </p>
            </div>

            <div className="auth-card-footer">
              <span />
              <span>Encrypted at rest · Access logged · No training on client data</span>
            </div>
          </div>
        </aside>
      </main>

      <footer className="landing-footer">
        <span>© 2026 Policy Assistant, Inc. Not a substitute for licensed advice.</span>
        <div className="landing-footer-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#status">Status</a>
        </div>
      </footer>
    </div>
  );
}
