import { useState } from "react";
import { ChatWindow } from "./document/ChatWindow";
import { DocumentAssistant } from "./document/DocumentAssistant";
import { AppLayout } from "./layout/AppLayout";
import { PolicyForm } from "./policy/PolicyForm";
import { PolicyOutput } from "./policy/PolicyOutput";
import { HistoryList } from "./HistoryList";
import { EvaluationDashboard } from "./evaluation/EvaluationDashboard";

export function Dashboard({
  currentAnalysisId,
  documentLoading,
  documents,
  draft,
  error,
  form,
  history,
  historyLoading,
  evaluationHistory,
  evaluationLoading,
  evaluationSummary,
  loading,
  messages,
  onAnalyzePolicy,
  onCopy,
  onLoadDemoPolicy,
  onLoadHistory,
  onLoadEvaluation,
  onLogout,
  onOpenForReview,
  onQueryDocument,
  onSaveReview,
  onSelectDocument,
  onUpdateDraftField,
  onUpdateFormField,
  onUpdateQuestion,
  onUploadDocument,
  question,
  queryLoading,
  references,
  savingReview,
  selectedDocumentId,
  successMessage,
  user,
}) {
  const [activeWorkspace, setActiveWorkspace] = useState("policy");

  const isPolicy = activeWorkspace === "policy";
  const isDocuments = activeWorkspace === "documents";
  const isEvaluation = activeWorkspace === "evaluation";

  return (
    <AppLayout
      activeWorkspace={activeWorkspace}
      onLogout={onLogout}
      onWorkspaceChange={setActiveWorkspace}
      title={
        isPolicy
          ? "Analyze a policy"
          : isDocuments
            ? "Ask a document question"
            : "Measure AI quality"
      }
      subtitle={
        isPolicy
          ? "Enter structured policy details in the workspace. Review and approve AI output in the panel."
          : isDocuments
            ? "Select an uploaded policy document, then ask grounded questions in the chat panel."
            : "Track faithfulness, relevance, and retrieval quality across RAG-backed agent responses."
      }
      user={user}
      main={
        isPolicy ? (
          <div className="main-stack">
            <PolicyForm
              documentLoading={documentLoading}
              documents={documents}
              form={form}
              loading={loading}
              onLoadDemo={onLoadDemoPolicy}
              onSelectDocument={onSelectDocument}
              onSubmit={onAnalyzePolicy}
              onUpdateField={onUpdateFormField}
              onUploadDocument={onUploadDocument}
              selectedDocumentId={selectedDocumentId}
            />
            <HistoryList
              history={history}
              historyLoading={historyLoading}
              onLoadHistory={onLoadHistory}
              onOpenForReview={onOpenForReview}
            />
          </div>
        ) : isDocuments ? (
          <DocumentAssistant
            documentLoading={documentLoading}
            documents={documents}
            onSelectDocument={onSelectDocument}
            onUploadDocument={onUploadDocument}
            selectedDocumentId={selectedDocumentId}
          />
        ) : (
          <EvaluationDashboard
            evaluationHistory={evaluationHistory}
            evaluationLoading={evaluationLoading}
            evaluationSummary={evaluationSummary}
            onRefresh={onLoadEvaluation}
          />
        )
      }
      output={
        isPolicy ? (
          <PolicyOutput
            currentAnalysisId={currentAnalysisId}
            draft={draft}
            error={error}
            onCopy={onCopy}
            onSaveReview={onSaveReview}
            onUpdateDraftField={onUpdateDraftField}
            references={references}
            savingReview={savingReview}
            successMessage={successMessage}
          />
        ) : isDocuments ? (
          <ChatWindow
            error={error}
            messages={messages}
            onQueryDocument={onQueryDocument}
            onUpdateQuestion={onUpdateQuestion}
            question={question}
            queryLoading={queryLoading}
            selectedDocumentId={selectedDocumentId}
            successMessage={successMessage}
          />
        ) : (
          <div className="output-stack">
            <div className="context-panel-header">
              <div>
                <p className="section-label">Observability</p>
                <h3>Evaluation notes</h3>
              </div>
            </div>
            <div className="empty-state">
              RAGAS evaluations run after RAG-backed responses and are stored asynchronously, so user-facing answers are not blocked by scoring.
            </div>
          </div>
        )
      }
    />
  );
}
