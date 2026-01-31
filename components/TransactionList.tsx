"use client";

interface LedgerEntry {
  id: string;
  transactionId: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

interface TransactionListProps {
  entries: LedgerEntry[];
}

export default function TransactionList({ entries }: TransactionListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        {/* Decorative empty state with glow effect */}
        <div className="relative inline-block empty-state-glow">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-600/30 shadow-xl">
            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No transactions yet</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          Make your first transfer to see the transaction history appear here
        </p>
        
        {/* Blurred preview hint */}
        <div className="mt-8 space-y-3 opacity-30 blur-[2px] pointer-events-none">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50" />
              <div className="flex-1">
                <div className="h-3 w-24 bg-slate-700/50 rounded mb-2" />
                <div className="h-2 w-16 bg-slate-700/30 rounded" />
              </div>
              <div className="h-4 w-16 bg-slate-700/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
      {entries.map((entry, index) => {
        const amount = Number(entry.amount);
        const isCredit = amount > 0;

        return (
          <div
            key={entry.id}
            className="group flex items-center justify-between p-4 glass-card-light rounded-xl hover:bg-slate-700/40 transition-all duration-300 animate-fade-in cursor-default"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              {/* Transaction type icon */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isCredit
                    ? "icon-container-success text-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-500/20"
                    : "icon-container-danger text-red-400 group-hover:shadow-lg group-hover:shadow-red-500/20"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isCredit ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  )}
                </svg>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">
                  {entry.description || (isCredit ? "Money Received" : "Money Sent")}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(entry.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              {/* Amount with monospace font */}
              <span
                className={`text-lg font-bold font-mono-numbers ${
                  isCredit
                    ? "neon-green"
                    : "neon-red"
                }`}
              >
                {isCredit ? "+" : "-"}₹{Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                #{entry.transactionId.slice(0, 8)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
