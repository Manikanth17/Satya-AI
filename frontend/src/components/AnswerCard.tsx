import { useId } from "react";

import type { SyntheticChatResponse } from "../types/chat";

interface AnswerCardProps {
  response: SyntheticChatResponse;
  onSelectEvidence: (paragraphId: string) => void;
}

export default function AnswerCard({
  response,
  onSelectEvidence,
}: AnswerCardProps) {
  const headingId = useId();

  const evidenceById = new Map(
    response.evidence.map((evidence) => [
      evidence.paragraph_id,
      evidence,
    ]),
  );

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-slate-800 bg-slate-900 p-6"
    >
      <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4">
        <p className="font-semibold text-amber-200">
          {response.notice}
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-100">
          This fixed example does not answer your question. Its document,
          page, and paragraph metadata are invented test fixtures.
        </p>
      </div>

      <h2
        id={headingId}
        className="mt-6 text-xl font-semibold text-slate-100"
      >
        Synthetic example result
      </h2>

      <p className="mt-2 text-sm text-teal-200">
        Evidence label: {response.evidence_label}
      </p>
      <p className="mt-1 text-sm text-slate-400">
        In this mode, “sources” means synthetic fixtures—not official
        documents.
      </p>

      <ol className="mt-6 space-y-5">
        {response.claims.map((claim, claimIndex) => (
          <li
            key={claim.claim_id}
            className="rounded-lg border border-slate-700 p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Claim {claimIndex + 1}
            </p>

            <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-100">
              {claim.text}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {claim.supporting_quotes.map((support, citationIndex) => {
                const evidence = evidenceById.get(support.evidence_id);

                if (!evidence) {
                  return (
                    <span
                      key={⁠ ${claim.claim_id}-${citationIndex} ⁠}
                      className="rounded-md border border-red-400/40
                        bg-red-400/10 px-3 py-2 text-sm text-red-200"
                    >
                      Evidence unavailable
                    </span>
                  );
                }

                return (
                  <button
                    key={⁠ ${claim.claim_id}-${citationIndex} ⁠}
                    type="button"
                    onClick={() =>
                      onSelectEvidence(evidence.paragraph_id)
                    }
                    aria-label={
                      `Inspect evidence ${citationIndex + 1} for claim ` +
                      `${claimIndex + 1}: ${evidence.document_title}, ` +
                      ⁠ ${evidence.derived_locator} ⁠
                    }
                    className="rounded-md border border-teal-300/40
                      bg-teal-300/10 px-3 py-2 text-sm font-medium
                      text-teal-200 hover:bg-teal-300/20"
                  >
                    Evidence {citationIndex + 1} · Synthetic PDF page{" "}
                    {evidence.pdf_page_number}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 border-t border-slate-700 pt-4">
        <p className="text-sm text-slate-300">
          {response.disclaimer}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Corpus revision: {response.corpus_revision}
        </p>
      </div>
    </section>
  );
}