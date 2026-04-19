import { useEffect, useMemo, useState } from "react";
import { demoPolicy, emptyDraft, initialPolicyForm } from "../constants/policy";
import { createApiClient } from "../lib/api";

export function usePolicyAssistant({ apiBaseUrl, token, onUnauthorized }) {
  const [form, setForm] = useState(initialPolicyForm);
  const [draft, setDraft] = useState(emptyDraft);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [references, setReferences] = useState([]);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
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
    setDocuments([]);
    setSelectedDocumentId("");
    setReferences([]);
    setMessages([]);
    setQuestion("");
    setCurrentAnalysisId(null);
    setLoading(false);
    setDocumentLoading(false);
    setQueryLoading(false);
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

  const loadDocuments = async () => {
    if (!token) {
      return;
    }

    try {
      const data = await apiRequest("/api/documents");
      setDocuments(data.data || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    if (token) {
      loadHistory();
      loadDocuments();
    } else {
      resetAssistantState();
    }
  }, [token]);

  const openForReview = (entry) => {
    const reviewedOutput = entry.final_output_payload || entry.output_payload || emptyDraft;

    setCurrentAnalysisId(entry.id);
    setReferences(toReferences(entry.sources || []));
    setSelectedDocumentId(entry.policy_document_id ? String(entry.policy_document_id) : "");
    setDraft({
      summary: reviewedOutput.summary || "",
      risk_analysis: reviewedOutput.risk_analysis || "",
      email: reviewedOutput.email || "",
    });
    setSuccessMessage("");
    setError("");
  };

  const uploadDocument = async (file) => {
    if (!file) {
      return;
    }

    setDocumentLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const body = new FormData();
      body.append("document", file);

      const data = await apiRequest("/api/document/upload", {
        method: "POST",
        body,
      });

      const uploaded = data.data;
      setSelectedDocumentId(uploaded?.id ? String(uploaded.id) : "");
      setSuccessMessage(data.message || "Document uploaded and indexed.");
      await loadDocuments();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDocumentLoading(false);
    }
  };

  const analyzePolicy = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await apiRequest("/api/policy/analyze", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          ...(selectedDocumentId ? { document_id: Number(selectedDocumentId) } : {}),
        }),
      });

      const nextDraft = data.result || emptyDraft;
      setDraft(nextDraft);
      setReferences(data.references || []);
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

  const updateSelectedDocumentId = (value) => {
    setSelectedDocumentId(value);
    setMessages([]);
    setQuestion("");
    setSuccessMessage("");
    setError("");
  };

  const updateQuestion = (value) => {
    setQuestion(value);
    setSuccessMessage("");
    setError("");
  };

  const queryDocument = async () => {
    const trimmedQuestion = question.trim();

    if (!selectedDocumentId) {
      setError("Select a ready document before asking a question.");
      return;
    }

    if (!trimmedQuestion) {
      setError("Ask a question about the selected document.");
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setQueryLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await apiRequest("/api/document/query", {
        method: "POST",
        body: JSON.stringify({
          document_id: Number(selectedDocumentId),
          question: trimmedQuestion,
        }),
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer || "No grounded answer was returned.",
          references: data.references || [],
        },
      ]);
    } catch (requestError) {
      setError(requestError.message);
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
    } finally {
      setQueryLoading(false);
    }
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
    documentLoading,
    documents,
    draft,
    error,
    form,
    history,
    historyLoading,
    loadDemoPolicy,
    loadDocuments,
    loadHistory,
    loading,
    messages,
    openForReview,
    queryDocument,
    queryLoading,
    question,
    references,
    saveReview,
    savingReview,
    selectedDocumentId,
    successMessage,
    updateQuestion,
    updateSelectedDocumentId,
    updateDraftField,
    updateFormField,
    uploadDocument,
  };
}

function toReferences(sources) {
  return sources.map((source) => ({
    document: source.chunk?.document?.original_name || "Policy document",
    section: source.excerpt || "Referenced section",
    score: source.score || 0,
  }));
}
