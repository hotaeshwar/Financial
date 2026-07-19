"use client";

import { useState } from "react";
import { Plus, Edit3, Trash2, Search, X, Check, IndianRupee, Calendar, Tag, FileText, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReceiptModal from "./ReceiptModal";

const exportToExcel = (items, filename) => {
  if (!items || items.length === 0) {
    alert("No records to export.");
    return;
  }

  // Group items by month
  const groups = {};
  items.forEach(item => {
    const d = new Date(item.date);
    const monthName = isNaN(d.getTime()) 
      ? "Unknown Month" 
      : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[monthName]) groups[monthName] = [];
    groups[monthName].push(item);
  });

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="PaidStyle">
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#15803D"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="UnpaidStyle">
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#B91C1C"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="PendingStyle">
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#B45309"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="ProcessingStyle">
   <Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1D4ED8"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="CurrencyStyle">
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
  </Style>
  <Style ss:ID="TotalStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalCurrencyStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
 </Styles>`;

  Object.keys(groups).forEach(month => {
    const monthItems = groups[month];
    xml += `
 <Worksheet ss:Name="${month.replace(/[\\/\\?\\*\\]\\[]/g, "")}">
  <Table ss:ExpandedColumnCount="6" ss:ExpandedRowCount="${monthItems.length + 2}" x:FullColumns="1"
   x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="200"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="100"/>
   <Column ss:AutoFitWidth="0" ss:Width="100"/>
   <Row ss:AutoFitHeight="0" ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Description</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Total Amount</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Paid Amount</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Due Amount</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Status</Data></Cell>
   </Row>`;

    let totalAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;
    monthItems.forEach(item => {
      const amt = Number(item.amount || 0);
      const paid = item.status?.toLowerCase() === "received" 
        ? amt 
        : item.status?.toLowerCase() === "partial payment" 
        ? Number(item.paidAmount || 0) 
        : 0;
      const due = amt - paid;

      totalAmount += amt;
      totalPaid += paid;
      totalDue += due;

      const statusLower = (item.status || "").toLowerCase();
      let statusStyle = "Default";
      if (statusLower === "paid" || statusLower === "received") {
        statusStyle = "PaidStyle";
      } else if (statusLower === "unpaid") {
        statusStyle = "UnpaidStyle";
      } else if (statusLower === "pending") {
        statusStyle = "PendingStyle";
      } else if (statusLower === "partial payment") {
        statusStyle = "ProcessingStyle";
      }

      xml += `
   <Row>
    <Cell><Data ss:Type="String">${item.description}</Data></Cell>
    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${amt}</Data></Cell>
    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${paid}</Data></Cell>
    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${due}</Data></Cell>
    <Cell><Data ss:Type="String">${item.date}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${item.status}</Data></Cell>
   </Row>`;
    });

    // Total Row
    xml += `
   <Row ss:StyleID="TotalStyle">
    <Cell ss:StyleID="TotalStyle"><Data ss:Type="String">Total</Data></Cell>
    <Cell ss:StyleID="TotalCurrencyStyle"><Data ss:Type="Number">${totalAmount}</Data></Cell>
    <Cell ss:StyleID="TotalCurrencyStyle"><Data ss:Type="Number">${totalPaid}</Data></Cell>
    <Cell ss:StyleID="TotalCurrencyStyle"><Data ss:Type="Number">${totalDue}</Data></Cell>
    <Cell ss:StyleID="TotalStyle"><Data ss:Type="String"></Data></Cell>
    <Cell ss:StyleID="TotalStyle"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>`;
  });

  xml += `</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function CollectionList({ 
  items = [], 
  onAdd, 
  onUpdate, 
  onDelete,
  onAddReminder
}) {
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeReceiptItem, setActiveReceiptItem] = useState(null);

  // Collection reminder form states
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderItem, setReminderItem] = useState(null);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().split("T")[0]);
  const [reminderTone, setReminderTone] = useState("chime");
  const [reminderFrequency, setReminderFrequency] = useState("daily");
  const [reminderError, setReminderError] = useState("");

  const handleOpenReminderModal = (item) => {
    setReminderItem(item);
    setReminderTime("");
    setReminderDate(new Date().toISOString().split("T")[0]);
    setReminderTone("chime");
    setReminderFrequency("daily");
    setReminderError("");
    setIsReminderModalOpen(true);
  };

  const handleCloseReminderModal = () => {
    setIsReminderModalOpen(false);
    setReminderItem(null);
    setReminderError("");
  };

  const handleReminderSubmit = (e) => {
    e.preventDefault();
    if (!reminderTime) {
      setReminderError("Please select a time.");
      return;
    }
    if (reminderFrequency === "once" && !reminderDate) {
      setReminderError("Please select a date.");
      return;
    }

    const payload = {
      description: `Collect: ${reminderItem.description} - ₹${Number(reminderItem.amount).toLocaleString("en-IN")}`,
      date: reminderFrequency === "daily" ? "" : reminderDate,
      time: reminderTime,
      tone: reminderTone,
      frequency: reminderFrequency,
      fired: false,
      lastFiredDate: null,
      collectionId: reminderItem.id
    };

    if (onAddReminder) {
      onAddReminder(payload);
    }
    handleCloseReminderModal();
  };
  
  // Form state
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    paidAmount: "",
    date: "",
    status: "Pending"
  });
  const [error, setError] = useState("");

  // Open form for adding new item
  const handleOpenAdd = () => {
    setError("");
    setEditingItem(null);
    setFormData({
      description: "",
      amount: "",
      paidAmount: "",
      date: new Date().toISOString().split("T")[0],
      status: "Pending"
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
      paidAmount: item.paidAmount !== undefined ? item.paidAmount.toString() : "",
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
      setError("Status is required.");
      return;
    }

    let finalPaidAmount = 0;
    if (formData.status === "Partial Payment") {
      if (!formData.paidAmount || isNaN(formData.paidAmount) || Number(formData.paidAmount) <= 0) {
        setError("Paid amount must be a positive number.");
        return;
      }
      if (Number(formData.paidAmount) >= Number(formData.amount)) {
        setError("Paid amount for partial payment must be less than total amount (otherwise set status to Received).");
        return;
      }
      finalPaidAmount = Number(formData.paidAmount);
    } else if (formData.status === "Received") {
      finalPaidAmount = Number(formData.amount);
    }

    const payload = {
      description: formData.description.trim(),
      amount: Number(formData.amount),
      paidAmount: finalPaidAmount,
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

  const handleShareWhatsApp = (item) => {
    setActiveReceiptItem(item);
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
            <span>Collection List</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {filteredItems.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400">Incoming receivables and payments</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportToExcel(items, "Collections_Report.xls")}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs py-2 px-3.5 rounded-lg transition-colors shadow-sm cursor-pointer"
            title="Download report in Excel format"
          >
            <FileText size={14} className="text-emerald-600" />
            <span>Export Excel</span>
          </button>
          
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-3.5 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-2.5 text-left">Description</th>
              <th className="px-4 py-2.5 text-right">Total Amount</th>
              <th className="px-4 py-2.5 text-right">Received</th>
              <th className="px-4 py-2.5 text-right">Due</th>
              <th className="px-4 py-2.5 text-center">Date</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isPartial = item.status?.toLowerCase() === "partial payment";
                const isReceived = item.status?.toLowerCase() === "received";
                
                const totalAmt = Number(item.amount || 0);
                const receivedAmt = isReceived 
                  ? totalAmt 
                  : isPartial 
                  ? Number(item.paidAmount || 0) 
                  : 0;
                const dueAmt = isReceived 
                  ? 0 
                  : isPartial 
                  ? totalAmt - receivedAmt 
                  : totalAmt;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[150px] truncate">{item.description}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 text-right">
                      ₹{totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-600 text-right">
                      ₹{receivedAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 font-semibold text-right ${dueAmt > 0 ? "text-red-500" : "text-slate-450 font-normal"}`}>
                      ₹{dueAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-center whitespace-nowrap">{item.date}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide whitespace-nowrap ${
                        item.status?.toLowerCase() === "received"
                          ? "bg-emerald-50 border-emerald-200/50 text-emerald-700"
                          : item.status?.toLowerCase() === "partial payment"
                          ? "bg-indigo-50 border-indigo-200/50 text-indigo-700"
                          : item.status?.toLowerCase() === "pending"
                          ? "bg-amber-50 border-amber-200/50 text-amber-700"
                          : "bg-slate-50 border-slate-200/50 text-slate-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(item)}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Share details on WhatsApp"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.489 0 9.954-4.464 9.957-9.956.002-2.661-1.034-5.163-2.916-7.047C16.435 1.758 13.93 .717 11.272.717 5.783.717 1.317 5.183 1.315 10.676c-.001 1.705.446 3.371 1.294 4.841l-.974 3.556 3.64-.954zm10.743-5.385c-.29-.145-1.716-.848-1.982-.945-.267-.097-.461-.145-.655.145-.194.29-.752.945-.921 1.139-.17.194-.339.218-.629.073-.29-.145-1.226-.452-2.336-1.441-.864-.77-1.448-1.721-1.618-2.012-.17-.29-.018-.447.127-.591.13-.13.29-.339.436-.509.145-.17.194-.291.291-.485.097-.194.049-.364-.024-.509-.073-.145-.655-1.577-.897-2.158-.236-.569-.475-.491-.655-.5-.17-.008-.364-.01-.558-.01-.194 0-.509.073-.776.364-.267.29-1.02 1.02-1.02 2.487 0 1.467 1.067 2.885 1.213 3.079.145.194 2.1 3.206 5.089 4.495.71.307 1.265.49 1.697.628.713.227 1.36.195 1.872.119.571-.085 1.716-.703 1.958-1.382.242-.679.242-1.261.17-1.382-.073-.12-.267-.194-.558-.339z"/>
                          </svg>
                        </button>
                        
                        {item.status?.toLowerCase() !== "received" && (
                          <button
                            type="button"
                            onClick={() => handleOpenReminderModal(item)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Schedule Alert Reminder"
                          >
                            <Bell size={13} />
                          </button>
                        )}
                        
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
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400 font-light">
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
                  {editingItem ? "Edit Collection" : "New Collection"}
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
                      placeholder="e.g. Consulting Retainer"
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

                {/* Status - Dropdown select */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Status
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                      <Tag size={12} />
                    </span>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full pl-7 pr-3 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700 bg-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Received">Received</option>
                      <option value="Partial Payment">Partial Payment</option>
                    </select>
                  </div>
                </div>

                {/* Paid Amount (only for Partial Payment status) */}
                {formData.status === "Partial Payment" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-1"
                  >
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Paid Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                          <IndianRupee size={12} />
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          name="paidAmount"
                          value={formData.paidAmount}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                        />
                      </div>
                    </div>
                    {formData.amount && !isNaN(formData.amount) && (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 flex justify-between font-semibold">
                        <span>Remaining Balance:</span>
                        <span className="text-red-500">
                          ₹{Number(formData.amount - (formData.paidAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

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

      {/* Receipt Share Modal */}
      <AnimatePresence>
        {activeReceiptItem && (
          <ReceiptModal
            isOpen={true}
            onClose={() => setActiveReceiptItem(null)}
            item={activeReceiptItem}
            type="collection"
          />
        )}
      </AnimatePresence>

      {/* Reminder Scheduling Modal */}
      <AnimatePresence>
        {isReminderModalOpen && reminderItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-indigo-500 animate-pulse animate-duration-1000" />
                  <h4 className="font-semibold text-sm text-slate-800">
                    Schedule Collection Reminder
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleCloseReminderModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleReminderSubmit} className="p-5 space-y-4">
                {reminderError && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-100 text-red-700 text-xs font-medium">
                    {reminderError}
                  </div>
                )}

                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs text-slate-700 font-semibold space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Target Collection</p>
                  <p className="truncate text-slate-800 font-bold">{reminderItem.description}</p>
                  <p className="text-slate-500 font-medium">Amount: ₹{Number(reminderItem.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                </div>

                {/* Frequency Select */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Alert Frequency</label>
                  <select
                    value={reminderFrequency}
                    onChange={(e) => setReminderFrequency(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700 bg-white"
                  >
                    <option value="daily">🔄 Daily Recurring Reminder</option>
                    <option value="once">📅 One-Time Reminder</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Time Picker */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Time</label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                    />
                  </div>

                  {/* Tone Select */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Alarm Tone</label>
                    <select
                      value={reminderTone}
                      onChange={(e) => setReminderTone(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700 bg-white"
                    >
                      <option value="chime">🔔 Classic Chime</option>
                      <option value="beep">🚨 Double Beep</option>
                      <option value="digital">⏰ Digital Alarm</option>
                      <option value="retro">👾 Retro Game</option>
                      <option value="ascending">📈 Sweep Up</option>
                      <option value="zen">🧘 Zen Bowl</option>
                    </select>
                  </div>
                </div>

                {/* Date Picker (only if frequency is once) */}
                {reminderFrequency === "once" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                    />
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseReminderModal}
                    className="flex-1 py-2 text-xs border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Set Reminder</span>
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
