import { useState } from "react";
import { ChatWindow } from "./document/ChatWindow";
import { DocumentAssistant } from "./document/DocumentAssistant";
import { AppLayout } from "./layout/AppLayout";
import { PolicyForm } from "./policy/PolicyForm";
import { PolicyOutput } from "./policy/PolicyOutput";
import { HistoryList } from "./HistoryList";

export function Dashboard({
  currentAnalysisId,
  documentLoading,
  documents,
  draft,
  error,
  form,
  history,
  historyLoading,
  loading,
  messages,
  onAnalyzePolicy,
  onCopy,
  onLoadDemoPolicy,
  onLoadHistory,
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

  return (
    <AppLayout
      activeWorkspace={activeWorkspace}
      onLogout={onLogout}
      onWorkspaceChange={setActiveWorkspace}
      title={isPolicy ? "Analyze a policy" : "Ask a document question"}
      subtitle={
        isPolicy
          ? "Enter structured policy details in the workspace. Review and approve AI output in the panel."
          : "Select an uploaded policy document, then ask grounded questions in the chat panel."
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
        ) : (
          <DocumentAssistant
            documentLoading={documentLoading}
            documents={documents}
            onSelectDocument={onSelectDocument}
            onUploadDocument={onUploadDocument}
            selectedDocumentId={selectedDocumentId}
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
        ) : (
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
        )
      }
    />
  );
}
