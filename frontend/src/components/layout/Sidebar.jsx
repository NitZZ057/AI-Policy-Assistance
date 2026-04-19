export function Sidebar({ activeWorkspace, onWorkspaceChange, onLogout, user }) {
  const navItems = [
    { id: "policy", label: "Policy Analysis" },
    { id: "documents", label: "Document Assistant" },
  ];

  return (
    <aside className="app-sidebar">
      <div>
        <div className="brand-block">
          <span className="brand-mark">AI</span>
          <div>
            <p className="eyebrow">Policy Assistant</p>
            <h1>Workspace</h1>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map((item) => (
            <button
              className={activeWorkspace === item.id ? "nav-button nav-button-active" : "nav-button"}
              key={item.id}
              type="button"
              onClick={() => onWorkspaceChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-user">
        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
        <button className="tertiary-button" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
