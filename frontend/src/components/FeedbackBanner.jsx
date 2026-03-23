export function FeedbackBanner({ error, successMessage }) {
  return (
    <>
      {error ? <div className="feedback error">{error}</div> : null}
      {successMessage ? <div className="feedback success">{successMessage}</div> : null}
    </>
  );
}
