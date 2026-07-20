"use client";

import { useState } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const CHART_COLORS = [
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#ef4444", // Red
  "#06b6d4"  // Cyan
];

export default function FinanceChart({ collections = [], expenses = [] }) {
  const [activeChartTab, setActiveChartTab] = useState("collections"); // "collections" or "expenses"
  const [rangePreset, setRangePreset] = useState("all"); // "all", "this_month", "last_30", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Helper to filter entries based on selected range preset
  const filterByDateRange = (items) => {
    return items.filter(item => {
      if (!item.date) return false;
      const itemTime = new Date(item.date).getTime();
      if (isNaN(itemTime)) return false;

      const now = new Date();
      if (rangePreset === "this_month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return itemTime >= startOfMonth;
      }
      if (rangePreset === "last_30") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
        return itemTime >= thirtyDaysAgo;
      }
      if (rangePreset === "custom") {
        if (startDate) {
          const start = new Date(startDate).getTime();
          if (itemTime < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemTime > end.getTime()) return false;
        }
        return true;
      }
      return true; // "all"
    });
  };

  const filteredCollections = filterByDateRange(collections);
  const filteredExpenses = filterByDateRange(expenses);

  // Calculate Total Received Collections (Received status amount + Partial payment paidAmount)
  const totalReceived = filteredCollections.reduce((sum, item) => {
    const received = item.status?.toLowerCase() === "received" 
      ? Number(item.amount || 0) 
      : item.status?.toLowerCase() === "partial payment" 
      ? Number(item.paidAmount || 0) 
      : 0;
    return sum + received;
  }, 0);

  // Calculate Total Paid Expenses
  const totalExpensesValue = filteredExpenses.reduce((sum, item) => {
    const isPaid = item.status?.toLowerCase() === "paid";
    return sum + (isPaid ? Number(item.amount || 0) : 0);
  }, 0);

  // Group Collections by Description for Pie slices
  const collectionsGrouped = {};
  filteredCollections.forEach(item => {
    const desc = item.description || "Other";
    const received = item.status?.toLowerCase() === "received" 
      ? Number(item.amount || 0) 
      : item.status?.toLowerCase() === "partial payment" 
      ? Number(item.paidAmount || 0) 
      : 0;
    if (received > 0) {
      collectionsGrouped[desc] = (collectionsGrouped[desc] || 0) + received;
    }
  });

  const collectionsPieData = Object.keys(collectionsGrouped).map((desc, idx) => ({
    name: desc,
    value: collectionsGrouped[desc],
    color: CHART_COLORS[idx % CHART_COLORS.length]
  })).sort((a, b) => b.value - a.value); // Sort descending to place highest shares first!

  // Group Expenses by Description for Pie slices
  const expensesGrouped = {};
  filteredExpenses.forEach(item => {
    const isPaid = item.status?.toLowerCase() === "paid";
    if (isPaid) {
      const desc = item.description || "Other";
      const amt = Number(item.amount || 0);
      if (amt > 0) {
        expensesGrouped[desc] = (expensesGrouped[desc] || 0) + amt;
      }
    }
  });

  const expensesPieData = Object.keys(expensesGrouped).map((desc, idx) => ({
    name: desc,
    value: expensesGrouped[desc],
    color: CHART_COLORS[idx % CHART_COLORS.length]
  })).sort((a, b) => b.value - a.value); // Sort descending to place highest shares first!

  const pieData = activeChartTab === "collections" ? collectionsPieData : expensesPieData;
  const hasData = pieData.length > 0;

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Cash Flow Share Comparison</h3>
          <p className="text-xs text-slate-400">Received income breakdown vs logged expenditures</p>
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={rangePreset}
            onChange={(e) => setRangePreset(e.target.value)}
            className="border border-slate-200 rounded-lg py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-none focus:border-slate-400 font-semibold cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_30">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Custom Range picker inputs */}
      {rangePreset === "custom" && (
        <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Start Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-slate-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>End Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-slate-500 bg-white"
            />
          </div>
        </div>
      )}

      {/* Sub-tabs and Overall Display */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Toggle sub-tabs bar */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl max-w-xs w-full relative">
          <button
            onClick={() => setActiveChartTab("collections")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
              activeChartTab === "collections"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveChartTab("expenses")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
              activeChartTab === "expenses"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Expenses
          </button>
        </div>

        {/* Overall Total Display */}
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {activeChartTab === "collections" ? "Total Collected Inflow" : "Total Outflow Paid"}
          </span>
          <h4 className="text-lg font-extrabold text-slate-800 mt-0.5">
            ₹{activeChartTab === "collections" 
              ? totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 }) 
              : totalExpensesValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h4>
        </div>
      </div>

      {/* Graphical section */}
      <div className="pt-2">
        {hasData ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Donut Pie Chart */}
            <div className="h-64 w-full md:w-3/5 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(value) => [`₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, "Total"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Right: Custom Detailed Legend list */}
            <div className="w-full md:w-2/5 max-h-64 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-150">
                Breakdown Share
              </p>
              <div className="divide-y divide-slate-100 text-xs">
                {pieData.map((entry, idx) => {
                  const totalVal = activeChartTab === "collections" ? totalReceived : totalExpensesValue;
                  const percent = totalVal > 0 ? ((entry.value / totalVal) * 100).toFixed(0) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between py-2 text-slate-700 font-semibold gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate text-slate-700 max-w-[160px]" title={entry.name}>
                          {entry.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[11px]">
                        <span className="text-slate-400 font-normal">{percent}%</span>
                        <span className="font-bold text-slate-800">
                          ₹{entry.value.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 w-full flex items-center justify-center text-center py-10 space-y-2">
            <div>
              <p className="text-xs text-slate-455 font-light">
                {activeChartTab === "collections" 
                  ? "No received collections for this period." 
                  : "No expenses logged for this period."}
              </p>
              <p className="text-[10px] text-slate-350">Adjust filters or select a different date range above.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
