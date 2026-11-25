import type {
  ApiErrorCode,
  ApiErrorResponse,
  ClientError,
  SyntheticChatResponse,
} from "../types/chat";

import { parseSyntheticResponse } from "./parseSyntheticResponse";

export type ChatResult =
  | {
      ok: true;
      response: SyntheticChatResponse;
    }
  | {
      ok: false;
      error: ApiErrorResponse | ClientError;
    };

const REQUEST_TIMEOUT_MS = 30_000;

const SAFE_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_QUESTION:
    "Provide a nonblank question of at most 2000 characters.",
  INVALID_REQUEST:
    "The backend could not read the chat request.",
  AI_GATEWAY_NOT_CONFIGURED:
    "The internal AI gateway is not configured correctly.",
  AI_INVALID_RESPONSE:
    "The AI response failed integrity checks and was not displayed.",
  AI_SERVICE_ERROR:
    "The AI service request failed. Please try again later.",
};

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      SAFE_ERROR_MESSAGES,
      value,
    )
  );
}

function parseApiError(value: unknown): ApiErrorResponse | null {
  if (
    !isObject(value) ||
    value.status !== "error" ||
    !isApiErrorCode(value.code) ||
    typeof value.retryable !== "boolean"
  ) {
    return null;
  }

  return {
    status: "error",
    code: value.code,
    // Use local messages rather than displaying arbitrary server text.
    message: SAFE_ERROR_MESSAGES[value.code],
    retryable: value.retryable,
  };
}

function unexpectedResponse(): ChatResult {
  return {
    ok: false,
    error: {
      kind: "client-error",
      code: "UNEXPECTED_RESPONSE",
      message:
        "The backend response could not be validated and was not displayed.",
      retryable: false,
    },
  };
}

function getChatEndpoint(): string {
  const configuredOrigin: unknown =
    import.meta.env.VITE_BACKEND_BASE_URL;

  if (
    typeof configuredOrigin !== "string" ||
    configuredOrigin.trim().length === 0
  ) {
    throw new Error("Backend origin is not configured.");
  }

  const origin = new URL(configuredOrigin.trim());

  if (
    !["http:", "https:"].includes(origin.protocol) ||
    origin.username !== "" ||
    origin.password !== "" ||
    origin.search !== "" ||
    origin.hash !== "" ||
    origin.pathname !== "/"
  ) {
    throw new Error("Backend origin is invalid.");
  }

  return new URL("/api/chat", origin).toString();
}

export async function requestChat(
  question: string,
): Promise<ChatResult> {
  const trimmedQuestion = question.trim();

  if (
    trimmedQuestion.length === 0 ||
    trimmedQuestion.length > 2000
  ) {
    return {
      ok: false,
      error: {
        status: "error",
        code: "INVALID_QUESTION",
        message: SAFE_ERROR_MESSAGES.INVALID_QUESTION,
        retryable: false,
      },
    };
  }

  let endpoint: string;

  try {
    endpoint = getChatEndpoint();
  } catch {
    return {
      ok: false,
      error: {
        kind: "client-error",
        code: "UNEXPECTED_RESPONSE",
        message: "The frontend backend address is not configured correctly.",
        retryable: false,
      },
    };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: trimmedQuestion,
      }),
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type");

    if (
      !contentType ||
      !contentType.toLowerCase().includes("application/json")
    ) {
      return unexpectedResponse();
    }

    const rawJson: unknown = await response.json();

    if (!response.ok) {
      const error = parseApiError(rawJson);

      return error
        ? { ok: false, error }
        : unexpectedResponse();
    }

    return {
      ok: true,
      response: parseSyntheticResponse(rawJson),
    };
  } catch (error: unknown) {
    if (
      controller.signal.aborted ||
      error instanceof TypeError
    ) {
      return {
        ok: false,
        error: {
          kind: "client-error",
          code: "NETWORK_ERROR",
          message: controller.signal.aborted
            ? "The request timed out. You may try again."
            : "Could not complete the backend request. Check the connection and service configuration.",
          retryable: true,
        },
      };
    }

    return unexpectedResponse();
  } finally {
    window.clearTimeout(timeout);
  }
}