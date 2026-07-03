"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Database, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle,
  Clock as ClockIcon,
  X 
} from "lucide-react";
import CollectionList from "@/components/CollectionList";
import FixedExpenses from "@/components/FixedExpenses";
import FinanceChart from "@/components/FinanceChart";
import AiAdvisor from "@/components/AiAdvisor";
import ReminderScheduler from "@/components/ReminderScheduler";
import { dbService, checkDbConnection } from "@/data/firebase";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ledger"); // "ledger" or "analytics"
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isDbOnline, setIsDbOnline] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Time & Clock states
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Alarm & Reminders states
  const [reminders, setReminders] = useState([]);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const alarmIntervalRef = useRef(null);

  // Sync clock every second
  useEffect(() => {
    const tickTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }));
    };
    tickTime();
    const timer = setInterval(tickTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial ledger values
  useEffect(() => {
    const initData = async () => {
      try {
        const connection = await checkDbConnection();
        setIsDbOnline(connection);
        
        const cols = await dbService.getCollections();
        const exps = await dbService.getExpenses();
        
        setCollections(cols);
        setExpenses(exps);
      } catch (err) {
        console.error("Error loading finance records:", err);
        addToast("Failed to load records from database. Using local cache.", "warning");
      } finally {
        setLoading(false);
      }
    };
    initData();

    // Load active reminders
    if (typeof window !== "undefined") {
      const storedRem = localStorage.getItem("bid_reminders");
      if (storedRem) {
        setReminders(JSON.parse(storedRem));
      }
    }
  }, []);

  // Audio tone alerts synthesizer
  const playToneSound = (toneType) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      if (toneType === "beep") {
        // Double Beep
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        
        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        
        setTimeout(() => {
          try {
            const osc2 = ctx.createOscillator();
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(987.77, ctx.currentTime);
            osc2.connect(gainNode);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.15);
          } catch (e) {}
        }, 250);
      } else if (toneType === "retro") {
        // Retro warble
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (toneType === "ascending") {
        // Sweeping ascending sound
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.6);
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        
        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else {
        // Default Chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.35); // A5

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
        osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.35); // D6

        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);

        osc1.connect(gainNode);
        osc2.connect(gainNode);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.7);
        osc2.stop(ctx.currentTime + 0.7);
      }
    } catch (e) {
      console.warn("AudioContext failed or blocked by autoplay rules:", e);
    }
  };

  // Loop alarm sound when activeAlarm is active
  useEffect(() => {
    if (activeAlarm) {
      // Play immediately
      playToneSound(activeAlarm.tone);
      
      // Repeat alert sound every 2 seconds
      alarmIntervalRef.current = setInterval(() => {
        playToneSound(activeAlarm.tone);
      }, 2000);
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [activeAlarm]);

  // Poll for scheduled reminders
  useEffect(() => {
    const reminderChecker = setInterval(() => {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${mins}`;

      let didFired = false;
      const updated = reminders.map(rem => {
        if (!rem.fired && rem.date === dateStr && rem.time === timeStr) {
          setActiveAlarm(rem);
          didFired = true;
          return { ...rem, fired: true };
        }
        return rem;
      });

      if (didFired) {
        saveReminders(updated);
      }
    }, 1000);

    return () => clearInterval(reminderChecker);
  }, [reminders]);

  // Toast notifier helper
  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- REMINDERS WRAPPERS ---
  const saveReminders = (list) => {
    setReminders(list);
    if (typeof window !== "undefined") {
      localStorage.setItem("bid_reminders", JSON.stringify(list));
    }
  };

  const handleAddReminder = (item) => {
    const newList = [...reminders, { ...item, id: Date.now() }];
    saveReminders(newList);
    addToast("Reminder alarm scheduled successfully!");
  };

  const handleDeleteReminder = (id) => {
    const newList = reminders.filter(r => r.id !== id);
    saveReminders(newList);
    addToast("Reminder alarm removed.");
  };

  // --- COLLECTIONS CRUD CALLBACKS ---
  const handleAddCollection = async (payload) => {
    try {
      const newItem = await dbService.addCollection(payload);
      setCollections(prev => [...prev, newItem]);
      addToast(`Collection "${payload.description}" added successfully!`);
    } catch (err) {
      addToast("Failed to save collection entry.", "error");
    }
  };

  const handleUpdateCollection = async (id, payload) => {
    try {
      const updated = await dbService.updateCollection(id, payload);
      setCollections(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
      addToast(`Collection "${payload.description}" updated successfully!`);
    } catch (err) {
      addToast("Failed to update collection entry.", "error");
    }
  };

  const handleDeleteCollection = async (id) => {
    try {
      await dbService.deleteCollection(id);
      setCollections(prev => prev.filter(item => item.id !== id));
      addToast("Collection record deleted.");
    } catch (err) {
      addToast("Failed to delete collection entry.", "error");
    }
  };

  // --- EXPENSES CRUD CALLBACKS ---
  const handleAddExpense = async (payload) => {
    try {
      const newItem = await dbService.addExpense(payload);
      setExpenses(prev => [...prev, newItem]);
      addToast(`Expense "${payload.description}" logged successfully!`);
    } catch (err) {
      addToast("Failed to save expense entry.", "error");
    }
  };

  const handleUpdateExpense = async (id, payload) => {
    try {
      const updated = await dbService.updateExpense(id, payload);
      setExpenses(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
      addToast(`Expense "${payload.description}" updated successfully!`);
    } catch (err) {
      addToast("Failed to update expense entry.", "error");
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await dbService.deleteExpense(id);
      setExpenses(prev => prev.filter(item => item.id !== id));
      addToast("Expense record deleted.");
    } catch (err) {
      addToast("Failed to delete expense entry.", "error");
    }
  };

  // --- SUMMARY CALCULATIONS ---
  const totalCollectionsValue = collections.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpensesValue = expenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const netBalance = totalCollectionsValue - totalExpensesValue;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 relative">
      
      {/* Top Banner Header with logo & live clock */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 mb-8 gap-4">
        
        {/* Left branding */}
        <div className="flex items-center gap-4">
          <img 
            src="/bid.png" 
            alt="BiD Logo" 
            className="w-20 h-20 object-contain shadow-sm rounded-lg bg-white p-1" 
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              BiD Finance Monitor Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Realtime collections ledger and operational expenditures tracking
            </p>
          </div>
        </div>

        {/* Right Info: Separated Live Clock & Date Cards */}
        <div className="flex flex-row items-center gap-3">
          {/* Time Card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2 text-center min-w-[125px]">
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Current Time</p>
            <p className="text-xs font-semibold text-slate-850 tabular-nums flex items-center gap-1.5 justify-center mt-0.5">
              <ClockIcon size={11} className="text-slate-500" />
              <span>{currentTime || "--:--:--"}</span>
            </p>
          </div>

          {/* Date Card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2 text-center min-w-[155px]">
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Date</p>
            <p className="text-xs font-semibold text-slate-850 mt-0.5 whitespace-nowrap">
              {currentDate || "Loading Date..."}
            </p>
          </div>
        </div>

      </header>

      {loading ? (
        /* Loading Spinner */
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Fetching ledger records...</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Collections Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-md rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-100">Total Collections</p>
                <h3 className="text-2xl font-bold text-white">
                  ₹{totalCollectionsValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-white/20 text-white rounded-xl">
                <TrendingUp size={20} />
              </div>
            </div>

            {/* Total Fixed Expenses Card */}
            <div className="bg-gradient-to-br from-rose-500 to-red-650 text-white border-0 shadow-md rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-100">Fixed Expenses</p>
                <h3 className="text-2xl font-bold text-white">
                  ₹{totalExpensesValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-white/20 text-white rounded-xl">
                <TrendingDown size={20} />
              </div>
            </div>

            {/* Net Operation Balance Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white border-0 shadow-md rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Net Surplus</p>
                <h3 className="text-2xl font-bold text-white">
                  ₹{netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="p-3 bg-white/10 text-slate-200 rounded-xl">
                <IndianRupee size={20} />
              </div>
            </div>
          </div>

          {/* Top Tab Selection Header Bar with Out-Of-Box Sliding Pill Animation */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl max-w-md w-full relative">
            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex-1 py-2 text-xs uppercase font-bold tracking-wider rounded-lg transition-colors duration-200 relative cursor-pointer ${
                activeTab === "ledger" ? "text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {activeTab === "ledger" && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-slate-900 rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Transaction Ledger</span>
            </button>
            
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-2 text-xs uppercase font-bold tracking-wider rounded-lg transition-colors duration-200 relative cursor-pointer ${
                activeTab === "analytics" ? "text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {activeTab === "analytics" && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-slate-900 rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">AI Analytics & Alerts</span>
            </button>
          </div>

          {/* Tab Views Contents */}
          <div>
            <AnimatePresence mode="wait">
              {activeTab === "ledger" ? (
                <motion.div
                  key="ledger"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
                >
                  <CollectionList
                    items={collections}
                    onAdd={handleAddCollection}
                    onUpdate={handleUpdateCollection}
                    onDelete={handleDeleteCollection}
                  />
                  <FixedExpenses
                    items={expenses}
                    onAdd={handleAddExpense}
                    onUpdate={handleUpdateExpense}
                    onDelete={handleDeleteExpense}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  {/* Monthly Comparison Graph */}
                  <FinanceChart 
                    collections={collections} 
                    expenses={expenses} 
                  />

                  {/* AI Analysis and Alarm Scheduler */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <AiAdvisor 
                        collections={collections} 
                        expenses={expenses} 
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <ReminderScheduler 
                        reminders={reminders}
                        onAddReminder={handleAddReminder}
                        onDeleteReminder={handleDeleteReminder}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* Alarm Reminder Popups Overlay */}
      <AnimatePresence>
        {activeAlarm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xl p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <ClockIcon size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">BiD Alarm Triggered</h4>
                <p className="text-xs text-slate-400">Scheduled task time is due!</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 text-xs font-semibold leading-relaxed">
                {activeAlarm.description}
              </div>
              <button
                onClick={() => {
                  setActiveAlarm(null);
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Dismiss Alarm
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications System */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className={`flex items-center justify-between p-3.5 rounded-lg shadow-lg border text-xs font-semibold bg-white ${
                toast.type === "success" 
                  ? "border-emerald-100 text-slate-800" 
                  : "border-amber-100 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === "success" ? (
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
