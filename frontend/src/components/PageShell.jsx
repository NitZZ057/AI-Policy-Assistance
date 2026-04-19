export function PageShell({ children }) {
  return (
    <div className="page-shell">
      <main className="layout">{children}</main>
    </div>
  );
}
