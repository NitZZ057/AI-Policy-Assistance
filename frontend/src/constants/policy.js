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

export const policyFieldConfig = [
  {
    key: "type",
    label: "Policy Type",
    placeholder: "Commercial Property",
  },
  {
    key: "coverage",
    label: "Coverage",
    placeholder: "Building and contents up to $500,000",
  },
  {
    key: "location",
    label: "Location",
    placeholder: "Pune, Maharashtra",
  },
  {
    key: "risk",
    label: "Risk Notes",
    placeholder: "Moderate flood risk near river zone",
  },
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
