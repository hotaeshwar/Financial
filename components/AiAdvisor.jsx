"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Send } from "lucide-react";

export default function AiAdvisor({ collections = [], expenses = [] }) {
  const [askQuery, setAskQuery] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [typingText, setTypingText] = useState("");
  const chatContainerRef = useRef(null);

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
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
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

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-5 flex flex-col justify-between h-full">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
          <Sparkles size={14} className="text-yellow-400 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">BiD AI Financial Advisor</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Realtime budget evaluations</p>
        </div>
      </div>

      {/* Typing commentary */}
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-line min-h-[120px] max-h-[160px] overflow-y-auto custom-scrollbar">
        {typingText}
        {typingText.length < generateBrief().length && (
          <span className="inline-block w-1 h-3 bg-slate-400 animate-pulse ml-0.5" />
        )}
      </div>

      {/* Mini Chat logs */}
      <div 
        ref={chatContainerRef} 
        className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar border-t border-slate-100 pt-3"
      >
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
    </div>
  );
}
