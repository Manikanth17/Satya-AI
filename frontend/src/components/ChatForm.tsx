import { useId, useState } from "react";
import type { FormEvent } from "react";

const MAX_QUESTION_LENGTH = 2000;

interface ChatFormProps {
  isLoading: boolean;
  onSubmit: (question: string) => void;
}

export default function ChatForm({
  isLoading,
  onSubmit,
}: ChatFormProps) {
  const [question, setQuestion] = useState("");

  const inputId = useId();
  const helpId = useId();
  const countId = useId();

  const trimmedQuestion = question.trim();
  const canSubmit = trimmedQuestion.length > 0 && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit(trimmedQuestion);
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isLoading}
      className="rounded-xl border border-slate-800 bg-slate-900 p-6"
    >
      <label
        htmlFor={inputId}
        className="block text-lg font-semibold text-slate-100"
      >
        Ask a question
      </label>

      <p id={helpId} className="mt-2 text-sm leading-6 text-slate-300">
        Development mode returns a fixed synthetic example, not an answer
        to your question. Do not enter sensitive personal information.
      </p>

      <textarea
        id={inputId}
        name="question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        maxLength={MAX_QUESTION_LENGTH}
        disabled={isLoading}
        required
        rows={5}
        aria-describedby={⁠ ${helpId} ${countId} ⁠}
        placeholder="For example: Show the synthetic evidence example."
        className="mt-4 block w-full resize-y rounded-lg border
          border-slate-600 bg-slate-950 px-4 py-3 leading-6
          text-slate-100 placeholder:text-slate-500
          disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <p id={countId} className="text-sm text-slate-400">
          {question.length} / {MAX_QUESTION_LENGTH} characters
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-teal-300 px-5 py-3 font-semibold
            text-slate-950 hover:bg-teal-200
            disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Loading example…" : "Show synthetic example"}
        </button>
      </div>

      <p role="status" className="mt-3 min-h-6 text-sm text-slate-300">
        {isLoading ? "Waiting for the synthetic response." : ""}
      </p>
    </form>
  );
}