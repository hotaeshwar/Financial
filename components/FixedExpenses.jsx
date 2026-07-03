"use client";

import { useState } from "react";
import { Plus, Edit3, Trash2, Search, X, Check, IndianRupee, Calendar, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FixedExpenses({ 
  items = [], 
  onAdd, 
  onUpdate, 
  onDelete 
}) {
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: "",
    status: ""
  });
  const [error, setError] = useState("");

  // Open form for adding new item
  const handleOpenAdd = () => {
    setError("");
    setEditingItem(null);
    setFormData({
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      status: ""
    });
    setIsFormOpen(true);
  };

  // Open form for editing existing item
  const handleOpenEdit = (item) => {
    setError("");
    setEditingItem(item);
    setFormData({
      description: item.description,
      amount: item.amount.toString(),
      date: item.date,
      status: item.status || ""
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setError("Amount must be a positive number.");
      return;
    }
    if (!formData.date) {
      setError("Date is required.");
      return;
    }
    if (!formData.status.trim()) {
      setError("Status is required (manually type status).");
      return;
    }

    const payload = {
      description: formData.description.trim(),
      amount: Number(formData.amount),
      date: formData.date,
      status: formData.status.trim()
    };

    if (editingItem) {
      onUpdate(editingItem.id, payload);
    } else {
      onAdd(payload);
    }
    handleCloseForm();
  };

  const handleDeleteClick = (item) => {
    if (confirm(`Are you sure you want to delete "${item.description}"?`)) {
      onDelete(item.id);
    }
  };

  // Filter items by search string
  const filteredItems = items.filter(item => 
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    (item.status && item.status.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span>Fixed Expenses</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {filteredItems.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400">Regular expenditures and bill payments</p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-3.5 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span>Add Record</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-2.5">Description</th>
              <th className="py-2.5 text-right">Amount</th>
              <th className="py-2.5 text-center">Date</th>
              <th className="py-2.5 text-center">Status</th>
              <th className="py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-3 font-medium text-slate-800 max-w-[150px] truncate">{item.description}</td>
                  <td className="py-3 font-semibold text-slate-700 text-right">
                    ₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-slate-400 text-center whitespace-nowrap">{item.date}</td>
                  <td className="py-3 text-center">
                    <span className="inline-block bg-slate-100 border border-slate-200/50 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400 font-light">
                  {search ? "No matches found" : "No records to display"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                <h4 className="font-semibold text-sm text-slate-800">
                  {editingItem ? "Edit Expense" : "New Expense"}
                </h4>
                <button
                  onClick={handleCloseForm}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-100 text-red-700 text-xs font-medium">
                    {error}
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Description</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="e.g. Office Rent"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                      <IndianRupee size={12} />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                    />
                  </div>
                </div>

                {/* Status - Manual text input */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Status <span className="text-[9px] text-slate-400 lowercase font-normal">(type manually)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                      <Tag size={12} />
                    </span>
                    <input
                      type="text"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      placeholder="e.g. Paid, Unpaid, Pending"
                      className="w-full pl-7 pr-3 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 py-2 text-xs border border-slate-200 hover:bg-slate-50 text-slate-500 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                  >
                    <Check size={13} />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
