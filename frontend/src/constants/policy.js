export const initialPolicyForm = {
  type: "",
  coverage: "",
  location: "",
  risk: "",
};

export const emptyDraft = {
  summary: "",
  risk_analysis: "",
  email: "",
};

export const initialAuthForm = {
  name: "",
  email: "",
  password: "",
};

/* Order matters — the two-column grid fills left-to-right, so the two
   single-line fields sit on the first row and the two textareas below. */
export const policyFieldConfig = [
  {
    key: "type",
    label: "Policy type",
    control: "input",
    placeholder: "Commercial Property",
  },
  {
    key: "location",
    label: "Location",
    control: "input",
    placeholder: "Austin, Texas",
  },
  {
    key: "coverage",
    label: "Coverage",
    control: "textarea",
    rows: 3,
    placeholder: "Building, inventory, and business interruption up to $750,000",
  },
  {
    key: "risk",
    label: "Risk notes",
    control: "textarea",
    rows: 3,
    placeholder: "Seasonal storm exposure with a recent roofing claim",
  },
];

export const questionStarters = [
  "What does this policy say about flood exclusions?",
  "Summarise the business interruption waiting period.",
  "Which endorsements change the wind/hail deductible?",
  "What notice is required for a mid-term cancellation?",
];

export const draftFieldConfig = [
  { key: "summary", label: "Summary", rows: 6 },
  { key: "risk_analysis", label: "Risk Analysis", rows: 6 },
  { key: "email", label: "Client Email", rows: 10 },
];

export const demoPolicy = {
  type: "Commercial Property",
  coverage: "Building, inventory, and business interruption up to $750,000",
  location: "Austin, Texas",
  risk: "Seasonal storm exposure with a recent roofing claim",
};
