import { FeedbackBanner } from "../FeedbackBanner";
import { MessageBubble } from "./MessageBubble";

export function ChatWindow({
  error,
  messages,
  onQueryDocument,
  onUpdateQuestion,
  question,
  queryLoading,
  selectedDocumentId,
  successMessage,
}) {
  return (
    <div className="chat-window">
      <div className="context-panel-header">
        <div>
          <p className="section-label">Chat</p>
          <h3>Document answers</h3>
        </div>
      </div>

      <FeedbackBanner error={error} successMessage={successMessage} />

      <div className="chat-stream" aria-live="polite">
        {!messages.length ? (
          <div className="empty-state">
            No questions yet. Select a ready document, then ask about limits, exclusions, terms, or renewal notes.
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}

        {queryLoading && !messages.some((message) => message.streaming) ? (
          <div className="message-bubble message-bubble-assistant">Searching the selected document...</div>
        ) : null}
      </div>

      <form className="chat-composer" onSubmit={onQueryDocument}>
        <label className="field">
          <span>Question</span>
          <textarea
            placeholder="What does this policy say about flood exclusions?"
            rows={3}
            value={question}
            onChange={(event) => onUpdateQuestion(event.target.value)}
          />
        </label>
        <button className="primary-button primary-button-wide" type="submit" disabled={queryLoading || !selectedDocumentId}>
          {queryLoading ? "Searching..." : "Ask Document"}
        </button>
      </form>
    </div>
  );
}
