Policy details:
Type: {{ $policy['type'] }}
Coverage: {{ $policy['coverage'] }}
Location: {{ $policy['location'] }}
Risk: {{ $policy['risk'] }}

Return response strictly as JSON with this exact shape:
{
  "summary": "",
  "risk_analysis": "",
  "email": ""
}

Guidelines:
- Keep summary concise and decision-useful.
- Explain the main risks in plain business language.
- Write the email so it can be sent to a client with light edits.
