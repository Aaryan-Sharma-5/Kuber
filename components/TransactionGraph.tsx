"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Wallet, ArrowRightLeft, Users, TrendingUp, TrendingDown } from "lucide-react";

// Types
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

interface TransactionEdge {
  id: string;
  from: string;
  to: string;
  amount: number;
  transactionId: string;
  timestamp: string;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

interface TransactionGraphProps {
  accounts: Account[];
}

// Custom Account Node Component
function AccountNode({ data, selected }: NodeProps) {
  const nodeData = data as { 
    label: string; 
    balance: number; 
    currency: string; 
    inflow: number; 
    outflow: number;
    userId: string;
  };
  
  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 min-w-45
        transition-all duration-300
        ${selected 
          ? "border-emerald-400 bg-emerald-950/80 shadow-lg shadow-emerald-500/20" 
          : "border-slate-600 bg-slate-800/90 hover:border-slate-500"
        }
      `}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="bg-emerald-500! border-emerald-400! w-3! h-3!" 
      />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-linear-to-br from-emerald-500/20 to-teal-500/20 rounded-lg">
          <Wallet className="w-4 h-4 text-emerald-400" />
        </div>
        <span className="font-semibold text-white text-sm truncate max-w-30">
          {nodeData.label}
        </span>
      </div>
      
      <div className="font-mono text-lg font-bold text-emerald-400 mb-1">
        {nodeData.currency} {nodeData.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </div>
      
      <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-700">
        <div className="flex items-center gap-1 text-green-400">
          <TrendingUp className="w-3 h-3" />
          <span>+{nodeData.inflow.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center gap-1 text-red-400">
          <TrendingDown className="w-3 h-3" />
          <span>-{nodeData.outflow.toLocaleString("en-IN")}</span>
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="bg-rose-500! border-rose-400! w-3! h-3!" 
      />
    </div>
  );
}

const nodeTypes = {
  account: AccountNode,
};

export default function TransactionGraph({ accounts }: TransactionGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionEdge | null>(null);

  // Build transaction edges from ledger entries
  const transactions = useMemo(() => {
    const txMap = new Map<string, { from?: string; to?: string; amount: number; timestamp: string }>();

    accounts.forEach((account) => {
      account.ledgerEntries?.forEach((entry) => {
        const existing = txMap.get(entry.transactionId) || { amount: 0, timestamp: entry.createdAt };
        
        if (entry.amount < 0) {
          // Debit = sender
          existing.from = account.id;
          existing.amount = Math.abs(entry.amount);
        } else {
          // Credit = receiver
          existing.to = account.id;
        }
        
        txMap.set(entry.transactionId, existing);
      });
    });

    const edges: TransactionEdge[] = [];
    txMap.forEach((tx, txId) => {
      if (tx.from && tx.to) {
        edges.push({
          id: txId,
          from: tx.from,
          to: tx.to,
          amount: tx.amount,
          transactionId: txId,
          timestamp: tx.timestamp,
        });
      }
    });

    return edges;
  }, [accounts]);

  // Calculate inflow/outflow for each account
  const accountStats = useMemo(() => {
    const stats = new Map<string, { inflow: number; outflow: number }>();
    
    accounts.forEach((acc) => stats.set(acc.id, { inflow: 0, outflow: 0 }));
    
    transactions.forEach((tx) => {
      const fromStats = stats.get(tx.from);
      const toStats = stats.get(tx.to);
      
      if (fromStats) fromStats.outflow += tx.amount;
      if (toStats) toStats.inflow += tx.amount;
    });
    
    return stats;
  }, [accounts, transactions]);

  // Create nodes in a circular layout
  const initialNodes: Node[] = useMemo(() => {
    const radius = Math.max(200, accounts.length * 50);
    const centerX = 400;
    const centerY = 300;

    return accounts.map((account, index) => {
      const angle = (index / accounts.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const stats = accountStats.get(account.id) || { inflow: 0, outflow: 0 };

      return {
        id: account.id,
        type: "account",
        position: { x, y },
        data: {
          label: account.name,
          balance: account.balance,
          currency: account.currency,
          inflow: stats.inflow,
          outflow: stats.outflow,
          userId: account.userId,
        },
        selected: selectedNode === account.id,
      };
    });
  }, [accounts, accountStats, selectedNode]);

  // Create edges for transactions
  const initialEdges = useMemo(() => {
    // Filter edges based on selected node
    let filteredTransactions = transactions;
    if (selectedNode) {
      filteredTransactions = transactions.filter(
        (tx) => tx.from === selectedNode || tx.to === selectedNode
      );
    }

    return filteredTransactions.map((tx) => ({
      id: tx.id,
      source: tx.from,
      target: tx.to,
      type: "default",
      animated: selectedNode ? tx.from === selectedNode || tx.to === selectedNode : false,
      label: `₹${tx.amount.toLocaleString("en-IN")}`,
      labelStyle: {
        fill: "#10b981",
        fontWeight: 600,
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
      },
      labelBgStyle: {
        fill: "#1e293b",
        fillOpacity: 0.9,
      },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      style: {
        stroke: selectedNode
          ? tx.from === selectedNode
            ? "#f43f5e"
            : "#10b981"
          : "#64748b",
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selectedNode
          ? tx.from === selectedNode
            ? "#f43f5e"
            : "#10b981"
          : "#64748b",
      },
      data: tx,
    }));
  }, [transactions, selectedNode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode((prev) => (prev === node.id ? null : node.id));
    setSelectedTransaction(null);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const tx = edge.data as TransactionEdge;
    setSelectedTransaction(tx);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedTransaction(null);
  }, []);

  // Stats
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return (
    <div className="glass-card p-0 overflow-hidden" style={{ height: "600px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-900"
      >
        <Background color="#334155" gap={20} />
        <Controls className="bg-slate-800! border-slate-700! rounded-lg! [&>button]:bg-slate-800! [&>button]:border-slate-700! [&>button]:text-slate-300! [&>button:hover]:bg-slate-700!" />
        <MiniMap
          nodeColor={(node) => (node.selected ? "#10b981" : "#475569")}
          maskColor="rgba(15, 23, 42, 0.8)"
          className="bg-slate-800! border-slate-700! rounded-lg!"
        />

        {/* Stats Panel */}
        <Panel position="top-left" className="m-4!">
          <div className="glass-card-light p-4 min-w-50">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Network Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Accounts</span>
                <span className="font-mono text-emerald-400">{accounts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Transactions</span>
                <span className="font-mono text-emerald-400">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Volume</span>
                <span className="font-mono text-emerald-400">₹{totalVolume.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Balance</span>
                <span className="font-mono text-emerald-400">₹{totalBalance.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Selected Transaction Panel */}
        {selectedTransaction && (
          <Panel position="top-right" className="m-4!">
            <div className="glass-card-light p-4 min-w-62.5">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-500">ID: </span>
                  <span className="font-mono text-xs text-slate-300">
                    {selectedTransaction.transactionId.substring(0, 8)}...
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Amount: </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    ₹{selectedTransaction.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Time: </span>
                  <span className="text-slate-300">
                    {new Date(selectedTransaction.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {/* Legend */}
        <Panel position="bottom-left" className="m-4!">
          <div className="glass-card-light p-3 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Incoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-400">Outgoing</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400">Click node to filter</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
