import { policyFieldConfig } from "../constants/policy";

export function PolicyForm({ form, loading, onSubmit, onUpdateField, onLoadDemo }) {
  return (
    <form className="policy-form" onSubmit={onSubmit}>
      <div className="form-heading">
        <div>
          <p className="section-label">Policy Input</p>
          <h2>Analyze a policy</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onLoadDemo}>
          Load demo data
        </button>
      </div>

      <div className="form-grid">
        {policyFieldConfig.map((field) => (
          <label className="field" key={field.key}>
            <span>{field.label}</span>
            <textarea
              rows={field.key === "coverage" || field.key === "risk" ? 4 : 2}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={(event) => onUpdateField(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Analyzing..." : "Analyze policy"}
      </button>
    </form>
  );
}
