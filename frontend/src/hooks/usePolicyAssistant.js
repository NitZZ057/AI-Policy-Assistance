import { useEffect, useMemo, useState } from "react";
import { demoPolicy, emptyDraft, initialPolicyForm } from "../constants/policy";
import { createApiClient } from "../lib/api";

export function usePolicyAssistant({ apiBaseUrl, token, onUnauthorized }) {
  const [form, setForm] = useState(initialPolicyForm);
  const [draft, setDraft] = useState(emptyDraft);
  const [history, setHistory] = useState([]);
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const apiRequest = useMemo(
    () =>
      createApiClient({
        apiBaseUrl,
        getToken: () => token,
        onUnauthorized: () => {
          onUnauthorized?.();
          resetAssistantState();
        },
      }),
    [apiBaseUrl, onUnauthorized, token],
  );

  function resetAssistantState() {
    setForm(initialPolicyForm);
    setDraft(emptyDraft);
    setHistory([]);
    setCurrentAnalysisId(null);
    setLoading(false);
    setHistoryLoading(false);
    setSavingReview(false);
  }

  const updateFormField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateDraftField = (key, value) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const loadHistory = async () => {
    if (!token) {
      return;
    }

    setHistoryLoading(true);

    try {
      const data = await apiRequest("/api/policy/history");
      setHistory(data.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadHistory();
    } else {
      resetAssistantState();
    }
  }, [token]);

  const openForReview = (entry) => {
    const reviewedOutput = entry.final_output_payload || entry.output_payload || emptyDraft;

    setCurrentAnalysisId(entry.id);
    setDraft({
      summary: reviewedOutput.summary || "",
      risk_analysis: reviewedOutput.risk_analysis || "",
      email: reviewedOutput.email || "",
    });
    setSuccessMessage("");
    setError("");
  };

  const analyzePolicy = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await apiRequest("/api/policy/analyze", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const nextDraft = data.result || emptyDraft;
      setDraft(nextDraft);
      setCurrentAnalysisId(data.meta?.analysis_id || null);

      await loadHistory();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const saveReview = async () => {
    if (!currentAnalysisId) {
      setError("Run or open an analysis before saving a reviewed version.");
      return;
    }

    setSavingReview(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await apiRequest(`/api/policy/${currentAnalysisId}/finalize`, {
        method: "PUT",
        body: JSON.stringify(draft),
      });

      setSuccessMessage(data.message || "Reviewed output saved.");
      await loadHistory();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingReview(false);
    }
  };

  const loadDemoPolicy = () => {
    setForm(demoPolicy);
    setError("");
    setSuccessMessage("");
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setSuccessMessage("Copied to clipboard.");
    } catch {
      setError("Clipboard access is not available in this browser.");
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  return {
    analyzePolicy,
    clearMessages,
    copyText,
    currentAnalysisId,
    draft,
    error,
    form,
    history,
    historyLoading,
    loadDemoPolicy,
    loadHistory,
    loading,
    openForReview,
    saveReview,
    savingReview,
    successMessage,
    updateDraftField,
    updateFormField,
  };
}
