import type { SyntheticChatResponse } from "../types/chat";

const PARAGRAPH_ID = "synthetic-doc-001-p001-para001";

const FIXTURE_TEXT =
  "In this synthetic test scenario, the example application " +
  "fee is 10 test credits.";

/**
 * Creates a fresh synthetic response for each caller.
 *
 * This is invented test data, not an official document.
 * It does not answer or interpret a user's question.
 */
export function createSyntheticChatResponse(): SyntheticChatResponse {
  return {
    status: "answered",
    mode: "synthetic",
    corpus_revision: "synthetic-v1",

    evidence_label: "Supported by retrieved sources",

    claims: [
      {
        claim_id: "synthetic-claim-001",
        text: FIXTURE_TEXT,
        supporting_quotes: [
          {
            evidence_id: PARAGRAPH_ID,
            quote: FIXTURE_TEXT,
          },
        ],
      },
    ],

    evidence: [
      {
        paragraph_id: PARAGRAPH_ID,
        document_id: "synthetic-doc-001",
        corpus_revision: "synthetic-v1",

        document_title: "SYNTHETIC FIXTURE — Example Application",
        pdf_page_number: 1,
        printed_page_label: null,
        original_paragraph_label: null,
        derived_locator: "Extracted paragraph 1 on PDF page 1.",

        exact_text: FIXTURE_TEXT,
        official_source_url: null,
        synthetic: true,
      },
    ],

    notice: "SYNTHETIC TEST DATA — not law or policy.",
    disclaimer: "Informational assistance, not legal advice.",
  };
}