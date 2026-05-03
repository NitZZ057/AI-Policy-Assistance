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
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationSummary, setEvaluationSummary] = useState(null);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
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
    setEvaluationLoading(false);
    setEvaluationSummary(null);
    setEvaluationHistory([]);
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
      const data = await apiRequest("/policy/history");
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
      const data = await apiRequest("/documents");
      setDocuments(data.data || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const loadEvaluation = async () => {
    if (!token) {
      return;
    }

    setEvaluationLoading(true);

    try {
      const [summary, historyData] = await Promise.all([
        apiRequest("/evaluation/summary"),
        apiRequest("/evaluation/history"),
      ]);

      setEvaluationSummary(summary);
      setEvaluationHistory(historyData.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setEvaluationLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadHistory();
      loadDocuments();
      loadEvaluation();
    } else {
      resetAssistantState();
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const hasProcessingDocument = documents.some((document) =>
      ["queued", "processing"].includes(document.status),
    );

    if (!hasProcessingDocument) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadDocuments();
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [documents, token]);

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

      const data = await apiRequest("/document/upload", {
        method: "POST",
        body,
      });

      const uploaded = data.data;
      setSelectedDocumentId(uploaded?.id ? String(uploaded.id) : "");
      setSuccessMessage(data.message || "Document uploaded. Indexing has started.");
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
      const data = await apiRequest("/policy/analyze", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          ...(selectedDocumentId ? { document_id: Number(selectedDocumentId) } : {}),
        }),
      });

      const nextDraft = {
        summary: data.summary || "",
        risk_analysis: data.risk_analysis || "",
        email: data.email || "",
      };
      setDraft(nextDraft);
      setReferences(data.references || []);
      setCurrentAnalysisId(data.id || null);

      await loadHistory();
      window.setTimeout(() => {
        loadEvaluation();
      }, 4000);
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
      const data = await apiRequest(`/policy/${currentAnalysisId}/finalize`, {
        method: "PUT",
        body: JSON.stringify({
          final_output_payload: draft,
        }),
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
    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        references: [],
        streaming: true,
      },
    ]);
    setQuestion("");
    setQueryLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await streamDocumentAnswer({
        apiBaseUrl,
        assistantMessageId,
        documentId: Number(selectedDocumentId),
        getToken: () => token,
        onDelta: (delta) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: `${message.content}${delta}`,
                  }
                : message,
            ),
          );
        },
        onDone: (payload) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: payload.answer || message.content || "No grounded answer was returned.",
                    references: payload.references || [],
                    streaming: false,
                  }
                : message,
            ),
          );
        },
        question: trimmedQuestion,
      });

      await loadEvaluation();
    } catch (requestError) {
      setError(requestError.message);
      setMessages((current) =>
        current.filter((message) => message.id !== userMessage.id && message.id !== assistantMessageId),
      );
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
    evaluationHistory,
    evaluationLoading,
    evaluationSummary,
    form,
    history,
    historyLoading,
    loadDemoPolicy,
    loadDocuments,
    loadEvaluation,
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

async function streamDocumentAnswer({
  apiBaseUrl,
  documentId,
  getToken,
  onDelta,
  onDone,
  question,
}) {
  const response = await fetch(`${apiBaseUrl}/document/query/stream`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify({
      document_id: documentId,
      question,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.detail || "Unable to stream document answer.");
  }

  if (!response.body) {
    throw new Error("This browser does not support streaming responses.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const rawEvent of events) {
      const parsed = parseSseEvent(rawEvent);

      if (!parsed) {
        continue;
      }

      if (parsed.event === "token") {
        onDelta(parsed.data.delta || "");
      }

      if (parsed.event === "done") {
        onDone(parsed.data);
      }

      if (parsed.event === "error") {
        throw new Error(parsed.data.message || "Streaming response failed.");
      }
    }
  }
}

function parseSseEvent(rawEvent) {
  const lines = rawEvent.split("\n");
  const eventLine = lines.find((line) => line.startsWith("event:"));
  const dataLine = lines.find((line) => line.startsWith("data:"));

  if (!eventLine || !dataLine) {
    return null;
  }

  return {
    event: eventLine.slice("event:".length).trim(),
    data: JSON.parse(dataLine.slice("data:".length).trim()),
  };
}

function toReferences(sources) {
  return sources.map((source) => ({
    document: source.document || source.chunk?.document?.original_name || "Policy document",
    section: source.section || source.excerpt || "Referenced section",
    score: source.score || 0,
  }));
}
