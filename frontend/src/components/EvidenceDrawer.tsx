import { useEffect, useId, useRef } from "react";

import type { SyntheticEvidence } from "../types/chat";

interface EvidenceDrawerProps {
  evidence: SyntheticEvidence | null;
  supportingQuotes: string[];
  onClose: () => void;
}

export default function EvidenceDrawer({
  evidence,
  supportingQuotes,
  onClose,
}: EvidenceDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const noticeId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (evidence !== null && !dialog.open) {
      dialog.showModal();
    } else if (evidence === null && dialog.open) {
      dialog.close();
    }
  }, [evidence]);

  const uniqueQuotes = [...new Set(supportingQuotes)];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      aria-describedby={noticeId}
      onClose={onClose}
      className="fixed inset-y-0 left-auto right-0 m-0
        h-dvh max-h-dvh w-full max-w-xl overflow-y-auto
        border-0 border-l border-slate-700 bg-slate-900
        p-0 text-slate-100 shadow-2xl
        backdrop:bg-black/70"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={headingId} className="text-xl font-semibold">
            Inspect evidence
          </h2>

          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg border border-slate-600
              px-4 py-2 text-sm font-medium
              hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <p
          id={noticeId}
          className="mt-5 rounded-lg border border-amber-400/40
            bg-amber-400/10 p-4 text-sm leading-6 text-amber-100"
        >
          SYNTHETIC TEST DATA — not law or policy. The document,
          page, and paragraph below are invented fixture metadata.
          No real PDF or official source is represented.
        </p>

        {evidence && (
          <>
            <section className="mt-6" aria-label="Document metadata">
              <h3 className="font-semibold text-teal-200">
                Document metadata
              </h3>

              <dl className="mt-4 space-y-4 text-sm">
                <Metadata
                  label="Document title"
                  value={evidence.document_title}
                />
                <Metadata
                  label="Synthetic PDF page"
                  value={String(evidence.pdf_page_number)}
                />
                <Metadata
                  label="Printed page label"
                  value={evidence.printed_page_label ?? "Not available"}
                />
                <Metadata
                  label="Original paragraph label"
                  value={
                    evidence.original_paragraph_label ?? "Not available"
                  }
                />
                <Metadata
                  label="Application-derived locator"
                  value={evidence.derived_locator}
                />
                <Metadata
                  label="Paragraph ID"
                  value={evidence.paragraph_id}
                />
                <Metadata
                  label="Document ID"
                  value={evidence.document_id}
                />
                <Metadata
                  label="Corpus revision"
                  value={evidence.corpus_revision}
                />
                <Metadata
                  label="Official source"
                  value="None — synthetic fixture."
                />
              </dl>

              <p className="mt-4 text-xs leading-5 text-slate-400">
                The application-derived locator is not official
                paragraph numbering.
              </p>
            </section>

            <section
              className="mt-8"
              aria-label="Exact evidence text"
            >
              <h3 className="font-semibold text-teal-200">
                Exact fixture paragraph
              </h3>

              <blockquote
                className="mt-3 whitespace-pre-wrap break-words
                  rounded-lg border border-slate-700
                  bg-slate-950 p-4 leading-7"
              >
                {evidence.exact_text}
              </blockquote>
            </section>

            <section
              className="mt-8"
              aria-label="Supporting quotations"
            >
              <h3 className="font-semibold text-teal-200">
                Supporting quotations used by the claims
              </h3>

              {uniqueQuotes.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  No supporting quotations were supplied.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {uniqueQuotes.map((quote, index) => (
                    <li
                      key={index}
                      className="rounded-lg border border-slate-700 p-4"
                    >
                      <blockquote className="whitespace-pre-wrap break-words leading-7">
                        {quote}
                      </blockquote>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="mt-8 border-t border-slate-700 pt-4 text-sm text-slate-400">
              Informational assistance, not legal advice.
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}

interface MetadataProps {
  label: string;
  value: string;
}

function Metadata({ label, value }: MetadataProps) {
  return (
    <div>
      <dt className="font-medium text-slate-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-slate-100">
        {value}
      </dd>
    </div>
  );
}