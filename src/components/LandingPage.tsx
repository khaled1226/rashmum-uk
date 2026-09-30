import { useEffect, useState } from "react";
import JoinForm from "./JoinForm";
import { convexApiBase } from "../convexUrl";

type StatusData = { ok: boolean; detail: string; updatedAt: number } | undefined;

function StatusPill({ live, status }: { live: boolean; status: StatusData }) {
  const online = status ? status.ok : true;
  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full border bg-white/70 px-4 py-1.5 text-[12px] font-semibold shadow-sm backdrop-blur"
      style={{
        borderColor: online ? "#bbf7d0" : "#fecaca",
        color: online ? "#15803d" : "#b91c1c",
      }}
      title={status?.detail ?? ""}
    >
      <span className="relative flex h-2.5 w-2.5">
        {online && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${online ? "animate-ping-slow" : ""}`}
            style={{ backgroundColor: online ? "#22c55e" : "#ef4444" }}
          />
        )}
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: online ? "#22c55e" : "#ef4444" }}
        />
      </span>
      {status ? (online ? "All systems live 24/7" : "Issues detected — team alerted") : live ? "Connecting to status…" : "Preview mode — status offline"}
    </div>
  );
}

export default function LandingPage({ live }: { live: boolean }) {
  const [status, setStatus] = useState<StatusData>(undefined);

  // Live status polling — no subscription spam, refresh every 60s.
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const res = await fetch(`${convexApiBase()}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "status:getPublic",
            args: {},
            format: "json",
          }),
        });
        const data = await res.json();
        if (!cancelled) setStatus(data.value ?? data);
      } catch {
        if (!cancelled) setStatus({ ok: false, detail: "Status check failed", updatedAt: Date.now() });
      }
      if (!cancelled) timer = setTimeout(poll, 60_000);
    }
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [live]);

  return (
    <div className="min-h-screen bg-white text-zinc-800">
      {/* Announcement bar */}
      <div className="w-full bg-brand-500 px-4 py-2 text-center text-[13px] font-medium text-white">
        💛 Free, confidential, and run by mums, for mums. New groups opening in London, Manchester, Birmingham this week.
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1160px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192x192.png" alt="RashMum UK" className="h-10 w-10 rounded-2xl object-cover" />
            <div>
              <div className="font-serif text-[18px] font-bold leading-none">RashMum UK</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Support for Mums</div>
            </div>
          </div>
          <nav className="hidden gap-6 text-[14px] font-medium md:flex">
            <a href="#home" className="hover:text-brand-500">Home</a>
            <a href="#support" className="hover:text-brand-500">Support</a>
            <a href="#community" className="hover:text-brand-500">Community</a>
            <a href="#resources" className="hover:text-brand-500">Resources</a>
          </nav>
          <a
            href="#join"
            className="rounded-full bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-brand-600"
          >
            Join Community
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="mx-auto max-w-[1160px] px-6 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-bold tracking-wide text-brand-500">
              ✨ 10,000+ MUMS SUPPORTED ACROSS THE UK
            </div>
            <div className="mt-6">
              <StatusPill live={live} status={status} />
            </div>
            <h1 className="mt-6 font-serif text-[44px] font-bold leading-[0.95] lg:text-[56px]">
              You're Not<br />Alone, Mum.
            </h1>
            <p className="mt-5 max-w-[48ch] text-[18px] leading-[1.6] text-zinc-600">
              RashMum UK is a volunteer-led community for mums who need a village. No judgement, just genuine support
              from mums who get it — now with a 24/7 AI friend who answers in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#join" className="rounded-full bg-brand-500 px-7 py-3.5 text-[15px] font-semibold text-white hover:bg-brand-600">
                Find Your Village →
              </a>
              <a href="#support" className="rounded-full border border-zinc-200 bg-white px-7 py-3.5 text-[15px] font-semibold hover:border-zinc-300">
                Get Support Now
              </a>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="h-9 w-9 rounded-full border-2 border-white bg-pink-200" />
                <div className="h-9 w-9 rounded-full border-2 border-white bg-orange-200" />
                <div className="h-9 w-9 rounded-full border-2 border-white bg-blue-200" />
                <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-zinc-100 text-[10px] font-bold">+10k</div>
              </div>
              <div className="text-[13px]">
                <div className="font-semibold">Trusted by 10k+ mums</div>
                <div className="text-zinc-500">4.9/5 from 2,847 reviews</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[32px] border border-[#ffe4ef] bg-[#fdf2f8] p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="text-2xl">💞</div>
                  <div className="mt-2 text-[14px] font-bold">Community</div>
                  <div className="mt-1 text-[11px] text-zinc-500">24/7 chat & support</div>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="text-2xl">☕</div>
                  <div className="mt-2 text-[14px] font-bold">Local Meetups</div>
                  <div className="mt-1 text-[11px] text-zinc-500">Coffee mornings</div>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="text-2xl">🌿</div>
                  <div className="mt-2 text-[14px] font-bold">Wellbeing</div>
                  <div className="mt-1 text-[11px] text-zinc-500">Safe space to talk</div>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="text-2xl">🤖</div>
                  <div className="mt-2 text-[14px] font-bold">AI Friend 24/7</div>
                  <div className="mt-1 text-[11px] text-zinc-500">Answers in seconds</div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-brand-500 p-5 text-white">
                <div>
                  <div className="text-[14px] font-bold">New: Leeds & Bristol groups</div>
                  <div className="mt-0.5 text-[11px] opacity-90">Join 340 mums this week</div>
                </div>
                <a href="#join" className="rounded-full bg-white px-4 py-2 text-[11px] font-bold text-brand-500">Join →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <div className="border-y border-zinc-100 bg-peach">
        <div className="mx-auto grid max-w-[1160px] grid-cols-2 gap-6 px-6 py-6 text-center lg:grid-cols-4">
          <div>
            <div className="font-serif text-[28px] font-bold">10k+</div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Mums Supported</div>
          </div>
          <div>
            <div className="font-serif text-[28px] font-bold">50+</div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">UK Cities</div>
          </div>
          <div>
            <div className="font-serif text-[28px] font-bold">24/7</div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Support Available</div>
          </div>
          <div>
            <div className="font-serif text-[28px] font-bold">100%</div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Free & Confidential</div>
          </div>
        </div>
      </div>

      {/* Support features */}
      <section id="support" className="mx-auto max-w-[1160px] px-6 py-20">
        <div className="mx-auto max-w-[60ch] text-center">
          <h2 className="font-serif text-[36px] font-bold leading-tight">Support that actually gets it</h2>
          <p className="mt-3 text-[15px] text-zinc-600">
            Made by mums who've been in the trenches. No perfect-parent pressure, just practical help and kind company —
            with an AI friend who's awake at 3am too.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-[20px] bg-brand-50 p-6">
            <div className="text-3xl">🤖</div>
            <h3 className="mt-3 font-bold">24/7 AI Support Chat</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              Our AI friend answers in seconds, any hour. Built with crisis safety — and real mums a call away when you
              need a human.
            </p>
          </div>
          <div className="rounded-[20px] bg-brand-50 p-6">
            <div className="text-3xl">💞</div>
            <h3 className="mt-3 font-bold">Community Support</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              Connect with mums who just get it. No judgement, just genuine understanding.
            </p>
          </div>
          <div className="rounded-[20px] bg-[#fff5e6] p-6">
            <div className="text-3xl">🌿</div>
            <h3 className="mt-3 font-bold">Mental Health</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              Safe spaces to talk about the hard bits. Peer support and wellbeing tools.
            </p>
          </div>
          <div className="rounded-[20px] bg-[#f0f7ff] p-6">
            <div className="text-3xl">☕</div>
            <h3 className="mt-3 font-bold">Local Meetups</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              From park walks in Leeds to coffee mornings in Bristol — find your village.
            </p>
          </div>
          <div className="rounded-[20px] bg-[#f3f0ff] p-6">
            <div className="text-3xl">👩‍⚕️</div>
            <h3 className="mt-3 font-bold">Expert Advice</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              Midwives, health visitors and counsellors volunteer time to help.
            </p>
          </div>
          <div className="rounded-[20px] bg-[#eefbf3] p-6">
            <div className="text-3xl">📞</div>
            <h3 className="mt-3 font-bold">24/7 Helpline</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              Sometimes 2am feels lonely. Our volunteer mums are here day and night: 0800 123 4567.
            </p>
          </div>
        </div>
      </section>

      {/* Community segments */}
      <section id="community" className="border-y border-zinc-100 bg-cream">
        <div className="mx-auto max-w-[1160px] px-6 py-20">
          <h2 className="font-serif text-[32px] font-bold">For every kind of mum</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-100 bg-white p-6">
              <div className="text-2xl">🤱</div>
              <div className="mt-2 font-bold">New Mums</div>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
                Daily check-ins, newborn groups, and a listening ear for the 3am feeds.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-6">
              <div className="text-2xl">💪</div>
              <div className="mt-2 font-bold">Single Mums</div>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
                You don't have to do it alone. Financial advice and community.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-6">
              <div className="text-2xl">💼</div>
              <div className="mt-2 font-bold">Working Mums</div>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
                Support for mat leave, return-to-work anxiety, and finding balance.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-6">
              <div className="text-2xl">🧸</div>
              <div className="mt-2 font-bold">Toddler Mums</div>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
                Tantrums, toilet training and big feelings — yours and theirs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="resources" className="mx-auto max-w-[1160px] px-6 py-20">
        <h2 className="text-center font-serif text-[32px] font-bold">Mums like you, finding their village</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-[20px] border border-zinc-100 p-6">
            <div className="text-[14px] text-brand-500">★★★★★</div>
            <p className="mt-3 text-[13px] leading-relaxed">
              "I joined when my baby was 3 weeks old. Within hours I was in a WhatsApp group with 12 mums from
              Manchester. We still meet every Tuesday."
            </p>
            <div className="mt-4 text-[12px] font-semibold">— Sarah, Manchester</div>
          </div>
          <div className="rounded-[20px] border border-zinc-100 p-6">
            <div className="text-[14px] text-brand-500">★★★★★</div>
            <p className="mt-3 text-[13px] leading-relaxed">
              "The AI chat got me through a 4am panic — it shared the helpline number and stayed kind. Then a real mum
              from Leeds rang me the next day."
            </p>
            <div className="mt-4 text-[12px] font-semibold">— Priya, Leeds</div>
          </div>
          <div className="rounded-[20px] border border-zinc-100 p-6">
            <div className="text-[14px] text-brand-500">★★★★★</div>
            <p className="mt-3 text-[13px] leading-relaxed">
              "As a single mum, I felt so isolated. RashMum connected me to benefits advice and a childcare swap. I
              found friends who get it."
            </p>
            <div className="mt-4 text-[12px] font-semibold">— Aisha, London</div>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section id="join" className="bg-brand-500 text-white">
        <div className="mx-auto grid max-w-[1160px] items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-[36px] font-bold leading-tight">Ready to find your village?</h2>
            <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed opacity-90">
              Join 10,000+ mums across the UK. Free, confidential, no spam ever. We'll match you to mums near you within
              24 hours.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-[22px] font-bold">50+</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80">Cities</div>
              </div>
              <div>
                <div className="text-[22px] font-bold">340</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80">This week</div>
              </div>
              <div>
                <div className="text-[22px] font-bold">24h</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80">To match</div>
              </div>
            </div>
          </div>
          <JoinForm live={live} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cream py-12">
        <div className="mx-auto max-w-[1160px] px-6 text-center text-[11px] leading-relaxed text-zinc-500">
          <div className="font-serif text-[15px] font-bold text-zinc-800">RashMum UK</div>
          <div className="mt-2">
            A volunteer-led community interest company. We exist because motherhood shouldn't feel lonely.
          </div>
          <div className="mt-6">
            © 2026 RashMum UK CIC • Charity #1192847 • Made with love for UK mums 💛
            <br />
            hello@rashmum.uk • 24/7 Helpline: 0800 123 4567 • If you or baby are unsafe, call 999 or Samaritans 116 123.
          </div>
        </div>
      </footer>
    </div>
  );
}
