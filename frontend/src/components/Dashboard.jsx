import { useState } from "react";
import { ChatWindow } from "./document/ChatWindow";
import { DocumentAssistant } from "./document/DocumentAssistant";
import { AppLayout } from "./layout/AppLayout";
import { PolicyForm } from "./policy/PolicyForm";
import { PolicyOutput } from "./policy/PolicyOutput";
import { HistoryList } from "./HistoryList";
import { EvaluationDashboard } from "./evaluation/EvaluationDashboard";
import { EvaluationNotes } from "./evaluation/EvaluationNotes";

const copyByWorkspace = {
  policy: {
    eyebrow: "Policy analysis agent",
    title: "Analyze a policy",
    subtitle:
      "Enter structured policy details, then review and approve the drafted output before it reaches a client.",
  },
  documents: {
    eyebrow: "Document Q&A agent",
    title: "Ask a document question",
    subtitle:
      "Select an indexed policy document and ask grounded questions. Every answer cites the clause it came from.",
  },
  evaluation: {
    eyebrow: "Evaluation layer",
    title: "Measure AI quality",
    subtitle:
      "Track faithfulness, answer relevance, and retrieval quality across RAG-backed agent responses.",
  },
};

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

  const approvedFinals = history.filter((entry) => entry.reviewed_at || entry.status === "reviewed").length;
  const selectedDocument = documents.find((document) => String(document.id) === String(selectedDocumentId));

  const copy = copyByWorkspace[activeWorkspace];

  return (
    <AppLayout
      activeWorkspace={activeWorkspace}
      eyebrow={copy.eyebrow}
      navCounts={{
        policy: history.length,
        documents: documents.length,
        evaluation: evaluationSummary?.total_evaluations || 0,
      }}
      onLogout={onLogout}
      onWorkspaceChange={setActiveWorkspace}
      records={[
        { label: "Analyses", value: history.length },
        { label: "Awaiting review", value: history.length - approvedFinals },
        { label: "Approved finals", value: approvedFinals },
      ]}
      subtitle={copy.subtitle}
      title={copy.title}
      user={user}
      main={
        <div className="main-stack">
          {isPolicy ? (
            <>
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
            </>
          ) : isDocuments ? (
            <DocumentAssistant
              documentLoading={documentLoading}
              documents={documents}
              onSelectDocument={onSelectDocument}
              onUpdateQuestion={onUpdateQuestion}
              onUploadDocument={onUploadDocument}
              selectedDocumentId={selectedDocumentId}
            />
          ) : (
            <EvaluationDashboard
              evaluationLoading={evaluationLoading}
              evaluationSummary={evaluationSummary}
              onRefresh={onLoadEvaluation}
            />
          )}
        </div>
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
            selectedDocumentName={selectedDocument?.original_name}
            successMessage={successMessage}
          />
        ) : (
          <EvaluationNotes evaluationHistory={evaluationHistory} />
        )
      }
    />
  );
}
