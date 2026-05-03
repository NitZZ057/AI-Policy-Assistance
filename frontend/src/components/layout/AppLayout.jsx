import { Sidebar } from "./Sidebar";

export function AppLayout({
  activeWorkspace,
  main,
  onLogout,
  onWorkspaceChange,
  output,
  subtitle,
  title,
  user,
}) {
  return (
    <div className="app-layout">
      <Sidebar
        activeWorkspace={activeWorkspace}
        onLogout={onLogout}
        onWorkspaceChange={onWorkspaceChange}
        user={user}
      />

      <main className="main-workspace">
        <header className="page-header">
          <p className="eyebrow">
            {activeWorkspace === "policy"
              ? "Policy Analysis Agent"
              : activeWorkspace === "documents"
                ? "Document Q&A Agent"
                : "Evaluation Layer"}
          </p>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </header>
        {main}
      </main>

      <aside className="context-panel">{output}</aside>
    </div>
  );
}
