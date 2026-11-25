import type {
  SupportingQuote,
  SyntheticClaim,
  SyntheticChatResponse,
  SyntheticEvidence,
} from "../types/chat";

function invalidResponse(): never {
  throw new Error("The server returned an invalid synthetic response.");
}

function object(value: unknown): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return invalidResponse();
  }

  return value as Record<string, unknown>;
}

function text(value: unknown, maximumLength: number): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maximumLength
  ) {
    return invalidResponse();
  }

  // Preserve original text rather than returning a trimmed version.
  return value;
}

function boundedArray(value: unknown): unknown[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > 10
  ) {
    return invalidResponse();
  }

  return value;
}

function requireCondition(condition: boolean): void {
  if (!condition) {
    invalidResponse();
  }
}

function parseEvidence(value: unknown): SyntheticEvidence {
  const item = object(value);

  requireCondition(item.corpus_revision === "synthetic-v1");
  requireCondition(item.synthetic === true);
  requireCondition(item.printed_page_label === null);
  requireCondition(item.original_paragraph_label === null);
  requireCondition(item.official_source_url === null);

  const page = item.pdf_page_number;

  if (
    typeof page !== "number" ||
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    return invalidResponse();
  }

  const title = text(item.document_title, 1000);
  requireCondition(title.startsWith("SYNTHETIC FIXTURE — "));

  return {
    paragraph_id: text(item.paragraph_id, 200),
    document_id: text(item.document_id, 200),
    corpus_revision: "synthetic-v1",
    document_title: title,
    pdf_page_number: page,
    printed_page_label: null,
    original_paragraph_label: null,
    derived_locator: text(item.derived_locator, 1000),
    exact_text: text(item.exact_text, 20_000),
    official_source_url: null,
    synthetic: true,
  };
}

function parseQuote(value: unknown): SupportingQuote {
  const item = object(value);

  return {
    evidence_id: text(item.evidence_id, 200),
    quote: text(item.quote, 20_000),
  };
}

function parseClaim(value: unknown): SyntheticClaim {
  const item = object(value);

  return {
    claim_id: text(item.claim_id, 200),
    text: text(item.text, 2000),
    supporting_quotes: boundedArray(item.supporting_quotes).map(
      parseQuote,
    ),
  };
}

export function parseSyntheticResponse(
  value: unknown,
): SyntheticChatResponse {
  const response = object(value);

  requireCondition(response.status === "answered");
  requireCondition(response.mode === "synthetic");
  requireCondition(response.corpus_revision === "synthetic-v1");
  requireCondition(
    response.evidence_label === "Supported by retrieved sources",
  );
  requireCondition(
    response.notice === "SYNTHETIC TEST DATA — not law or policy.",
  );
  requireCondition(
    response.disclaimer ===
      "Informational assistance, not legal advice.",
  );

  const evidence = boundedArray(response.evidence).map(parseEvidence);
  const claims = boundedArray(response.claims).map(parseClaim);

  const evidenceById = new Map<string, SyntheticEvidence>();

  for (const paragraph of evidence) {
    requireCondition(!evidenceById.has(paragraph.paragraph_id));
    evidenceById.set(paragraph.paragraph_id, paragraph);
  }

  const claimIds = new Set<string>();
  const citedEvidenceIds = new Set<string>();

  for (const claim of claims) {
    requireCondition(!claimIds.has(claim.claim_id));
    claimIds.add(claim.claim_id);

    const claimEvidenceIds = new Set<string>();

    for (const support of claim.supporting_quotes) {
      requireCondition(!claimEvidenceIds.has(support.evidence_id));
      claimEvidenceIds.add(support.evidence_id);

      const paragraph = evidenceById.get(support.evidence_id);

      if (!paragraph) {
        return invalidResponse();
      }

      requireCondition(paragraph.exact_text.includes(support.quote));

      // Synthetic-only restriction: display the quotation itself.
      requireCondition(claim.text === support.quote);

      citedEvidenceIds.add(support.evidence_id);
    }
  }

  // Reject unrelated evidence records in this small contract.
  requireCondition(citedEvidenceIds.size === evidenceById.size);

  // Construct a fresh typed response instead of casting the raw JSON.
  // Unknown input properties are not copied into the result.
  return {
    status: "answered",
    mode: "synthetic",
    corpus_revision: "synthetic-v1",
    evidence_label: "Supported by retrieved sources",
    claims,
    evidence,
    notice: "SYNTHETIC TEST DATA — not law or policy.",
    disclaimer: "Informational assistance, not legal advice.",
  };
}