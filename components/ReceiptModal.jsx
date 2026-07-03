"use client";

import { useState, useRef } from "react";
import { X, Download, Printer, Share2, IndianRupee, Calendar, Tag, FileText, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";

export default function ReceiptModal({ isOpen, onClose, item, type }) {
  const [isSharing, setIsSharing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const canvasRef = useRef(null);

  if (!isOpen || !item) return null;

  // Format Reference Number deterministically: BiDyear/month/date-serial
  const getRefNo = () => {
    let y = "2026", m = "07", d = "03";
    if (item.date) {
      const parts = item.date.split("-");
      if (parts.length === 3) {
        [y, m, d] = parts;
      } else {
        const dateObj = new Date(item.date);
        if (!isNaN(dateObj.getTime())) {
          y = String(dateObj.getFullYear());
          m = String(dateObj.getMonth() + 1).padStart(2, "0");
          d = String(dateObj.getDate()).padStart(2, "0");
        }
      }
    }
    // Deterministic 4-digit serial based on unique ID or description
    let hash = 0;
    const str = item.id || item.description || "";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const serial = Math.abs(hash % 9000) + 1000;
    return `BiD${y}/${m}/${d}-${serial}`;
  };

  const refNo = getRefNo();
  const formattedAmount = Number(item.amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isCompleted = 
    item.status?.toLowerCase() === "paid" || 
    item.status?.toLowerCase() === "received";

  // Helper function to draw on HTML5 Canvas
  const drawReceiptOnCanvas = (ctx, logoImg) => {
    // Clear with background color
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 780);

    // Card border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, 570, 750);

    // Dash inner border line
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(25, 25, 550, 730);
    ctx.setLineDash([]); // reset

    // Logo drawing (centered)
    if (logoImg) {
      ctx.drawImage(logoImg, 260, 45, 80, 80);
    }

    // Header title
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BiD Finance", 300, 165);

    // Subtitle
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillText("OFFICIAL TRANSACTION RECEIPT", 300, 190);

    // Dashed separator line 1
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(50, 220);
    ctx.lineTo(550, 220);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Detail rows layout
    const startX = 60;
    const detailsYStart = 265;
    const rowGap = 35;

    const drawDetailRow = (label, val, y) => {
      // Label
      ctx.textAlign = "left";
      ctx.fillStyle = "#64748b";
      ctx.font = "14px system-ui, -apple-system, sans-serif";
      ctx.fillText(label, startX, y);

      // Value
      ctx.textAlign = "right";
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
      ctx.fillText(val, 540, y);
    };

    drawDetailRow("Reference No:", refNo, detailsYStart);
    drawDetailRow("Date:", item.date || "N/A", detailsYStart + rowGap);
    drawDetailRow("Category:", type === "collection" ? "Collection / Income" : "Fixed Expense", detailsYStart + rowGap * 2);
    drawDetailRow("Description:", item.description || "N/A", detailsYStart + rowGap * 3);
    drawDetailRow("Payment Status:", item.status || "N/A", detailsYStart + rowGap * 4);

    // Dashed separator line 2
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(50, 465);
    ctx.lineTo(550, 465);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Total Amount Title
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText("TOTAL AMOUNT", 300, 505);

    // Total Amount Value
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
    ctx.fillText(`₹${formattedAmount}`, 300, 555);

    // Status Badge Draw
    const statusText = item.status?.toUpperCase() || "";
    ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
    const textWidth = ctx.measureText(statusText).width;
    
    const badgeW = Math.max(textWidth + 24, 110);
    const badgeH = 28;
    const badgeX = 300 - badgeW / 2;
    const badgeY = 580;

    ctx.fillStyle = isCompleted ? "#dcfce7" : "#fef3c7";
    // Rounded rect support
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
    } else {
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    }

    ctx.fillStyle = isCompleted ? "#15803d" : "#b45309";
    ctx.textAlign = "center";
    ctx.fillText(statusText, 300, 598);

    // Dashed separator line 3
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(50, 650);
    ctx.lineTo(550, 650);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Footer Notes
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillText("Thank you for using BiD Finance", 300, 685);
    
    ctx.font = "9px system-ui, -apple-system, sans-serif";
    ctx.fillText("This is a system generated transaction receipt and does not require a physical signature.", 300, 705);
  };

  // Convert receipt to PDF and Share via WhatsApp/System native sharing
  const handleSharePDFToWhatsApp = async () => {
    setIsSharing(true);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsSharing(false);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsSharing(false);
      return;
    }

    // Load logo image
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = "/bid.png";

    const sharePDF = async () => {
      try {
        drawReceiptOnCanvas(ctx, logoImg);
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: [400, 520],
        });

        pdf.addImage(imgData, "PNG", 0, 0, 400, 520);
        
        const fileName = `receipt_${refNo.replace(/\//g, "_")}.pdf`;
        const pdfBlob = pdf.output("blob");
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });

        // If native sharing is supported with files, trigger it (perfect for WhatsApp on mobile)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `BiD Receipt - ${refNo}`,
            text: `Please find the attached receipt for ${item.description}`,
          });
        } else {
          // Fallback for Desktop/Non-supported browsers:
          // 1. Download the PDF directly
          pdf.save(fileName);

          // 2. Open WhatsApp web with structured details
          const statusEmoji = isCompleted ? "✅" : "⏳";
          const typeText = type === "collection" ? "COLLECTION RECEIPT" : "EXPENSE RECEIPT";
          
          const message = 
            `*${typeText}*\n` +
            `=========================\n` +
            `🏢 *BiD Finance*\n` +
            `=========================\n\n` +
            `📄 *Receipt Ref:* \`${refNo}\`\n` +
            `📅 *Date:* ${item.date}\n` +
            `💼 *Category:* ${type === "collection" ? "Incoming Payment" : "Fixed Expense"}\n` +
            `📝 *Description:* ${item.description}\n` +
            `💰 *Amount:* ₹${formattedAmount}\n` +
            `📊 *Status:* ${statusEmoji} *${item.status?.toUpperCase()}*\n\n` +
            `-------------------------\n` +
            `📥 *PDF Receipt downloaded.* Please drag/attach the downloaded file \`${fileName}\` here to share.`;
            
          const encoded = encodeURIComponent(message);
          window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
        }
      } catch (err) {
        console.error("PDF share failed:", err);
        alert("Failed to share PDF receipt. Try downloading it instead.");
      } finally {
        setIsSharing(false);
      }
    };

    logoImg.onload = () => {
      sharePDF();
    };

    logoImg.onerror = () => {
      sharePDF();
    };
  };

  // Generate and download receipt as PDF file
  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsGeneratingPDF(false);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsGeneratingPDF(false);
      return;
    }

    // Load logo image
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = "/bid.png";

    const savePDF = () => {
      try {
        drawReceiptOnCanvas(ctx, logoImg);
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: [400, 520],
        });

        pdf.addImage(imgData, "PNG", 0, 0, 400, 520);
        pdf.save(`receipt_${refNo.replace(/\//g, "_")}.pdf`);
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Failed to export PDF receipt.");
      } finally {
        setIsGeneratingPDF(false);
      }
    };

    logoImg.onload = () => {
      savePDF();
    };

    logoImg.onerror = () => {
      savePDF();
    };
  };

  // Render HTML5 Canvas to PNG and download
  const handleDownloadImage = () => {
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

    // Load logo image
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = "/bid.png";

    const savePNG = () => {
      try {
        drawReceiptOnCanvas(ctx, logoImg);
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt_${refNo.replace(/\//g, "_")}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error("Canvas export failed:", err);
        alert("Failed to export receipt image.");
      } finally {
        setIsGeneratingImage(false);
      }
    };

    logoImg.onload = () => {
      savePNG();
    };

    logoImg.onerror = () => {
      savePNG();
    };
  };

  // Printing the receipt
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${refNo}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: white;
              color: #0f172a;
              padding: 40px;
              margin: 0;
              display: flex;
              justify-content: center;
            }
            .receipt {
              width: 450px;
              border: 1px dashed #cbd5e1;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02);
            }
            .logo-container {
              text-align: center;
              margin-bottom: 15px;
            }
            .logo {
              width: 80px;
              height: 80px;
              object-fit: contain;
              background: #fff;
              padding: 4px;
              border-radius: 8px;
              border: 1px solid #f1f5f9;
            }
            .title {
              font-size: 22px;
              font-weight: bold;
              text-align: center;
              margin: 5px 0;
              color: #0f172a;
            }
            .subtitle {
              font-size: 10px;
              font-weight: 800;
              color: #64748b;
              text-align: center;
              letter-spacing: 1.5px;
              margin-bottom: 25px;
            }
            .divider {
              border-top: 2px dashed #e2e8f0;
              margin: 20px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 12px 0;
              font-size: 14px;
            }
            .label {
              color: #64748b;
            }
            .value {
              font-weight: 600;
              color: #1e293b;
            }
            .amount-container {
              text-align: center;
              margin: 25px 0;
            }
            .amount-label {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .amount {
              font-size: 34px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 5px;
            }
            .badge {
              display: inline-block;
              padding: 5px 14px;
              font-size: 11px;
              font-weight: bold;
              border-radius: 6px;
              margin-top: 10px;
              text-transform: uppercase;
            }
            .badge-completed {
              background-color: #dcfce7;
              color: #15803d;
              border: 1px solid #bbf7d0;
            }
            .badge-pending {
              background-color: #fef3c7;
              color: #b45309;
              border: 1px solid #fde68a;
            }
            .footer {
              font-size: 11px;
              color: #94a3b8;
              text-align: center;
              margin-top: 30px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo-container">
              <img class="logo" src="/bid.png" alt="BiD Logo" />
            </div>
            <div class="title">BiD Finance</div>
            <div class="subtitle">OFFICIAL TRANSACTION RECEIPT</div>
            
            <div class="divider"></div>
            
            <div class="row">
              <span class="label">Reference No:</span>
              <span class="value">${refNo}</span>
            </div>
            <div class="row">
              <span class="label">Date:</span>
              <span class="value">${item.date}</span>
            </div>
            <div class="row">
              <span class="label">Category:</span>
              <span class="value">${type === "collection" ? "Collection / Income" : "Fixed Expense"}</span>
            </div>
            <div class="row">
              <span class="label">Description:</span>
              <span class="value">${item.description}</span>
            </div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="value">${item.status}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="amount-container">
              <div class="amount-label">Total Amount</div>
              <div class="amount">${formattedAmount}</div>
              <div class="badge ${isCompleted ? "badge-completed" : "badge-pending"}">
                ${item.status}
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
              Thank you for using BiD Finance<br/>
              This is a system generated transaction receipt and does not require physical signature.
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      {/* Offscreen Canvas for rendering the images and PDFs */}
      <canvas
        ref={canvasRef}
        width="600"
        height="780"
        className="hidden"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <FileText size={16} className="text-slate-500" />
            <span>Transaction Receipt</span>
          </h4>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Receipt layout representation */}
        <div className="p-6 overflow-y-auto max-h-[60vh] flex-1 bg-slate-50/50">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-5 relative overflow-hidden">
            {/* Logo and Brand */}
            <div className="flex flex-col items-center text-center space-y-2">
              <img
                src="/bid.png"
                alt="BiD Logo"
                className="w-16 h-16 object-contain bg-slate-50 p-1 rounded-lg border border-slate-100"
              />
              <div>
                <h5 className="font-bold text-slate-800 text-base">BiD Finance</h5>
                <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                  Official Transaction Receipt
                </p>
              </div>
            </div>

            {/* Dashed line */}
            <div className="border-t-2 border-dashed border-slate-200" />

            {/* Details list */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference No:</span>
                <span className="font-semibold text-slate-700 font-mono text-[11px]">
                  {refNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  {item.date}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-slate-700">
                  {type === "collection" ? "Collection / Income" : "Fixed Expense"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span className="font-semibold text-slate-700 max-w-[200px] truncate text-right">
                  {item.description}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment Status:</span>
                <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${
                  isCompleted
                    ? "bg-emerald-50 border-emerald-200/50 text-emerald-700"
                    : item.status?.toLowerCase() === "unpaid"
                    ? "bg-rose-50 border-rose-200/50 text-rose-700"
                    : "bg-amber-50 border-amber-200/50 text-amber-700"
                }`}>
                  {item.status}
                </span>
              </div>
            </div>

            {/* Dashed line */}
            <div className="border-t-2 border-dashed border-slate-200" />

            {/* Total Amount Panel */}
            <div className="text-center py-2">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Amount</p>
              <h3 className="text-3xl font-extrabold text-slate-800 flex items-center justify-center gap-0.5 mt-1">
                <IndianRupee size={22} className="text-slate-700" />
                <span>{formattedAmount}</span>
              </h3>
              
              <div className="flex justify-center mt-3">
                <span className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  isCompleted 
                    ? "bg-emerald-500/10 text-emerald-600" 
                    : "bg-amber-500/10 text-amber-600"
                }`}>
                  {isCompleted ? <CheckCircle size={11} /> : <Clock size={11} />}
                  <span>{item.status}</span>
                </span>
              </div>
            </div>

            {/* Watermark-like note */}
            <p className="text-[9px] text-slate-400 text-center leading-relaxed">
              This receipt is automatically generated by the BiD Finance platform.<br />
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          {/* Main WhatsApp PDF button */}
          <button
            onClick={handleSharePDFToWhatsApp}
            disabled={isSharing}
            className="flex items-center justify-center gap-1.5 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Convert to PDF and Share on WhatsApp"
          >
            <Share2 size={16} />
            <span>{isSharing ? "Sharing PDF Receipt..." : "Share PDF to WhatsApp"}</span>
          </button>

          {/* Action grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex flex-col items-center justify-center p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer text-[10px] font-semibold"
              title="Download PDF file"
            >
              <Download size={14} className="text-red-500 mb-1" />
              <span>PDF File</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="flex flex-col items-center justify-center p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer text-[10px] font-semibold"
              title="Download PNG image"
            >
              <Download size={14} className="text-blue-500 mb-1" />
              <span>PNG Image</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex flex-col items-center justify-center p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer text-[10px] font-semibold"
              title="Print standard copy"
            >
              <Printer size={14} className="text-slate-500 mb-1" />
              <span>Print/PDF</span>
            </button>
          </div>

          {/* User tips */}
          <div className="bg-slate-100 border border-slate-200/50 rounded-xl p-3 text-[10px] text-slate-600 leading-relaxed">
            💡 <strong>WhatsApp Sharing:</strong> On mobile devices, <strong>Share PDF to WhatsApp</strong> will prompt the native app directly. On desktop computers, it downloads the PDF file and opens WhatsApp so you can drag-and-drop the PDF.
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
