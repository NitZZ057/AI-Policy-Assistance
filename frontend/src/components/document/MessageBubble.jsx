import { renderMarkdownLite } from "../../lib/markdown.jsx";

function citationLine(references) {
  return references
    .map((reference) => [reference.document, reference.section].filter(Boolean).join(" · "))
    .filter(Boolean)
    .join("  |  ");
}

export function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const citation = message.references?.length ? citationLine(message.references) : "";

  return (
    <div className={isUser ? "message-row message-row-user" : "message-row"}>
      <div className={isUser ? "message-bubble message-bubble-user" : "message-bubble"}>
        {isUser ? (
          message.content
        ) : (
          <div className="formatted-answer">
            {message.content ? renderMarkdownLite(message.content) : null}
            {message.streaming ? <span className="typing-cursor" aria-hidden="true" /> : null}
          </div>
        )}
      </div>

      {citation ? <span className="message-citation">{citation}</span> : null}
    </div>
  );
}
