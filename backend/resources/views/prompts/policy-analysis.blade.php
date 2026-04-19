Policy details:
Type: {{ $policy['type'] }}
Coverage: {{ $policy['coverage'] }}
Location: {{ $policy['location'] }}
Risk: {{ $policy['risk'] }}

@if(($chunks ?? collect())->isNotEmpty())
Relevant policy document context:
@foreach($chunks as $chunk)
[SOURCE chunk_id={{ $chunk->id }}, document="{{ $chunk->document->original_name }}", score={{ number_format($chunk->similarity_score ?? 0, 4) }}]
{{ $chunk->content }}

@endforeach
@else
Relevant policy document context: No uploaded document context was selected for this analysis.
@endif

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
- Ground document-specific claims in the source context above. If the source context is missing or insufficient, say what needs manual review.
