"use client";

import { useState, useRef } from "react";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle, 
  IndianRupee, 
  Calendar, 
  FileText, 
  Share2, 
  Download, 
  Printer, 
  Phone,
  Building2,
  Info,
  TrendingUp,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ResponsiveContainer
} from "recharts";

const CHART_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#06b6d4"  // Cyan
];

export default function Bookkeeping({ items = [], onAdd, onUpdate, onDelete, activeCompanyName }) {
  const [activeTab, setActiveTab] = useState("records"); // "records" or "analytics"
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sharingItem, setSharingItem] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Form states (new schema fields)
  const [description, setDescription] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Analytics filter states
  const [analysisPeriod, setAnalysisPeriod] = useState("monthly"); // "daily", "monthly", "quarterly", "yearly"
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [filterQuarterYear, setFilterQuarterYear] = useState(new Date().getFullYear().toString());
  const [filterQuarter, setFilterQuarter] = useState(`Q${Math.floor(new Date().getMonth() / 3) + 1}`);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Progress states
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const canvasRef = useRef(null);

  // Deterministic Reference Code
  const getBkRefNo = (item) => {
    if (!item) return "";
    let y = "2026", m = "07", d = "06";
    if (item.date) {
      const parts = item.date.split("-");
      if (parts.length === 3) {
        [y, m, d] = parts;
      }
    }
    let hash = 0;
    const str = item.id || item.paidBy || item.paidTo || activeCompanyName || "";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const serial = Math.abs(hash % 9000) + 1000;
    return `BKA${y}/${m}/${d}-${serial}`;
  };

  const openAddForm = () => {
    setEditingItem(null);
    setDescription("");
    setPaidTo("");
    setPaidBy(activeCompanyName);
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setClientPhone("");
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setDescription(item.description || item.serviceDescription || "");
    setPaidTo(item.paidTo || "Book Keeping Services");
    setPaidBy(item.paidBy || item.clientName || activeCompanyName);
    setAmount(item.amount || "");
    setDate(item.date || "");
    setClientPhone(item.clientPhone || "");
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !date || !description || !paidTo || !paidBy) return;

    const dateObj = new Date(date);
    const billingPeriod = isNaN(dateObj.getTime())
      ? new Date().toLocaleString("en-US", { month: "long", year: "numeric" })
      : dateObj.toLocaleString("en-US", { month: "long", year: "numeric" });

    const payload = {
      description: description.trim(),
      paidTo: paidTo.trim(),
      paidBy: paidBy.trim(),
      clientName: activeCompanyName, // metadata
      amount: Number(amount),
      date,
      clientPhone: clientPhone.trim(),
      period: billingPeriod,
      status: "Received",
      updatedAt: new Date().toISOString()
    };

    if (editingItem) {
      onUpdate(editingItem.id, payload);
    } else {
      payload.createdAt = new Date().toISOString();
      onAdd(payload);
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id, desc) => {
    if (confirm(`Delete book keeping payment record "${desc}"?`)) {
      onDelete(id);
    }
  };

  // Filter items by search term (Description, Paid To, Paid By)
  const filteredItems = items.filter(item => {
    const itemDesc = (item.description || item.serviceDescription || "").toLowerCase();
    const itemPaidTo = (item.paidTo || "Book Keeping Services").toLowerCase();
    const itemPaidBy = (item.paidBy || item.clientName || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    return itemDesc.includes(search) || itemPaidTo.includes(search) || itemPaidBy.includes(search);
  });

  const totalReceived = filteredItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const recordCount = filteredItems.length;

  // Filter items specifically for the Analytics view
  const getFilteredAnalyticsItems = () => {
    return items.filter(item => {
      if (!item.date) return false;
      const dateObj = new Date(item.date);
      if (isNaN(dateObj.getTime())) return false;

      const y = dateObj.getFullYear();
      const m = dateObj.getMonth(); // 0-11
      const quarter = `Q${Math.floor(m / 3) + 1}`;

      if (analysisPeriod === "daily") {
        return item.date === filterDate;
      }
      if (analysisPeriod === "monthly") {
        return item.date.startsWith(filterMonth);
      }
      if (analysisPeriod === "quarterly") {
        return y.toString() === filterQuarterYear && quarter === filterQuarter;
      }
      if (analysisPeriod === "yearly") {
        return y.toString() === filterYear;
      }
      return true;
    });
  };

  const analyticsItems = getFilteredAnalyticsItems();

  // Excel / CSV Export
  const handleDownloadCSV = () => {
    const headers = ["S.No.", "Date", "Description", "Paid To", "Paid By", "Amount (INR)", "WhatsApp Contact"];
    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      item.date,
      item.description || item.serviceDescription || "",
      item.paidTo || "Book Keeping Services",
      item.paidBy || item.clientName || activeCompanyName,
      item.amount,
      item.clientPhone || ""
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `book_keeping_${activeCompanyName.replace(/\s+/g, "_")}_statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Statement Export (Full Table)
  const handleDownloadStatementPDF = () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4" // A4 is 595 x 842 pt
    });

    // Title
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text("Book Keeping Statement", 40, 50);

    // Subtitle
    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(`Company: ${activeCompanyName}`, 40, 68);
    pdf.text(`Date Generated: ${new Date().toLocaleDateString()}`, 40, 82);

    // Table Headers
    const startY = 110;
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.rect(40, startY, 515, 20, "F");
    pdf.rect(40, startY, 515, 20, "S");

    pdf.setTextColor(71, 85, 105);
    pdf.text("S.No.", 50, startY + 14);
    pdf.text("Date", 90, startY + 14);
    pdf.text("Description", 150, startY + 14);
    pdf.text("Paid To", 270, startY + 14);
    pdf.text("Paid By", 380, startY + 14);
    pdf.text("Amount (INR)", 470, startY + 14);

    let currentY = startY + 20;
    pdf.setFont("Helvetica", "normal");

    filteredItems.forEach((item, index) => {
      // Check if page overflows
      if (currentY > 780) {
        pdf.addPage();
        currentY = 50;

        // Re-draw headers on new page
        pdf.setFont("Helvetica", "bold");
        pdf.setFillColor(248, 250, 252);
        pdf.rect(40, currentY, 515, 20, "F");
        pdf.rect(40, currentY, 515, 20, "S");
        pdf.setTextColor(71, 85, 105);
        pdf.text("S.No.", 50, currentY + 14);
        pdf.text("Date", 90, currentY + 14);
        pdf.text("Description", 150, currentY + 14);
        pdf.text("Paid To", 270, currentY + 14);
        pdf.text("Paid By", 380, currentY + 14);
        pdf.text("Amount (INR)", 470, currentY + 14);

        currentY += 20;
        pdf.setFont("Helvetica", "normal");
      }

      // Draw border
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.rect(40, currentY, 515, 20, "S");

      pdf.setTextColor(51, 65, 85);

      // Values
      pdf.text(String(index + 1), 50, currentY + 14);
      pdf.text(item.date || "", 90, currentY + 14);

      // Clip columns
      const desc = pdf.splitTextToSize(item.description || item.serviceDescription || "", 110);
      const paidToVal = pdf.splitTextToSize(item.paidTo || "Book Keeping Services", 100);
      const paidByVal = pdf.splitTextToSize(item.paidBy || item.clientName || activeCompanyName || "", 80);
      const amtStr = Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

      pdf.text(desc[0] || "", 150, currentY + 14);
      pdf.text(paidToVal[0] || "", 270, currentY + 14);
      pdf.text(paidByVal[0] || "", 380, currentY + 14);
      pdf.text(amtStr, 470, currentY + 14);

      currentY += 20;
    });

    // Total row
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.rect(40, currentY, 515, 22, "F");
    pdf.rect(40, currentY, 515, 22, "S");

    pdf.setFont("Helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text("Total Amount", 50, currentY + 15);
    const totalAmtStr = "INR " + totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    pdf.text(totalAmtStr, 470, currentY + 15);

    pdf.save(`book_keeping_${activeCompanyName.replace(/\s+/g, "_")}_statement.pdf`);
  };

  // WhatsApp sharing as normal text
  const handleShareToWhatsAppText = (item) => {
    const refNo = getBkRefNo(item);
    const desc = item.description || item.serviceDescription || "Book Keeping & Accounting Services";
    const pTo = item.paidTo || "Book Keeping Services";
    const pBy = item.paidBy || item.clientName || activeCompanyName;
    const formattedAmount = Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

    const message = 
      `*PAYMENT ACKNOWLEDGEMENT*\n` +
      `-------------------------\n` +
      `📄 *Ref No:* \`${refNo}\`\n` +
      `📅 *Date:* ${item.date}\n` +
      `📝 *Description:* ${desc}\n` +
      `👉 *Paid To:* ${pTo}\n` +
      `👈 *Paid By:* ${pBy}\n` +
      `💰 *Amount:* ₹${formattedAmount}\n` +
      `-------------------------\n` +
      `Thank you. (Shared via BiD Finance Monitor)`;

    const encodedText = encodeURIComponent(message);
    const cleanPhone = item.clientPhone ? item.clientPhone.replace(/\D/g, "") : "";
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}` 
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, "_blank");
  };

  // Single transaction Canvas drawing (remains for PNG / Single Receipt PDF)
  const drawAcknowledgementOnCanvas = (ctx, item) => {
    const refNo = getBkRefNo(item);
    const formattedAmount = Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 800);

    ctx.strokeStyle = "#1e293b"; 
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, 570, 770);

    ctx.strokeStyle = "#94a3b8"; 
    ctx.lineWidth = 1;
    ctx.strokeRect(25, 25, 550, 750);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(26, 26, 548, 12);

    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.font = "bold 24px Georgia, serif";
    ctx.fillText("PAYMENT ACKNOWLEDGEMENT", 300, 80);

    ctx.fillStyle = "#475569";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillText("BOOK KEEPING & ACCOUNTING SERVICES RECORD", 300, 105);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(50, 122);
    ctx.lineTo(550, 122);
    ctx.stroke();

    const metaY = 165;
    ctx.textAlign = "left";
    
    // Left column
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillText("PAID TO / RECIPIENT:", 60, metaY);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText(item.paidTo || "Book Keeping Services", 60, metaY + 20);

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillText("RECEIPT REFERENCE NO:", 60, metaY + 60);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px monospace";
    ctx.fillText(refNo, 60, metaY + 76);

    // Right column
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillText("PAID BY / PAYER:", 350, metaY);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText(item.paidBy || item.clientName || activeCompanyName, 350, metaY + 20);

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillText("PAYMENT DATE:", 350, metaY + 60);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.fillText(item.date || "N/A", 350, metaY + 76);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 265);
    ctx.lineTo(550, 265);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillText("DESCRIPTION OF RECORD:", 60, 295);
    
    ctx.fillStyle = "#334155";
    ctx.font = "13px Georgia, serif";
    const descText = item.description || item.serviceDescription || "Book Keeping Services";
    
    // Simple word wrapping
    const words = descText.split(" ");
    let line = "";
    let curY = 320;
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 480 && n > 0) {
        ctx.fillText(line, 60, curY);
        line = words[n] + " ";
        curY += 22;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 60, curY);

    const tableHeaderY = Math.max(curY + 40, 410);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(50, tableHeaderY, 500, 30);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(50, tableHeaderY, 500, 30);

    ctx.fillStyle = "#475569";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillText("PARTICULARS / ITEMIZATION", 70, tableHeaderY + 18);
    ctx.textAlign = "right";
    ctx.fillText("AMOUNT RECEIVED (INR)", 530, tableHeaderY + 18);

    ctx.textAlign = "left";
    ctx.fillStyle = "#334155";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(`Accounting Services Record (${item.period || "Current Period"})`, 70, tableHeaderY + 52);

    ctx.textAlign = "right";
    ctx.font = "12px monospace";
    ctx.fillText(`₹${formattedAmount}`, 530, tableHeaderY + 52);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, tableHeaderY + 65);
    ctx.lineTo(550, tableHeaderY + 65);
    ctx.stroke();

    const totalBoxY = tableHeaderY + 80;
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(50, totalBoxY, 500, 45);
    ctx.strokeStyle = "#cbd5e1";
    ctx.strokeRect(50, totalBoxY, 500, 45);

    ctx.textAlign = "left";
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.fillText("TOTAL RECEIVED AMOUNT:", 70, totalBoxY + 28);

    ctx.textAlign = "right";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`₹${formattedAmount}`, 530, totalBoxY + 29);

    const sealY = totalBoxY + 80;
    ctx.strokeStyle = "#cbd5e1";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(380, sealY + 40);
    ctx.lineTo(530, sealY + 40);
    ctx.stroke();
    ctx.setLineDash([]); 

    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "9px system-ui, sans-serif";
    ctx.fillText("AUTHORIZED SIGNATORY", 455, sealY + 54);

    const footerY = 745;
    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 9px system-ui, sans-serif";
    ctx.fillText("THIS IS A SYSTEM GENERATED STATEMENT VALID WITHOUT SIGNATURE", 300, footerY);
    ctx.font = "8px system-ui, sans-serif";
    ctx.fillText("Generated securely. Date: " + new Date().toLocaleDateString(), 300, footerY + 15);
  };

  const handleDownloadPDF = () => {
    if (!sharingItem) return;
    setIsDownloadingPdf(true);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsDownloadingPdf(false);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsDownloadingPdf(false);
      return;
    }

    try {
      drawAcknowledgementOnCanvas(ctx, sharingItem);
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [450, 600],
      });

      pdf.addImage(imgData, "PNG", 0, 0, 450, 600);
      const refNoClean = getBkRefNo(sharingItem).replace(/\//g, "_");
      pdf.save(`acknowledgement_${refNoClean}.pdf`);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Failed to export PDF file.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadImage = () => {
    if (!sharingItem) return;
    setIsGeneratingImage(true);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsGeneratingImage(false);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsGeneratingImage(false);
      return;
    }

    try {
      drawAcknowledgementOnCanvas(ctx, sharingItem);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      const refNoClean = getBkRefNo(sharingItem).replace(/\//g, "_");
      a.download = `acknowledgement_${refNoClean}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("PNG download failed:", error);
      alert("Failed to export PNG receipt.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePrint = () => {
    if (!sharingItem) return;
    const refNo = getBkRefNo(sharingItem);
    const formattedAmount = Number(sharingItem.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Acknowledgement - ${refNo}</title>
          <style>
            body {
              font-family: Georgia, serif;
              padding: 40px;
              color: #0f172a;
              background: #fff;
              display: flex;
              justify-content: center;
            }
            .doc {
              width: 550px;
              border: 3px double #1e293b;
              padding: 30px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .title {
              font-size: 22px;
              font-weight: bold;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              font-family: sans-serif;
              font-size: 11px;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .meta-label {
              color: #64748b;
              font-weight: bold;
              font-size: 9px;
              margin-top: 10px;
            }
            .meta-val {
              color: #0f172a;
              font-weight: bold;
            }
            .desc-label {
              font-family: sans-serif;
              font-size: 9px;
              font-weight: bold;
              color: #64748b;
              margin-bottom: 8px;
            }
            .desc-val {
              font-size: 13px;
              line-height: 1.5;
              color: #334155;
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-family: sans-serif;
              font-size: 11px;
              margin-bottom: 40px;
            }
            th {
              background: #f8fafc;
              color: #475569;
              font-weight: bold;
              text-align: left;
              padding: 8px 12px;
              border: 1px solid #e2e8f0;
            }
            td {
              padding: 10px 12px;
              border: 1px solid #e2e8f0;
              color: #334155;
            }
            .right {
              text-align: right;
            }
            .net-box {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              padding: 12px 15px;
              font-family: sans-serif;
              font-weight: bold;
              font-size: 12px;
            }
            .footer {
              text-align: center;
              font-family: sans-serif;
              font-size: 8px;
              color: #94a3b8;
              margin-top: 50px;
              border-top: 1px solid #cbd5e1;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="doc">
            <div class="header">
              <div class="title">PAYMENT ACKNOWLEDGEMENT</div>
            </div>
            <div class="grid">
              <div>
                <div class="meta-label">PAID TO / RECIPIENT:</div>
                <div class="meta-val">${sharingItem.paidTo || "Book Keeping Services"}</div>
                <div class="meta-label">REFERENCE NO:</div>
                <div class="meta-val">${refNo}</div>
              </div>
              <div>
                <div class="meta-label">PAID BY / PAYER:</div>
                <div class="meta-val">${sharingItem.paidBy || sharingItem.clientName || activeCompanyName}</div>
                <div class="meta-label">DATE:</div>
                <div class="meta-val">${sharingItem.date}</div>
              </div>
            </div>
            <div class="desc-label">DESCRIPTION:</div>
            <div class="desc-val">${sharingItem.description || sharingItem.serviceDescription || "Book Keeping Services"}</div>
            <table>
              <thead>
                <tr>
                  <th>PARTICULARS</th>
                  <th class="right">AMOUNT (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Accounting Ledger Services (${sharingItem.period || "Current Month"})</td>
                  <td class="right">₹${formattedAmount}</td>
                </tr>
              </tbody>
            </table>
            <div class="net-box">
              <span>TOTAL RECEIVED</span>
              <span>₹${formattedAmount}</span>
            </div>
            <div class="footer">
              SYSTEM GENERATED PAYMENT RECEIPT STATEMENT.<br/>
              Printed on ${new Date().toLocaleDateString()}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Analytics data holds Outflow and Inflow values compiled per entity

  // Calculate Net Difference Table Data (Paid By - Paid To)
  const getNetDifferenceData = () => {
    const map = {};

    analyticsItems.forEach(item => {
      const pBy = item.paidBy || item.clientName || activeCompanyName || "Unknown Payer";
      const pTo = item.paidTo || "Book Keeping Services";
      const amt = Number(item.amount || 0);

      if (!map[pBy]) map[pBy] = { name: pBy, paidBy: 0, paidTo: 0 };
      if (!map[pTo]) map[pTo] = { name: pTo, paidBy: 0, paidTo: 0 };

      map[pBy].paidBy += amt;
      map[pTo].paidTo += amt;
    });

    return Object.values(map).map(e => ({
      ...e,
      diff: e.paidBy - e.paidTo
    })).sort((a, b) => b.diff - a.diff);
  };

  const netDiffData = getNetDifferenceData();

  return (
    <div className="space-y-6">
      {/* Offscreen Canvas for drawing single receipts */}
      <canvas
        ref={canvasRef}
        width="600"
        height="800"
        className="hidden"
      />

      {/* Active Entity Info Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-slate-300 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Scope</span>
            <p className="text-xs font-bold">Book Keeping Ledger for: <span className="underline decoration-emerald-400 decoration-2">{activeCompanyName}</span></p>
          </div>
        </div>
        <p className="text-[10px] text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 font-medium">
          Manage, Analyze & Share Corporate Transactions
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("records")}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "records"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Ledger Records
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "analytics"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <TrendingUp size={14} />
          <span>Analytics Dashboard</span>
        </button>
      </div>

      {activeTab === "records" ? (
        <div className="space-y-6">
          {/* Bookkeeping Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200/85 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Value Logged</p>
              <h4 className="text-xl font-bold text-emerald-600 mt-1 flex items-center">
                <span className="text-emerald-500 font-normal mr-0.5 text-base">₹</span>
                <span>{totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </h4>
              <div className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Info size={10} className="shrink-0" />
                <span>Sum of all search-matched book keeping entries</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/85 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transactions</p>
              <h4 className="text-xl font-bold text-slate-800 mt-1">
                <span>{recordCount}</span>
                <span className="text-slate-400 text-xs font-normal ml-1">entries</span>
              </h4>
              <div className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1">
                <CheckCircle size={10} className="text-emerald-500 shrink-0" />
                <span>Supports instant WhatsApp text receipt sharing</span>
              </div>
            </div>
          </div>

          {/* Control bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 border border-slate-200/80 p-4 rounded-2xl shadow-sm backdrop-blur-md">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search description, paid to, paid by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-slate-500 font-medium text-slate-700 bg-white"
              />
            </div>

            {/* Export & Create Actions */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={handleDownloadCSV}
                title="Export list to Excel / CSV"
                className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white"
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>Excel</span>
              </button>

              <button
                onClick={handleDownloadStatementPDF}
                title="Download full PDF statement"
                className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white"
              >
                <FileDown size={14} className="text-red-500" />
                <span>PDF Statement</span>
              </button>

              <button
                onClick={openAddForm}
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer flex-1 md:flex-initial"
              >
                <Plus size={14} />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          {/* Bookkeeping Payment List Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            {filteredItems.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Building2 size={36} className="text-slate-300 mx-auto animate-pulse" />
                <p className="text-sm font-semibold text-slate-600">No book keeping records match your criteria</p>
                <p className="text-xs text-slate-400">Click "Add Record" to log a new ledger entry.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="px-4 py-4 text-center w-12">S.No.</th>
                      <th className="px-6 py-4">Particulars / Description</th>
                      <th className="px-4 py-4">Date</th>
                      <th className="px-6 py-4">Paid To</th>
                      <th className="px-6 py-4">Paid By</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredItems.map((item, index) => {
                      const totalAmt = Number(item.amount || 0);
                      const refNo = getBkRefNo(item);
                      const descVal = item.description || item.serviceDescription || "Accounting Services";
                      const paidToVal = item.paidTo || "Book Keeping Services";
                      const paidByVal = item.paidBy || item.clientName || activeCompanyName;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-4 text-center font-bold text-slate-450 w-12">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 space-y-1">
                            <span className="font-bold text-slate-800 text-sm block">{descVal}</span>
                            <span className="text-[9px] text-slate-400 font-mono tracking-wider">{refNo}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-slate-600 block">{item.date}</span>
                            <span className="text-[9px] text-slate-400 block font-normal">{item.period || "Current Month"}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-indigo-650">
                            {paidToVal}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            {paidByVal}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-emerald-600 text-[13px] block">
                              ₹{totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-emerald-500 font-bold block uppercase tracking-wider text-[8px]">Paid</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSharingItem(item);
                                  setIsShareModalOpen(true);
                                }}
                                className="p-1.5 border border-emerald-100 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Share / Print receipt"
                              >
                                <Share2 size={13} />
                                <span className="text-[10px] font-bold">Share</span>
                              </button>
                              <button
                                onClick={() => openEditForm(item)}
                                className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, descVal)}
                                className="p-1.5 border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Analytics View */
        <div className="space-y-6">
          {/* Timeframe Filter Card */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Timeframe Analytics Filter</h3>
                <p className="text-xs text-slate-400">Select reporting period type and value to configure pie distribution</p>
              </div>
              <select
                value={analysisPeriod}
                onChange={(e) => setAnalysisPeriod(e.target.value)}
                className="border border-slate-200 rounded-lg py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-none focus:border-slate-400 font-semibold cursor-pointer"
              >
                <option value="daily">Daily View</option>
                <option value="monthly">Monthly View</option>
                <option value="quarterly">Quarterly View</option>
                <option value="yearly">Yearly View</option>
              </select>
            </div>

            {/* Dynamic selectors based on filter type */}
            <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-150">
              {analysisPeriod === "daily" && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-650">
                  <span>Select Date:</span>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-slate-500 bg-white"
                  />
                </div>
              )}

              {analysisPeriod === "monthly" && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-650">
                  <span>Select Month:</span>
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-slate-500 bg-white"
                  />
                </div>
              )}

              {analysisPeriod === "quarterly" && (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-650">
                    <span>Year:</span>
                    <select
                      value={filterQuarterYear}
                      onChange={(e) => setFilterQuarterYear(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs bg-white focus:outline-none cursor-pointer"
                    >
                      {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()).map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-650">
                    <span>Quarter:</span>
                    <select
                      value={filterQuarter}
                      onChange={(e) => setFilterQuarter(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="Q1">Q1 (Jan - Mar)</option>
                      <option value="Q2">Q2 (Apr - Jun)</option>
                      <option value="Q3">Q3 (Jul - Sep)</option>
                      <option value="Q4">Q4 (Oct - Dec)</option>
                    </select>
                  </div>
                </div>
              )}

              {analysisPeriod === "yearly" && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-650">
                  <span>Year:</span>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs bg-white focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()).map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              )}

              <span className="text-[10px] text-slate-400 ml-auto font-bold uppercase tracking-wider">
                {analyticsItems.length} transactions match period
              </span>
            </div>
          </div>

          {analyticsItems.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-sm">
              <Building2 className="text-slate-200 size-12 mx-auto animate-pulse mb-3" />
              <h5 className="font-bold text-slate-700 text-sm">No transaction data for this timeframe</h5>
              <p className="text-xs text-slate-400 mt-1">Adjust filters or create book keeping entries on the matching dates.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Unified Transaction & Balance Analysis Bar Chart */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-800">Entity Transaction & Net Balance Analysis</h4>
                  <p className="text-xs text-slate-400">Outflows (Paid By) vs Inflows (Paid To) and Net Position per entity</p>
                </div>

                <div className="h-96 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={netDiffData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const pBy = payload[0].value;
                            const pTo = payload[1].value;
                            const netVal = pBy - pTo;
                            return (
                              <div className="bg-white border border-slate-250 rounded-xl p-4 shadow-xl text-xs space-y-2">
                                <p className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-1">{label}</p>
                                <div className="flex justify-between gap-6 text-slate-600">
                                  <span>Outflow (Paid By):</span>
                                  <span className="font-mono font-bold text-indigo-650">₹{pBy.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between gap-6 text-slate-600">
                                  <span>Inflow (Paid To):</span>
                                  <span className="font-mono font-bold text-pink-600">₹{pTo.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="border-t border-slate-100 pt-2 flex justify-between gap-6 font-bold">
                                  <span>Net Position:</span>
                                  <span className={`font-mono ${netVal > 0 ? "text-emerald-600" : netVal < 0 ? "text-red-500" : "text-slate-500"}`}>
                                    {netVal > 0 ? "+" : ""}₹{netVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ChartLegend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="paidBy" fill="#6366f1" radius={[4, 4, 0, 0]} name="Outflow (Paid By)" barSize={24} />
                      <Bar dataKey="paidTo" fill="#ec4899" radius={[4, 4, 0, 0]} name="Inflow (Paid To)" barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Building2 size={16} className="text-slate-500" />
                  <span>{editingItem ? "Edit Transaction Record" : "Add Book Keeping Record"}</span>
                </h4>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Description / Particulars *</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Server hosting renewal, office rent, book keeping fee"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700 font-medium bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Paid To (Recipient) *</label>
                    <input
                      type="text"
                      required
                      value={paidTo}
                      onChange={(e) => setPaidTo(e.target.value)}
                      placeholder="e.g. AWS Cloud, landlord, book keeping firm"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700 font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Paid By (Payer) *</label>
                    <input
                      type="text"
                      required
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      placeholder="e.g. Partner A, selected company, bank account"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700 font-medium bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Amount Paid (INR) *</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 8000"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700 font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700 font-medium bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">WhatsApp Mobile Number (Optional)</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. +919876543210"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700 font-medium bg-white font-mono"
                  />
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-2.5 text-xs border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition-colors cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share / Action preview Modal */}
      <AnimatePresence>
        {isShareModalOpen && sharingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <FileText size={16} className="text-slate-500" />
                  <span>Acknowledgement Preview</span>
                </h4>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Receipt Visual Preview */}
              <div className="p-6 overflow-y-auto max-h-[55vh] flex-1 bg-slate-50/50">
                <div className="bg-white border-2 border-slate-800 p-5 shadow-sm space-y-6 relative overflow-hidden text-slate-700">
                  <div className="absolute top-0 inset-x-0 h-2 bg-slate-800" />

                  <div className="text-center pt-2 space-y-1.5">
                    <h5 className="font-bold text-slate-900 text-sm tracking-wide font-serif">
                      PAYMENT ACKNOWLEDGEMENT
                    </h5>
                    <p className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">
                      Book Keeping & Accounting Services Record
                    </p>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[10px] leading-relaxed">
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase text-[8px]">Paid To (Recipient):</span>
                      <span className="font-bold text-slate-800">{sharingItem.paidTo || "Book Keeping Services"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase text-[8px]">Paid By (Payer):</span>
                      <span className="font-bold text-slate-800">{sharingItem.paidBy || sharingItem.clientName || activeCompanyName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase text-[8px]">Receipt Number:</span>
                      <span className="font-mono text-slate-800 font-semibold">{getBkRefNo(sharingItem)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase text-[8px]">Payment Date:</span>
                      <span className="font-semibold text-slate-800">{sharingItem.date}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div className="space-y-1 text-[10px]">
                    <span className="text-slate-400 font-semibold block uppercase text-[8px]">Description of Particulars:</span>
                    <p className="text-slate-600 font-serif italic text-xs leading-relaxed">
                      {sharingItem.description || sharingItem.serviceDescription || "Book Keeping Services"}
                    </p>
                  </div>

                  <div className="border border-slate-100 rounded-lg overflow-hidden text-[10px]">
                    <div className="bg-slate-50 px-3 py-1.5 font-semibold text-slate-500 flex justify-between border-b border-slate-100">
                      <span>Particulars</span>
                      <span>Amount</span>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Accounting Ledger Entry ({sharingItem.period || "Current Month"})</span>
                        <span className="font-mono">₹{Number(sharingItem.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-100 rounded-xl p-3 flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-800 text-[11px]">Total Paid Amount:</span>
                    <span className="text-slate-800 text-[14px] font-mono">
                      ₹{Number(sharingItem.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions list */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                {/* Main WhatsApp Share as TEXT */}
                <button
                  onClick={() => handleShareToWhatsAppText(sharingItem)}
                  className="flex items-center justify-center gap-1.5 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-0"
                >
                  <Share2 size={16} />
                  <span>Share Text to WhatsApp</span>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloadingPdf}
                    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer text-[10px] font-semibold"
                  >
                    <Download size={14} className="text-red-500 mb-1" />
                    <span>PDF Receipt</span>
                  </button>

                  <button
                    onClick={handleDownloadImage}
                    disabled={isGeneratingImage}
                    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer text-[10px] font-semibold"
                  >
                    <Download size={14} className="text-blue-500 mb-1" />
                    <span>PNG Image</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex flex-col items-center justify-center p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer text-[10px] font-semibold"
                  >
                    <Printer size={14} className="text-slate-500 mb-1" />
                    <span>Print Receipt</span>
                  </button>
                </div>

                {sharingItem.clientPhone ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[10px] text-slate-655 flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Recipient pre-filled:</strong> Direct to WhatsApp <span className="font-mono font-bold text-slate-800">{sharingItem.clientPhone}</span>.
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200/50 rounded-xl p-3 text-[10px] text-slate-500 flex items-start gap-2">
                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>WhatsApp Tip:</strong> Set phone number in edits to auto-route on click.
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-full py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer border-0"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
