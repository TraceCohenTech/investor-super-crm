"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "nyvp-crm-auth";
const PASSWORD = process.env.NEXT_PUBLIC_CRM_PASSWORD ?? "Trace";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "true") setAuthed(true);
    setChecking(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  }

  if (checking) return null;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-full max-w-sm">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-xl font-bold text-white tracking-tight">NYVP Investor CRM</h1>
              <p className="text-sm text-[#a1a1aa] mt-1">Enter password to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(false); }}
                placeholder="Password"
                autoFocus
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] transition-colors"
              />
              {error && (
                <p className="text-xs text-red-400">Incorrect password. Try again.</p>
              )}
              <button
                type="submit"
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-lg py-3 transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <div className="flex items-center justify-center gap-3 text-xs text-[#71717a]">
              <a href="https://x.com/Trace_Cohen" target="_blank" rel="noopener noreferrer" className="hover:text-[#a1a1aa] transition-colors">
                Twitter
              </a>
              <span>|</span>
              <a href="mailto:t@nyvp.com" className="hover:text-[#a1a1aa] transition-colors">
                t@nyvp.com
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
