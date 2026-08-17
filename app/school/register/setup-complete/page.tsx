"use client";
import { useEffect, useState, useRef } from "react";

export default function SetupCompletePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [studentName, setStudentName] = useState("");
  const [studentPin, setStudentPin] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) { setStatus("error"); return; }

    fetch(`/api/school/setup-confirm?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStudentName(data.student_name || "");
          setStudentPin(data.student_pin || "");
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400 text-lg animate-pulse">Activating account…</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-2xl font-black mb-3">Something went wrong</h1>
          <p className="text-zinc-400 mb-6">Your card was saved but the account didn&apos;t activate. Please contact us.</p>
          <a href="/school/register" className="bg-yellow-400 text-black font-black px-8 py-3 rounded-full">Try Again</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">☕</div>
        <h1 className="text-3xl font-black mb-2">You&apos;re all set!</h1>
        <p className="text-zinc-400 mb-8">{studentName}&apos;s account is active. Card will be charged automatically every Friday.</p>
        <div className="bg-zinc-900 border-2 border-yellow-400 rounded-2xl p-6 mb-8">
          <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Student Account ID</p>
          <p className="text-5xl font-black text-yellow-400 tracking-[0.3em]">{studentPin}</p>
          <p className="text-zinc-500 text-sm mt-3">Write this down — {studentName} will type this at the counter</p>
        </div>
        <p className="text-zinc-500 text-sm">A welcome email with these details has been sent to you. You can view your balance and transaction history at <strong>/school/account</strong>.</p>
      </div>
    </main>
  );
}
