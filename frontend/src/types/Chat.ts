/**
 * Synthetic integration contract.
 *
 * These types describe test data, not real legal or policy answers.
 * TypeScript types do not validate incoming JSON at runtime.
 */

export interface ChatRequest {
  question: string;
}

export interface SupportingQuote {
  evidence_id: string;
  quote: string;
}

export interface SyntheticClaim {
  claim_id: string;
  text: string;
  supporting_quotes: SupportingQuote[];
}

export interface SyntheticEvidence {
  paragraph_id: string;
  document_id: string;
  corpus_revision: "synthetic-v1";

  document_title: string;
  pdf_page_number: number;
  printed_page_label: string | null;
  original_paragraph_label: string | null;
  derived_locator: string;

  exact_text: string;
  official_source_url: null;
  synthetic: true;
}

export interface SyntheticChatResponse {
  status: "answered";
  mode: "synthetic";
  corpus_revision: "synthetic-v1";

  evidence_label: "Supported by retrieved sources";

  claims: SyntheticClaim[];
  evidence: SyntheticEvidence[];

  notice: "SYNTHETIC TEST DATA — not law or policy.";
  disclaimer: "Informational assistance, not legal advice.";
}

export type ApiErrorCode =
  | "INVALID_QUESTION"
  | "INVALID_REQUEST"
  | "AI_GATEWAY_NOT_CONFIGURED"
  | "AI_INVALID_RESPONSE"
  | "AI_SERVICE_ERROR";

export interface ApiErrorResponse {
  status: "error";
  code: ApiErrorCode;
  message: string;
  retryable: boolean;
}

/**
 * Client-side failures are separate from backend error responses.
 * For example, an unreachable backend may return no JSON at all.
 */
export interface ClientError {
  kind: "client-error";
  code: "NETWORK_ERROR" | "UNEXPECTED_RESPONSE";
  message: string;
  retryable: boolean;
}

/**
 * UI state is local frontend state, not an API response.
 */
export type ChatState =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "success";
      response: SyntheticChatResponse;
    }
  | {
      kind: "failure";
      error: ApiErrorResponse | ClientError;
    };