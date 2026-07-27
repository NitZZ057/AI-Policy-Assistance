const navItems = [
  { id: "policy", label: "Policy Analysis" },
  { id: "documents", label: "Document Assistant" },
  { id: "evaluation", label: "AI Evaluation" },
];

function initials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function Sidebar({ activeWorkspace, navCounts = {}, onWorkspaceChange, onLogout, records = [], user }) {
  return (
    <aside className="app-sidebar">
      <div className="brand-block">
        <span className="brand-mark">AP</span>
        <div className="brand-text">
          <p className="eyebrow">Policy Assistant</p>
          <h1>Workspace</h1>
        </div>
      </div>

      <nav className="sidebar-body" aria-label="Primary">
        <p className="sidebar-heading">Agents</p>

        {navItems.map((item) => (
          <button
            className={activeWorkspace === item.id ? "nav-button nav-button-active" : "nav-button"}
            key={item.id}
            type="button"
            onClick={() => onWorkspaceChange(item.id)}
          >
            <span className="nav-dot" />
            <span className="nav-label">{item.label}</span>
            <span className="nav-count">{navCounts[item.id] ?? "—"}</span>
          </button>
        ))}

        <p className="sidebar-heading sidebar-heading-spaced">Records</p>

        <div className="records-list">
          {records.map((record) => (
            <div className="records-row" key={record.label}>
              <span>{record.label}</span>
              <strong>{record.value}</strong>
            </div>
          ))}
        </div>
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-row">
          <span className="user-avatar">{initials(user.name) || "AP"}</span>
          <div className="sidebar-user-meta">
            <strong>{user.name}</strong>
            <span>{user.is_guest ? "Temporary session · read/write" : user.email}</span>
          </div>
        </div>

        <button className="sidebar-signout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
