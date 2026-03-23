import { HeroSection } from "./HeroSection";
import { HistoryList } from "./HistoryList";
import { PageShell } from "./PageShell";
import { PolicyForm } from "./PolicyForm";
import { ReviewWorkspace } from "./ReviewWorkspace";

export function Dashboard({
  currentAnalysisId,
  draft,
  error,
  form,
  history,
  historyLoading,
  loading,
  onAnalyzePolicy,
  onCopy,
  onLoadDemoPolicy,
  onLoadHistory,
  onLogout,
  onOpenForReview,
  onSaveReview,
  onUpdateDraftField,
  onUpdateFormField,
  savingReview,
  successMessage,
  user,
}) {
  return (
    <PageShell>
      <HeroSection onLogout={onLogout} user={user} />

      <section className="workspace-card">
        <PolicyForm
          form={form}
          loading={loading}
          onLoadDemo={onLoadDemoPolicy}
          onSubmit={onAnalyzePolicy}
          onUpdateField={onUpdateFormField}
        />
        <ReviewWorkspace
          currentAnalysisId={currentAnalysisId}
          draft={draft}
          error={error}
          onCopy={onCopy}
          onSaveReview={onSaveReview}
          onUpdateDraftField={onUpdateDraftField}
          savingReview={savingReview}
          successMessage={successMessage}
        />
      </section>

      <HistoryList
        history={history}
        historyLoading={historyLoading}
        onLoadHistory={onLoadHistory}
        onOpenForReview={onOpenForReview}
      />
    </PageShell>
  );
}
