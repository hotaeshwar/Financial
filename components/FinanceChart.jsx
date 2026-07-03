"use client";

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
  // Helper to compile data dynamically by month
  const getChartData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = {};

    // Group collections by month
    collections.forEach(item => {
      if (!item.date) return;
      const dateObj = new Date(item.date);
      if (isNaN(dateObj)) return;
      const monthName = months[dateObj.getMonth()];
      if (!monthlyMap[monthName]) {
        monthlyMap[monthName] = { name: monthName, Collections: 0, Expenses: 0 };
      }
      monthlyMap[monthName].Collections += Number(item.amount || 0);
    });

    // Group expenses by month
    expenses.forEach(item => {
      if (!item.date) return;
      const dateObj = new Date(item.date);
      if (isNaN(dateObj)) return;
      const monthName = months[dateObj.getMonth()];
      if (!monthlyMap[monthName]) {
        monthlyMap[monthName] = { name: monthName, Collections: 0, Expenses: 0 };
      }
      monthlyMap[monthName].Expenses += Number(item.amount || 0);
    });

    // Convert map to sorted array based on month order
    return Object.values(monthlyMap).sort((a, b) => 
      months.indexOf(a.name) - months.indexOf(b.name)
    );
  };

  const data = getChartData();
  const hasData = data.length > 0;

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Cash Flow Comparison</h3>
        <p className="text-xs text-slate-400">Monthly receivables vs operational expenditures</p>
      </div>

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
            <p className="text-xs text-slate-450 font-light">No ledger entries logged this period.</p>
            <p className="text-[10px] text-slate-350">Add collections or expenses below to generate bar graphs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
