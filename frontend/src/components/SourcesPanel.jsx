export function SourcesPanel({ references }) {
  if (!references.length) {
    return null;
  }

  return (
    <section className="sources-panel">
      <p className="section-label">References</p>
      <h2>Document context used</h2>

      <div className="sources-list">
        {references.map((reference) => (
          <article className="source-item" key={`${reference.document}-${reference.section}`}>
            <div className="source-item-header">
              <strong>{reference.document || "Policy document"}</strong>
              <span>{Number(reference.score || 0).toFixed(3)}</span>
            </div>
            <p>{reference.section || "Referenced section"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
