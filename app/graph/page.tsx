"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, RefreshCw, Network } from "lucide-react";

// Dynamic import to avoid SSR issues with React Flow
const TransactionGraph = dynamic(() => import("@/components/TransactionGraph"), {
  ssr: false,
  loading: () => (
    <div className="glass-card h-150 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-400">Loading graph visualization...</p>
      </div>
    </div>
  ),
});

interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  currency: string;
  ledgerEntries?: LedgerEntry[];
}

interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  amount: number;
  description?: string;
  createdAt: string;
}

export default function GraphPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountsWithTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // First get all accounts
      const accountsRes = await fetch("/api/accounts");
      const accountsData = await accountsRes.json();

      // Then fetch details for each account to get ledger entries
      const accountsWithEntries = await Promise.all(
        accountsData.accounts.map(async (acc: Account) => {
          const detailsRes = await fetch(`/api/accounts/${acc.id}`);
          const detailsData = await detailsRes.json();
          return detailsData.account;
        })
      );

      setAccounts(accountsWithEntries);
    } catch (err) {
      setError("Failed to load transaction data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsWithTransactions();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb orb-blue" style={{ top: "10%", left: "5%" }} />
      <div className="orb orb-purple" style={{ top: "60%", right: "10%" }} />
      <div className="orb orb-cyan" style={{ bottom: "20%", left: "30%" }} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                  <Network className="w-8 h-8 text-emerald-400" />
                  <span className="bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text">
                    Transaction Graph
                  </span>
                </h1>
                <p className="text-slate-400 mt-1">
                  Visualize money flow between accounts
                </p>
              </div>
            </div>

            <button
              onClick={fetchAccountsWithTransactions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Graph */}
        {error ? (
          <div className="glass-card p-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchAccountsWithTransactions}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="glass-card h-150 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400">Loading transaction data...</p>
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Network className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No accounts yet</h3>
            <p className="text-slate-400 mb-4">Create some accounts and make transfers to see the graph</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <TransactionGraph accounts={accounts} />
        )}

        {/* Instructions */}
        <div className="mt-6 glass-card-light p-4">
          <h3 className="font-semibold text-slate-300 mb-2">How to use</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• <strong>Click an account node</strong> to filter and highlight its transactions</li>
            <li>• <strong>Click an edge (arrow)</strong> to see transaction details</li>
            <li>• <strong>Drag nodes</strong> to rearrange the graph layout</li>
            <li>• <strong>Scroll to zoom</strong>, drag background to pan</li>
            <li>• <strong>Green arrows</strong> = incoming money, <strong>Red arrows</strong> = outgoing money</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
