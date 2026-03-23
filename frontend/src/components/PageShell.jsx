export function PageShell({ children }) {
  return (
    <div className="page-shell">
      <div className="background-orb background-orb-left" />
      <div className="background-orb background-orb-right" />
      <main className="layout">{children}</main>
    </div>
  );
}
