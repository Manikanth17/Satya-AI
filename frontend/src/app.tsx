import { useRef, useState } from "react";

import { requestChat } from "./api/chatClient";
import { parseSyntheticResponse } from "./api/parseSyntheticResponse";
import AnswerCard from "./components/AnswerCard";
import ChatForm from "./components/ChatForm";
import EvidenceDrawer from "./components/EvidenceDrawer";
import { createSyntheticChatResponse } from "./test/syntheticChatFixture";
import type { ChatState } from "./types/chat";

type ConnectionMode = "preview" | "backend";

export default function App() {
  const [mode, setMode] = useState<ConnectionMode>("preview");
  const [state, setState] = useState<ChatState>({ kind: "idle" });
  const [selectedParagraphId, setSelectedParagraphId] =
    useState<string | null>(null);

  const requestInProgress = useRef(false);
  const isLoading = state.kind === "loading";

  const response =
    state.kind === "success" ? state.response : null;

  const selectedEvidence =
    response?.evidence.find(
      (evidence) => evidence.paragraph_id === selectedParagraphId,
    ) ?? null;

  const selectedQuotes =
    response && selectedEvidence
      ? response.claims.flatMap((claim) =>
          claim.supporting_quotes
            .filter(
              (support) =>
                support.evidence_id === selectedEvidence.paragraph_id,
            )
            .map((support) => support.quote),
        )
      : [];

  function changeMode(nextMode: ConnectionMode) {
    if (requestInProgress.current || nextMode === mode) {
      return;
    }

    setSelectedParagraphId(null);
    setState({ kind: "idle" });
    setMode(nextMode);
  }

  async function handleSubmit(question: string): Promise<void> {
    if (requestInProgress.current) {
      return;
    }

    requestInProgress.current = true;
    setSelectedParagraphId(null);
    setState({ kind: "loading" });

    try {
      if (mode === "preview") {
        const fixture = parseSyntheticResponse(
          createSyntheticChatResponse(),
        );

        setState({
          kind: "success",
          response: fixture,
        });

        return;
      }

      const result = await requestChat(question);

      if (result.ok) {
        setState({
          kind: "success",
          response: result.response,
        });
      } else {
        setState({
          kind: "failure",
          error: result.error,
        });
      }
    } catch {
      setState({
        kind: "failure",
        error: {
          kind: "client-error",
          code: "UNEXPECTED_RESPONSE",
          message:
            "The response could not be prepared and was not displayed.",
          retryable: false,
        },
      });
    } finally {
      requestInProgress.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <p className="text-2xl font-bold tracking-widest text-teal-300">
            SATYA
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Ask clearly. Verify every claim.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section
          aria-labelledby="mode-heading"
          className="rounded-xl border border-amber-400/40
            bg-amber-400/10 p-5"
        >
          <h1
            id="mode-heading"
            className="text-lg font-semibold text-amber-200"
          >
            Synthetic integration workspace
          </h1>

          <p className="mt-2 text-sm leading-6 text-amber-100">
            Both modes show invented test data—not law or policy.
            Neither mode answers your question using official documents.
          </p>

          <fieldset disabled={isLoading} className="mt-5">
            <legend className="text-sm font-medium text-slate-100">
              Choose the response source
            </legend>

            <div className="mt-3 flex flex-wrap gap-5">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="connection-mode"
                  value="preview"
                  checked={mode === "preview"}
                  onChange={() => changeMode("preview")}
                  className="accent-teal-300"
                />
                <span className="text-sm">Local synthetic preview</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="connection-mode"
                  value="backend"
                  checked={mode === "backend"}
                  onChange={() => changeMode("backend")}
                  className="accent-teal-300"
                />
                <span className="text-sm">Spring Boot integration</span>
              </label>
            </div>
          </fieldset>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            {mode === "preview"
              ? "Preview uses a local fixture. No HTTP request is made."
              : "Integration sends the question to Spring Boot. Failed requests remain errors; no preview fallback is used."}
          </p>
        </section>

        <ChatForm
          isLoading={isLoading}
          onSubmit={(question) => {
            void handleSubmit(question);
          }}
        />

        {state.kind === "failure" && (
          <section
            role="alert"
            className="rounded-xl border border-red-400/40
              bg-red-400/10 p-5"
          >
            <h2 className="font-semibold text-red-200">
              Technical or request error
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-100">
              {state.error.message}
            </p>
            <p className="mt-3 text-xs text-red-200">
              Error code: {state.error.code}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              This is not an evidence-based refusal.
              {state.error.retryable
                ? " You may submit the question again."
                : " Resolve the reported issue before retrying."}
            </p>
          </section>
        )}

        {response && (
          <AnswerCard
            response={response}
            onSelectEvidence={setSelectedParagraphId}
          />
        )}

        {state.kind === "idle" && (
          <p className="text-sm text-slate-400">
            Submit a nonblank question to inspect the fixed synthetic example.
          </p>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-8 text-sm text-slate-400">
        <p>Informational assistance, not legal advice.</p>
        <p className="mt-2">
          Evidence checks do not guarantee legal correctness.
        </p>
      </footer>

      <EvidenceDrawer
        evidence={selectedEvidence}
        supportingQuotes={selectedQuotes}
        onClose={() => setSelectedParagraphId(null)}
      />
    </div>
  );
}