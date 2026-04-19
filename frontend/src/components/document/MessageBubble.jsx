export function MessageBubble({ message }) {
  return (
    <article className={`message-bubble message-bubble-${message.role}`}>
      <p className="chat-role">{message.role === "user" ? "You" : "Assistant"}</p>
      <p>{message.content}</p>
      {message.references?.length ? (
        <div className="reference-list">
          {message.references.map((reference) => (
            <span className="reference-pill" key={`${message.id}-${reference.document}-${reference.section}`}>
              {reference.document} / {reference.section}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
