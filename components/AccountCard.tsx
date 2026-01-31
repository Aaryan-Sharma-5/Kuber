"use client";

interface Account {
  id: string;
  name: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
}

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// Get contextual icon based on account name
function getAccountIcon(name: string) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('saving')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    );
  }
  
  if (lowerName.includes('wallet')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
      </svg>
    );
  }
  
  if (lowerName.includes('credit') || lowerName.includes('card')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    );
  }
  
  if (lowerName.includes('business') || lowerName.includes('company')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    );
  }
  
  // Default account icon
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Get gradient colors based on account name for variety
function getAccountGradient(name: string, isSelected: boolean) {
  if (isSelected) {
    return "from-blue-500 via-blue-600 to-indigo-600";
  }
  
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('saving')) {
    return "from-emerald-500/20 to-teal-500/20";
  }
  if (lowerName.includes('wallet')) {
    return "from-violet-500/20 to-purple-500/20";
  }
  if (lowerName.includes('credit') || lowerName.includes('card')) {
    return "from-orange-500/20 to-amber-500/20";
  }
  
  return "from-slate-500/20 to-gray-500/20";
}

export default function AccountCard({
  account,
  isSelected,
  onSelect,
}: AccountCardProps) {
  const balance = Number(account.balance);
  const gradient = getAccountGradient(account.name, isSelected);
  
  return (
    <div
      onClick={() => onSelect(account.id)}
      className={`relative overflow-hidden p-5 rounded-2xl cursor-pointer transition-all duration-300 card-hover ${
        isSelected
          ? "card-selected bg-gradient-to-br from-slate-800/80 to-slate-900/80"
          : "glass-card hover:border-slate-600/50"
      }`}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-30 pointer-events-none`} />
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
      
      <div className="relative flex items-start gap-4">
        {/* Icon container with gradient */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
          isSelected 
            ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/30" 
            : "icon-container text-blue-400"
        }`}>
          {getAccountIcon(account.name)}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Account name - Hero element */}
          <h3 className="text-lg font-bold text-white truncate mb-0.5">
            {account.name}
          </h3>
          <p className="text-xs text-slate-400 font-mono tracking-wide">
            {account.userId}
          </p>
        </div>
      </div>
      
      <div className="relative mt-5 pt-4 border-t border-white/5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 font-medium">
              Balance
            </p>
            {/* Balance with monospace font and proper currency placement */}
            <p className={`text-2xl font-bold font-mono-numbers tracking-tight ${
              balance >= 0 
                ? "text-white" 
                : "neon-red"
            }`}>
              <span className="text-slate-400 text-lg mr-0.5">₹</span>
              {Math.abs(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          {/* Currency badge - nested corner radius */}
          <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold tracking-wide ${
            isSelected 
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
          }`}>
            {account.currency}
          </span>
        </div>
      </div>
    </div>
  );
}
