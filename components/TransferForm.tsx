"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface TransferFormProps {
  accounts: Array<{ id: string; name: string; balance: number }>;
  onTransferComplete: () => void;
}

export default function TransferForm({
  accounts,
  onTransferComplete,
}: TransferFormProps) {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Generate idempotency key on submit
    const idempotencyKey = uuidv4();

    try {
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          fromAccountId,
          toAccountId,
          amount: parseFloat(amount),
          description: description || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `Transfer successful! Transaction ID: ${data.transactionId?.slice(0, 8)}...`
        );
        setAmount("");
        setDescription("");
        onTransferComplete();
      } else {
        setError(data.message || "Transfer failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedFromAccount = accounts.find((a) => a.id === fromAccountId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2.5 tracking-wide">
          From Account
        </label>
        <div className="relative group">
          <select
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            className="w-full px-4 py-3.5 border border-slate-700/50 rounded-xl bg-slate-800/50 text-white focus:border-blue-500/50 appearance-none cursor-pointer transition-all hover:border-slate-600 pr-10"
            required
          >
            <option value="" className="bg-slate-800">Select sender account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id} className="bg-slate-800">
                {account.name} (₹{account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Arrow connector */}
      <div className="flex justify-center py-1">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2.5 tracking-wide">
          To Account
        </label>
        <div className="relative group">
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className="w-full px-4 py-3.5 border border-slate-700/50 rounded-xl bg-slate-800/50 text-white focus:border-blue-500/50 appearance-none cursor-pointer transition-all hover:border-slate-600 pr-10"
            required
          >
            <option value="" className="bg-slate-800">Select receiver account</option>
            {accounts
              .filter((a) => a.id !== fromAccountId)
              .map((account) => (
                <option key={account.id} value={account.id} className="bg-slate-800">
                  {account.name} (₹{account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                </option>
              ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2.5 tracking-wide">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400 font-semibold">
            ₹
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={selectedFromAccount?.balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 border border-slate-700/50 rounded-xl bg-slate-800/50 text-white focus:border-blue-500/50 transition-all text-xl font-bold font-mono-numbers hover:border-slate-600 placeholder:text-slate-600"
            placeholder="0.00"
            required
          />
        </div>
        {selectedFromAccount && (
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Available: <span className="font-mono-numbers text-slate-400">₹{selectedFromAccount.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2.5 tracking-wide">
          Description <span className="text-slate-600 font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3.5 border border-slate-700/50 rounded-xl bg-slate-800/50 text-white focus:border-blue-500/50 transition-all hover:border-slate-600 placeholder:text-slate-600"
          placeholder="Payment for..."
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3 backdrop-blur-sm">
          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-start gap-3 backdrop-blur-sm">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !fromAccountId || !toAccountId || !amount}
        className="w-full py-4 px-4 btn-primary disabled:bg-slate-700 disabled:border-slate-600 disabled:text-white disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Transfer Money
          </>
        )}
      </button>
    </form>
  );
}
