"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AccountCard from "@/components/AccountCard";
import TransferForm from "@/components/TransferForm";
import TransactionList from "@/components/TransactionList";
import ChaosModeButton from "@/components/ChaosModeButton";
import CreateAccountModal from "@/components/CreateAccountModal";

interface Account {
  id: string;
  name: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
}

interface LedgerEntry {
  id: string;
  transactionId: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

interface AccountDetails extends Account {
  ledgerEntries: LedgerEntry[];
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<AccountDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch("/api/accounts");
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchAccountDetails = useCallback(async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedAccount(data.account);
      }
    } catch (error) {
      console.error("Failed to fetch account details:", error);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchAccountDetails(selectedAccountId);
    } else {
      setSelectedAccount(null);
    }
  }, [selectedAccountId, fetchAccountDetails]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
    if (selectedAccountId) {
      fetchAccountDetails(selectedAccountId);
    }
  };

  // Calculate total balance
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0
  );

  // Get IDs for transfer form (for chaos mode)
  const otherAccount = accounts.find((a) => a.id !== selectedAccountId);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-blue w-150 h-150 -top-48 -right-48 animate-float" style={{ animationDelay: '0s' }} />
        <div className="orb orb-purple w-125 h-125 top-1/3 -left-48 animate-float" style={{ animationDelay: '2s' }} />
        <div className="orb orb-pink w-100 h-100 -bottom-32 right-1/4 animate-float" style={{ animationDelay: '4s' }} />
        <div className="orb orb-cyan w-75 h-75 bottom-1/3 left-1/3 animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative glass border-b border-white/5 top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse-glow">
                  <span className="text-white font-bold text-2xl">₹</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-lg shadow-emerald-500/50" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text tracking-tight">Kuber</h1>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                  High-Reliability Payment Ledger
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary px-5 py-2.5 text-white font-semibold rounded-xl flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Account
            </button>
            <Link
              href="/graph"
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Graph
            </Link>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-900/30 rounded-full" />
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-slate-400 animate-pulse">
              Loading your accounts...
            </p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative inline-block empty-state-glow">
              <div className="w-28 h-28 bg-linear-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-slate-700/50">
                <span className="text-6xl">💰</span>
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/30">
                +
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Welcome to Kuber
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              Create your first account to start experiencing secure,
              double-entry payment transactions
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary px-8 py-4 text-white font-bold rounded-2xl text-lg"
            >
              Create Your First Account
            </button>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="mb-8 animate-fade-in">
              <div className="glass-card rounded-2xl p-6 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center md:text-left">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">
                      Total Balance
                    </p>
                    <p className="text-3xl font-bold font-mono-numbers gradient-text">
                      ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">
                      Active Accounts
                    </p>
                    <p className="text-3xl font-bold text-white font-mono-numbers">
                      {accounts.length}
                    </p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">
                      System Status
                    </p>
                    <p className="text-lg font-semibold text-emerald-400 flex items-center justify-center md:justify-start gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                      Operational
                    </p>
                  </div>
                  <div className="flex items-center justify-center md:justify-end">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600/50 rounded-xl transition-all text-slate-300 font-medium"
                    >
                      <svg
                        className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Accounts */}
              <div className="lg:col-span-1 space-y-4 animate-slide-in">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg icon-container flex items-center justify-center">
                      <svg
                        className="w-4.5 h-4.5 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    Your Accounts
                  </h2>
                  <span className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg font-semibold border border-blue-500/20">
                    {accounts.length} total
                  </span>
                </div>
                <div className="space-y-3">
                  {accounts.map((account, index) => (
                    <div
                      key={account.id}
                      style={{ animationDelay: `${index * 100}ms` }}
                      className="animate-fade-in"
                    >
                      <AccountCard
                        account={account}
                        isSelected={selectedAccountId === account.id}
                        onSelect={setSelectedAccountId}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Middle Column - Transfer Form */}
              <div className="lg:col-span-1 space-y-6" style={{ animationDelay: "100ms" }}>
                <div className="glass-card rounded-2xl shadow-2xl p-6 card-hover animate-fade-in">
                  <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg icon-container-success flex items-center justify-center">
                      <svg
                        className="w-4.5 h-4.5 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                    <span className="text-white!" style={{ color: '#ffffff' }}>Transfer Money</span>
                  </h2>
                  <TransferForm
                    accounts={accounts.map((a) => ({
                      id: a.id,
                      name: a.name,
                      balance: Number(a.balance),
                    }))}
                    onTransferComplete={handleRefresh}
                  />

                  {/* Chaos Mode - show if at least 2 accounts, always visible, disables if not ready */}
                  <div className="mt-4">
                    <ChaosModeButton
                      fromAccountId={selectedAccountId || accounts[0]?.id || ""}
                      toAccountId={otherAccount?.id || accounts[1]?.id || ""}
                      onComplete={handleRefresh}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Transaction History */}
              <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="glass-card rounded-2xl shadow-2xl p-6 card-hover">
                  <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
                      <svg
                        className="w-4.5 h-4.5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                    </div>
                    {selectedAccount
                      ? `${selectedAccount.name}`
                      : "Transaction History"}
                  </h2>
                  {selectedAccount ? (
                    <TransactionList
                      entries={selectedAccount.ledgerEntries.map((e) => ({
                        ...e,
                        amount: Number(e.amount),
                      }))}
                    />
                  ) : (
                    <div className="text-center py-16 px-4">
                      <div className="relative inline-block empty-state-glow">
                        <div className="w-20 h-20 bg-linear-to-br from-slate-700/50 to-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-600/30 shadow-xl">
                          <svg
                            className="w-10 h-10 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                            />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-300 mb-2">
                        Select an account
                      </h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Click on an account from the left to view its transaction history
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative mt-16 py-8 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            Built with 💜 using Next.js, Prisma & PostgreSQL
          </p>
          <p className="text-xs text-slate-600 mt-1.5 font-mono tracking-wide">
            Double-Entry Accounting • Idempotent Transactions • ACID Compliant
          </p>
        </div>
      </footer>

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAccountCreated={fetchAccounts}
      />
    </div>
  );
}
