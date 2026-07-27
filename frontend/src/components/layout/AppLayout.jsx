import { Sidebar } from "./Sidebar";

export function AppLayout({
  activeWorkspace,
  eyebrow,
  main,
  navCounts,
  onLogout,
  onWorkspaceChange,
  output,
  records,
  subtitle,
  title,
  user,
}) {
  return (
    <div className="workspace-scroll">
      <div className="app-layout">
        <Sidebar
          activeWorkspace={activeWorkspace}
          navCounts={navCounts}
          onLogout={onLogout}
          onWorkspaceChange={onWorkspaceChange}
          records={records}
          user={user}
        />

        <main className="main-workspace">
          <header className="page-header">
            <div className="page-header-copy">
              <p className="eyebrow">{eyebrow}</p>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>

            <div className="page-header-aside">
              <span className="pill pill-accent">
                <span className="pill-dot" />
                Session logged
              </span>
            </div>
          </header>

          {main}
        </main>

        <aside className="context-panel">{output}</aside>
      </div>
    </div>
  );
}
