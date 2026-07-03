"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Bot, User, HelpCircle, CheckCircle, Share2, FileText, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AiAdvisor({ collections = [], expenses = [] }) {
  const [askQuery, setAskQuery] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [typingText, setTypingText] = useState("");
  const chatEndRef = useRef(null);

  // Export PDF states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [includeChat, setIncludeChat] = useState(true);

  // Computations
  const totalCols = collections.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExps = expenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const netSurplus = totalCols - totalExps;

  // Generate dynamic brief
  const generateBrief = () => {
    return `Hello. Here is the financial audit summary from BiD AI:
    
- Total Collections stand at ₹${totalCols.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.
- Total Fixed Expenses sum to ₹${totalExps.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.
- Operating surplus is ₹${netSurplus.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.

${netSurplus < 0 ? "Warning: You are running an operational deficit. Consider cutting recurring fixed items immediately." : "Status: Liquid capital is secure. Recommend allocating a portion of surplus to short-term savings."}`;
  };

  useEffect(() => {
    const brief = generateBrief();
    let idx = 0;
    setTypingText("");
    const interval = setInterval(() => {
      if (idx < brief.length) {
        setTypingText(brief.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 12);

    setChatLog([
      {
        sender: "bot",
        text: "System Online. Ask me anything about your current Collections, Fixed Expenses, Net Surplus, or budgeting ideas."
      }
    ]);

    return () => clearInterval(interval);
  }, [collections, expenses]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  const handleAskAI = (e) => {
    e.preventDefault();
    if (!askQuery.trim()) return;

    const userMsg = askQuery.trim();
    setChatLog(prev => [...prev, { sender: "user", text: userMsg }]);
    setAskQuery("");

    setTimeout(() => {
      const q = userMsg.toLowerCase();
      let answer = "";

      if (q.includes("balance") || q.includes("surplus") || q.includes("net") || q.includes("operating")) {
        answer = `Your Net Operating Surplus is currently ₹${netSurplus.toLocaleString("en-IN")}. This is calculated as Collections (₹${totalCols.toLocaleString("en-IN")}) minus Expenses (₹${totalExps.toLocaleString("en-IN")}).`;
      } else if (q.includes("expense") || q.includes("spending") || q.includes("spend")) {
        answer = `Total logged fixed expenses amount to ₹${totalExps.toLocaleString("en-IN")} across ${expenses.length} invoices.`;
      } else if (q.includes("collection") || q.includes("revenue") || q.includes("receive")) {
        answer = `Total collections logged sum to ₹${totalCols.toLocaleString("en-IN")} across ${collections.length} entries.`;
      } else if (q.includes("suggest") || q.includes("budget") || q.includes("save") || q.includes("cut")) {
        answer = `Financial Tips: 1. Audit recurring fixed expenses to identify unused cloud or rent operations. 2. Establish automatic milestone invoicing to shorten collection payment windows.`;
      } else {
        answer = `Understood. Based on database values: net surplus is ₹${netSurplus.toLocaleString("en-IN")}, collections total ₹${totalCols.toLocaleString("en-IN")}, and fixed expenses total ₹${totalExps.toLocaleString("en-IN")}.`;
      }

      setChatLog(prev => [...prev, { sender: "bot", text: answer }]);
    }, 600);
  };

  const executeExport = (e) => {
    e.preventDefault();
    setIsExportModalOpen(false);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export the report.");
      return;
    }

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const isSurplusPositive = netSurplus >= 0;

    let chatHtml = "";
    if (includeChat && chatLog.length > 1) {
      chatHtml = `
        <div class="section">
          <h2 class="section-title">Advisory Discussion Transcript</h2>
          <div class="chat-transcript">
            ${chatLog
              .filter(chat => chat.text !== "System Online. Ask me anything about your current Collections, Fixed Expenses, Net Surplus, or budgeting ideas.")
              .map(chat => `
                <div class="chat-msg ${chat.sender}">
                  <div class="msg-meta">${chat.sender === "user" ? "Client Query" : "AI Advisor Response"}</div>
                  <div class="msg-text">${chat.text}</div>
                </div>
              `).join("")}
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Advisory Report - ${clientName || "Client"}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            padding: 40px;
            margin: 0;
            background-color: #ffffff;
          }

          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .logo-area h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            color: #0f172a;
            letter-spacing: -0.025em;
          }

          .logo-area p {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #64748b;
            margin: 4px 0 0 0;
            font-weight: 600;
          }

          .meta-area {
            text-align: right;
            font-size: 12px;
            color: #475569;
          }

          .meta-area div {
            margin-bottom: 4px;
          }

          .meta-label {
            font-weight: 600;
            color: #64748b;
            font-size: 10px;
            text-transform: uppercase;
          }

          .grid-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 35px;
          }

          .card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            background-color: #f8fafc;
          }

          .card-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 6px;
          }

          .card-value {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            font-family: 'JetBrains Mono', monospace;
          }

          .card.surplus {
            background-color: ${isSurplusPositive ? "#f0fdf4" : "#fef2f2"};
            border-color: ${isSurplusPositive ? "#bbf7d0" : "#fecaca"};
          }

          .card.surplus .card-value {
            color: ${isSurplusPositive ? "#15803d" : "#b91c1c"};
          }

          .section {
            margin-bottom: 35px;
            page-break-inside: avoid;
          }

          .section-title {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 700;
            color: #334155;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 15px;
          }

          .commentary-box {
            background-color: #f8fafc;
            border-left: 3px solid #0f172a;
            padding: 15px;
            font-size: 13px;
            color: #334155;
            white-space: pre-line;
            line-height: 1.6;
            border-radius: 0 8px 8px 0;
          }

          .chat-transcript {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .chat-msg {
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            max-width: 95%;
          }

          .chat-msg.user {
            background-color: #f1f5f9;
            border: 1px solid #e2e8f0;
            align-self: flex-start;
          }

          .chat-msg.bot {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            align-self: flex-start;
            border-left: 3px solid #0f172a;
          }

          .msg-meta {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 4px;
          }

          .msg-text {
            color: #334155;
          }

          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            page-break-inside: avoid;
          }

          .sig-box {
            width: 200px;
            border-top: 1px solid #cbd5e1;
            text-align: center;
            padding-top: 8px;
            font-size: 11px;
            color: #64748b;
          }

          .footer {
            margin-top: 50px;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <h1>BiD AI Financial Monitor</h1>
            <p>Wealth & Budget Intelligence Report</p>
          </div>
          <div class="meta-area">
            <div><span class="meta-label">Date:</span> ${today}</div>
            ${clientName ? `<div><span class="meta-label">Prepared For:</span> ${clientName}</div>` : ""}
            ${advisorName ? `<div><span class="meta-label">Prepared By:</span> ${advisorName}</div>` : ""}
          </div>
        </div>

        <div class="grid-summary">
          <div class="card">
            <div class="card-label">Total Collections</div>
            <div class="card-value">₹${totalCols.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-label">Total Fixed Expenses</div>
            <div class="card-value">₹${totalExps.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="card surplus">
            <div class="card-label">Net Operating Surplus</div>
            <div class="card-value">₹${netSurplus.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Executive Commentary & Audit Analysis</h2>
          <div class="commentary-box">${generateBrief().replace("Hello. Here is the financial audit summary from BiD AI:\n\n", "")}</div>
        </div>

        ${chatHtml}

        <div class="signatures">
          <div class="sig-box">Client Signature</div>
          <div class="sig-box">Advisor Signature</div>
        </div>

        <div class="footer">
          Confidential financial report generated via BiD AI Advisor. This document is intended solely for the recipient client.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-5 flex flex-col justify-between h-full">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Sparkles size={14} className="text-yellow-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">BiD AI Financial Advisor</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Realtime budget evaluations</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-[10px] py-1.5 px-2.5 rounded-lg transition-colors border border-slate-200/50 cursor-pointer shadow-sm"
          title="Share report with client as PDF"
        >
          <Share2 size={11} />
          <span>Share PDF</span>
        </button>
      </div>

      {/* Typing commentary */}
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-line min-h-[120px] max-h-[160px] overflow-y-auto custom-scrollbar">
        {typingText}
        {typingText.length < generateBrief().length && (
          <span className="inline-block w-1 h-3 bg-slate-400 animate-pulse ml-0.5" />
        )}
      </div>

      {/* Mini Chat logs */}
      <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar border-t border-slate-100 pt-3">
        {chatLog.map((chat, idx) => (
          <div key={idx} className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg p-2 text-xs font-light ${
              chat.sender === "user" 
                ? "bg-slate-900 text-white" 
                : "bg-slate-100 text-slate-700 border border-slate-200/50"
            }`}>
              <p className="font-semibold text-[8px] uppercase tracking-wider opacity-60 mb-0.5">
                {chat.sender === "user" ? "User Query" : "BiD AI Core"}
              </p>
              <p className="leading-normal">{chat.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Query input box */}
      <form onSubmit={handleAskAI} className="flex gap-2">
        <input
          type="text"
          value={askQuery}
          onChange={(e) => setAskQuery(e.target.value)}
          placeholder="Ask AI: e.g. What is my operating balance?"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
        />
        <button
          type="submit"
          className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Send size={13} />
        </button>
      </form>

      {/* Export Report Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                  <FileText size={16} className="text-slate-600" />
                  <span>Export Financial Report</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={executeExport} className="p-5 space-y-4">
                {/* Client Name */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. John Doe (Optional)"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                  />
                </div>

                {/* Advisor Name */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Advisor Name / Company
                  </label>
                  <input
                    type="text"
                    value={advisorName}
                    onChange={(e) => setAdvisorName(e.target.value)}
                    placeholder="e.g. BiD Wealth Advisors (Optional)"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                  />
                </div>

                {/* Include Chat transcript option */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="includeChat"
                    checked={includeChat}
                    onChange={(e) => setIncludeChat(e.target.checked)}
                    className="w-3.5 h-3.5 border border-slate-200 rounded accent-slate-900 cursor-pointer"
                  />
                  <label htmlFor="includeChat" className="text-xs text-slate-600 cursor-pointer select-none">
                    Include Chat Transcript
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="flex-1 py-2 text-xs border border-slate-200 hover:bg-slate-50 text-slate-500 font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Generate PDF</span>
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
