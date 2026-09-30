import { useState } from "react";
import { convexApiBase } from "../convexUrl";

type SubmitState =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export default function JoinForm({ live }: { live: boolean }) {
  const [formState, setFormState] = useState<SubmitState>({ state: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();
    const babyAge = String(data.get("babyAge") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!live) {
      setFormState({
        state: "success",
        message: "Preview mode — connect Convex to send real confirmations. 💛",
      });
      return;
    }

    setFormState({ state: "sending" });
    try {
      // Call the action via Convex HTTP API (works from the static site).
      const res = await fetch(`${convexApiBase()}/api/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "messages:submit",
          args: {
            kind: "join",
            name,
            email,
            city: city || undefined,
            babyAge: babyAge || undefined,
            message: message || undefined,
          },
          format: "json",
        }),
      });
      const out = await res.json();
      if (out.success === false) throw new Error(out.errorMessage ?? "Something went wrong");

      setFormState({
        state: "success",
        message:
          "Welcome to RashMum UK! 💛 Check your inbox — a confirmation is on its way, and a volunteer mum will match you within 24 hours.",
      });
      form.reset();
    } catch (err) {
      setFormState({
        state: "error",
        message: err instanceof Error ? err.message : "Something went wrong — please try again.",
      });
    }
  }

  const inputClass =
    "w-full rounded-full border border-zinc-200 px-5 py-3 text-[13px] focus:border-brand-500 focus:outline-none";

  return (
    <div className="rounded-[24px] bg-white p-7 text-zinc-800">
      <h3 className="text-[17px] font-bold">Join RashMum UK — It's Free 💛</h3>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <input name="name" required placeholder="Your name" className={inputClass} />
        <input name="email" required type="email" placeholder="Email address" className={inputClass} />
        <div className="grid grid-cols-2 gap-3">
          <input name="city" placeholder="Your city (e.g. Leeds)" className={inputClass} />
          <select name="babyAge" className={inputClass} defaultValue="">
            <option value="">Baby age</option>
            <option>Pregnant</option>
            <option>0-3 months</option>
            <option>3-12 months</option>
            <option>1-2 years</option>
            <option>2+ years</option>
          </select>
        </div>
        <textarea
          name="message"
          rows={3}
          placeholder="Anything you'd like us to know? (optional)"
          className={`${inputClass} rounded-2xl`}
        />
        <button
          type="submit"
          disabled={formState.state === "sending"}
          className="w-full rounded-full bg-brand-500 py-3.5 text-[14px] font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {formState.state === "sending" ? "Sending…" : "Join Community — It's Free 💛"}
        </button>
        {formState.state === "success" && (
          <div className="rounded-2xl bg-green-50 px-4 py-3 text-center text-[12px] font-medium leading-relaxed text-green-700">
            {formState.message}
          </div>
        )}
        {formState.state === "error" && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-[12px] font-medium leading-relaxed text-red-600">
            {formState.message}
          </div>
        )}
        <div className="text-center text-[10px] leading-relaxed text-zinc-500">
          No spam, ever. GDPR-compliant. Kind community guidelines.
        </div>
      </form>
    </div>
  );
}
