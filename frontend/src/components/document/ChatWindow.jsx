import { FeedbackBanner } from "../FeedbackBanner";
import { MessageBubble } from "./MessageBubble";

export function ChatWindow({
  error,
  messages,
  onQueryDocument,
  onUpdateQuestion,
  question,
  queryLoading,
  selectedDocumentName,
  selectedDocumentId,
  successMessage,
}) {
  return (
    <>
      <div className="context-panel-header">
        <div className="card-header-copy">
          <p className="section-label">Chat</p>
          <h3>Document answers</h3>
        </div>
      </div>

      <div className="chat-stream" aria-live="polite">
        <FeedbackBanner error={error} successMessage={successMessage} />

        {!messages.length ? (
          <p className="empty-state">
            No questions yet. Select a ready document, then ask about limits, exclusions, terms, or renewal notes.
          </p>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}

        {queryLoading && !messages.some((message) => message.streaming) ? (
          <div className="message-row">
            <div className="message-bubble">Searching the selected document…</div>
          </div>
        ) : null}
      </div>

      <form className="chat-composer" onSubmit={onQueryDocument}>
        <textarea
          rows={2}
          placeholder="Ask about limits, exclusions, terms, or renewal notes"
          value={question}
          onChange={(event) => onUpdateQuestion(event.target.value)}
        />

        <div className="chat-composer-row">
          <span className="chat-composer-caption">
            {selectedDocumentName ? `Grounded in ${selectedDocumentName}` : "Select a ready document to ask"}
          </span>
          <button className="primary-button" type="submit" disabled={queryLoading || !selectedDocumentId}>
            {queryLoading ? "Asking…" : "Ask"}
          </button>
        </div>
      </form>
    </>
  );
}
