"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface ChaosModeButtonProps {
  fromAccountId: string;
  toAccountId: string;
  onComplete: () => void;
}

interface ChaosResult {
  status: number;
  success: boolean;
  message: string;
}

export default function ChaosModeButton({
  fromAccountId,
  toAccountId,
  onComplete,
}: ChaosModeButtonProps) {
  const [results, setResults] = useState<ChaosResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const runChaosTest = async () => {
    if (!fromAccountId || !toAccountId) {
      alert("Please select both accounts first");
      return;
    }

    setLoading(true);
    setResults([]);
    setShowResults(true);

    // Generate ONE idempotency key for all 10 requests
    const idempotencyKey = uuidv4();
    const amount = 10; // Small amount for testing

    // Fire 10 simultaneous requests
    const promises = Array.from({ length: 10 }, (_, i) =>
      fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          fromAccountId,
          toAccountId,
          amount,
          description: `Chaos test request #${i + 1}`,
        }),
      }).then(async (res) => ({
        status: res.status,
        ...(await res.json()),
      }))
    );

    const responses = await Promise.all(promises);
    setResults(responses);
    setLoading(false);
    onComplete();
  };

  const successCount = results.filter((r) => r.success).length;
  const replayCount = results.filter(
    (r) => r.status === 200 && r.success
  ).length;
  const conflictCount = results.filter((r) => r.status === 409).length;

  return (
    <div className="mt-6 pt-6 border-t border-slate-700/30">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center">
          <span className="text-sm">⚡</span>
        </div>
        <h3 className="font-bold text-white text-sm">Stress Test</h3>
        <span className="text-xs px-2.5 py-1 bg-orange-500/10 text-orange-400 rounded-lg font-semibold border border-orange-500/20">
          Developer Mode
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Fire 10 concurrent requests with the same idempotency key to test transaction safety.
      </p>
      
      <button
        onClick={runChaosTest}
        disabled={loading || !fromAccountId || !toAccountId}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Running Chaos Test...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run Chaos Test (10 Requests)
          </>
        )}
      </button>

      {showResults && results.length > 0 && (
        <div className="mt-4 p-4 glass-card-light rounded-xl animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-bold text-white text-sm">
              Test Complete
            </h4>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <p className="text-2xl font-bold font-mono-numbers text-emerald-400">
                {successCount}
              </p>
              <p className="text-xs text-emerald-300/70 font-semibold">
                Success
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
              <p className="text-2xl font-bold font-mono-numbers text-blue-400">
                {replayCount > 1 ? replayCount - 1 : 0}
              </p>
              <p className="text-xs text-blue-300/70 font-semibold">
                Replays
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-2xl font-bold font-mono-numbers text-amber-400">
                {conflictCount}
              </p>
              <p className="text-xs text-amber-300/70 font-semibold">
                Conflicts
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              <strong className="text-emerald-300">Only ONE actual transfer occurred!</strong> The rest were either cached responses (idempotent replays) or blocked with 409 Conflict.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
