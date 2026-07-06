"use client";

import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export default function FinanceChart({ collections = [], expenses = [] }) {
  const [groupBy, setGroupBy] = useState("monthly"); // "monthly" or "daily"
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

  // Helper to compile data dynamically by month or daily date
  const getChartData = () => {
    const filteredCollections = filterByDateRange(collections);
    const filteredExpenses = filterByDateRange(expenses);
    const map = {};

    if (groupBy === "monthly") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      filteredCollections.forEach(item => {
        const dateObj = new Date(item.date);
        if (isNaN(dateObj)) return;
        const key = months[dateObj.getMonth()];
        if (!map[key]) {
          map[key] = { name: key, rawDate: new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime(), Collections: 0, Expenses: 0 };
        }
        map[key].Collections += Number(item.amount || 0);
      });

      filteredExpenses.forEach(item => {
        const dateObj = new Date(item.date);
        if (isNaN(dateObj)) return;
        const key = months[dateObj.getMonth()];
        if (!map[key]) {
          map[key] = { name: key, rawDate: new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime(), Collections: 0, Expenses: 0 };
        }
        map[key].Expenses += Number(item.amount || 0);
      });

      return Object.values(map).sort((a, b) => a.rawDate - b.rawDate);
    } else {
      // Group by exact date (Date-wise / Daily)
      filteredCollections.forEach(item => {
        const key = item.date; // "YYYY-MM-DD"
        if (!map[key]) {
          const dateObj = new Date(item.date);
          const formatted = isNaN(dateObj) ? key : dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short" });
          map[key] = { name: formatted, rawDate: new Date(item.date).getTime(), Collections: 0, Expenses: 0 };
        }
        map[key].Collections += Number(item.amount || 0);
      });

      filteredExpenses.forEach(item => {
        const key = item.date;
        if (!map[key]) {
          const dateObj = new Date(item.date);
          const formatted = isNaN(dateObj) ? key : dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short" });
          map[key] = { name: formatted, rawDate: new Date(item.date).getTime(), Collections: 0, Expenses: 0 };
        }
        map[key].Expenses += Number(item.amount || 0);
      });

      return Object.values(map).sort((a, b) => a.rawDate - b.rawDate);
    }
  };

  const data = getChartData();
  const hasData = data.length > 0;

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Cash Flow Comparison</h3>
          <p className="text-xs text-slate-400">Receivables vs operational expenditures</p>
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="border border-slate-200 rounded-lg py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-none focus:border-slate-400 font-semibold cursor-pointer"
          >
            <option value="monthly">Monthly View</option>
            <option value="daily">Daily View (Date-wise)</option>
          </select>

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

      <div className="h-64 w-full flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
              <Bar dataKey="Collections" fill="#0f172a" radius={[3, 3, 0, 0]} barSize={16} name="Collections (₹)" />
              <Bar dataKey="Expenses" fill="#94a3b8" radius={[3, 3, 0, 0]} barSize={16} name="Expenses (₹)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 space-y-2">
            <p className="text-xs text-slate-450 font-light">No ledger entries logged for the selected period.</p>
            <p className="text-[10px] text-slate-350">Adjust filters or select a different date range above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
