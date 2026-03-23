import { useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { useAuth } from "./hooks/useAuth";
import { usePolicyAssistant } from "./hooks/usePolicyAssistant";

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const auth = useAuth(apiBaseUrl);
  const assistant = usePolicyAssistant({
    apiBaseUrl,
    token: auth.token,
    onUnauthorized: auth.clearAuth,
  });

  if (!auth.isAuthenticated) {
    return <AuthContainer auth={auth} />;
  }

  return (
    <Dashboard
      currentAnalysisId={assistant.currentAnalysisId}
      draft={assistant.draft}
      error={assistant.error}
      form={assistant.form}
      history={assistant.history}
      historyLoading={assistant.historyLoading}
      loading={assistant.loading}
      onAnalyzePolicy={(event) => {
        event.preventDefault();
        assistant.analyzePolicy();
      }}
      onCopy={assistant.copyText}
      onLoadDemoPolicy={assistant.loadDemoPolicy}
      onLoadHistory={assistant.loadHistory}
      onLogout={async () => {
        await auth.logout();
        assistant.clearMessages();
      }}
      onOpenForReview={assistant.openForReview}
      onSaveReview={assistant.saveReview}
      onUpdateDraftField={assistant.updateDraftField}
      onUpdateFormField={assistant.updateFormField}
      savingReview={assistant.savingReview}
      successMessage={assistant.successMessage}
      user={auth.user}
    />
  );
}

function AuthContainer({ auth }) {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      const message = await auth.submitAuth();
      setSuccessMessage(message);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <AuthScreen
      authForm={auth.authForm}
      authLoading={auth.authLoading}
      authMode={auth.authMode}
      error={error}
      onModeChange={auth.setAuthMode}
      onSubmit={handleSubmit}
      onUpdateField={auth.updateAuthField}
      successMessage={successMessage}
    />
  );
}

export default App;
