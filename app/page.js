"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  X,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  Building2,
  ChevronDown,
  Plus,
  Trash2,
  Edit3,
  Calendar
} from "lucide-react";
import CollectionList from "@/components/CollectionList";
import FixedExpenses from "@/components/FixedExpenses";
import FinanceChart from "@/components/FinanceChart";
import AiAdvisor from "@/components/AiAdvisor";
import ReminderScheduler from "@/components/ReminderScheduler";
import Bookkeeping from "@/components/Bookkeeping";
import { dbService, checkDbConnection } from "@/data/firebase";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ledger"); // "ledger", "analytics" or "bookkeeping"
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [bookkeepings, setBookkeepings] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [isDbOnline, setIsDbOnline] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [activeLedgerTab, setActiveLedgerTab] = useState("collections"); // "collections" or "expenses"

  const [isMounted, setIsMounted] = useState(false);

  // Time & Clock states
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Alarm & Reminders states
  const [reminders, setReminders] = useState([]);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [isAutoAlarmMuted, setIsAutoAlarmMuted] = useState(false);
  const [isAutoBannerDismissed, setIsAutoBannerDismissed] = useState(false);
  const alarmIntervalRef = useRef(null);
  const autoAlarmIntervalRef = useRef(null);

  // Weather & Greeting states
  const [greeting, setGreeting] = useState("Hello");
  const [weather, setWeather] = useState({
    city: "",
    temp: null,
    code: null
  });

  // --- FILTERED COLLECTIONS & EXPENSES BY ACTIVE COMPANY ---
  const activeCollections = useMemo(() => {
    return collections.filter(c => c.companyId === selectedCompanyId);
  }, [collections, selectedCompanyId]);

  const activeExpenses = useMemo(() => {
    return expenses.filter(e => e.companyId === selectedCompanyId);
  }, [expenses, selectedCompanyId]);

  const activeBookkeepings = useMemo(() => {
    return bookkeepings.filter(b => b.companyId === selectedCompanyId);
  }, [bookkeepings, selectedCompanyId]);

  // Scan for collections due today or overdue
  const dueCollections = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    return activeCollections.filter(col => {
      const isPending = col.status?.toLowerCase() === "pending" || col.status?.toLowerCase() === "partial payment";
      return isPending && col.date <= todayStr;
    });
  }, [activeCollections]);

  // Sync clock every second
  useEffect(() => {
    setIsMounted(true);
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
        
        // Fetch companies
        let comps = await dbService.getCompanies();
        if (!comps || comps.length === 0) {
          const defaultComp = await dbService.addCompany({
            name: "Main Company",
            createdAt: new Date().toISOString()
          });
          comps = [defaultComp];
        }
        setCompanies(comps);
        
        const activeCompId = comps[0]?.id;
        setSelectedCompanyId(activeCompId);
        
        // Fetch collections, expenses and bookkeeping records
        const cols = await dbService.getCollections();
        const exps = await dbService.getExpenses();
        const bks = await dbService.getBookkeepings ? await dbService.getBookkeepings() : [];
        
        // Ensure all existing items have a companyId
        const mappedCols = cols.map(c => c.companyId ? c : { ...c, companyId: activeCompId });
        const mappedExps = exps.map(e => e.companyId ? e : { ...e, companyId: activeCompId });
        const mappedBks = bks.map(b => b.companyId ? b : { ...b, companyId: activeCompId });
        
        setCollections(mappedCols);
        setExpenses(mappedExps);
        setBookkeepings(mappedBks);
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

  const getWeatherIcon = (code) => {
    if (code === null || code === undefined) return <Sun size={12} className="text-amber-500" />;
    if (code === 0) return <Sun size={12} className="text-amber-500 animate-spin-slow" />;
    if (code === 1 || code === 2) return <CloudSun size={12} className="text-slate-400" />;
    if (code === 3 || code === 45 || code === 48) return <Cloud size={12} className="text-slate-400" />;
    if (code >= 51 && code <= 57) return <CloudDrizzle size={12} className="text-blue-400" />;
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={12} className="text-blue-500" />;
    if (code >= 71 && code <= 77) return <Snowflake size={12} className="text-sky-300" />;
    if (code >= 95) return <CloudLightning size={12} className="text-yellow-500 animate-bounce" />;
    return <Sun size={12} className="text-amber-500" />;
  };

  // Set time-based greeting and fetch weather/location
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) setGreeting("Good morning");
    else if (hr >= 12 && hr < 17) setGreeting("Good afternoon");
    else if (hr >= 17 && hr < 21) setGreeting("Good evening");
    else setGreeting("Hey there");

    const fetchWeather = async (lat, lon, cityName) => {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const weatherData = await weatherRes.json();
        if (weatherData && weatherData.current_weather) {
          setWeather({
            city: cityName,
            temp: Math.round(weatherData.current_weather.temperature),
            code: weatherData.current_weather.weathercode
          });
        }
      } catch (err) {
        console.error("Error fetching weather data:", err);
      }
    };

    const getGeoAndWeather = async () => {
      // 1. Try Free IP API first (silent, no permission popup, accurate to city level)
      try {
        const ipRes = await fetch("https://freeipapi.com/api/json");
        const ipData = await ipRes.json();
        if (ipData && ipData.latitude && ipData.longitude) {
          await fetchWeather(ipData.latitude, ipData.longitude, ipData.cityName || "your area");
          return;
        }
      } catch (e) {
        console.warn("FreeIPAPI failed, trying ipapi.co fallback:", e.message);
      }

      // 2. Try ipapi.co as secondary silent fallback
      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        const ipData = await ipRes.json();
        if (ipData && ipData.latitude && ipData.longitude) {
          await fetchWeather(ipData.latitude, ipData.longitude, ipData.city || "your area");
          return;
        }
      } catch (e) {
        console.warn("ipapi.co fallback failed:", e.message);
      }

      // 3. Fallback to browser GPS geolocation if both silent options fail
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            let city = "your area";
            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const geoData = await geoRes.json();
              if (geoData && geoData.address) {
                city = geoData.address.city || geoData.address.town || geoData.address.village || "your area";
              }
            } catch (e) {
              console.warn("Reverse geocode failed, using default");
            }
            await fetchWeather(latitude, longitude, city);
          },
          (error) => {
            console.warn("All geolocation options failed:", error.message);
          },
          { timeout: 5000 }
        );
      }
    };

    getGeoAndWeather();
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
      } else if (toneType === "digital") {
        // Digital Alarm (rapid high-pitched beeps)
        const playBeep = (delay) => {
          setTimeout(() => {
            try {
              const osc = ctx.createOscillator();
              const beepGain = ctx.createGain();
              beepGain.connect(ctx.destination);
              osc.type = "square";
              osc.frequency.setValueAtTime(2048, ctx.currentTime);
              beepGain.gain.setValueAtTime(0.12, ctx.currentTime);
              beepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
              osc.connect(beepGain);
              osc.start();
              osc.stop(ctx.currentTime + 0.1);
            } catch (e) {}
          }, delay);
        };
        playBeep(0);
        playBeep(200);
        playBeep(400);
      } else if (toneType === "zen") {
        // Zen Bowl (low frequency deep wave with a high harmonic overtone)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(160, ctx.currentTime);
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(320, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.2);
        osc2.stop(ctx.currentTime + 1.2);
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

  // Loop warning sound automatically when there are due collections and not muted
  useEffect(() => {
    if (dueCollections.length > 0 && !isAutoAlarmMuted && !isAutoBannerDismissed) {
      // Play immediately
      playToneSound("beep");
      
      // Repeat alert sound every 3 seconds
      autoAlarmIntervalRef.current = setInterval(() => {
        playToneSound("beep");
      }, 3000);
    } else {
      if (autoAlarmIntervalRef.current) {
        clearInterval(autoAlarmIntervalRef.current);
        autoAlarmIntervalRef.current = null;
      }
    }

    return () => {
      if (autoAlarmIntervalRef.current) {
        clearInterval(autoAlarmIntervalRef.current);
        autoAlarmIntervalRef.current = null;
      }
    };
  }, [dueCollections.length, isAutoAlarmMuted, isAutoBannerDismissed]);

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
        const isOnceMatch = (!rem.frequency || rem.frequency === "once") && !rem.fired && rem.date === dateStr && rem.time === timeStr;
        const isDailyMatch = rem.frequency === "daily" && rem.lastFiredDate !== dateStr && rem.time === timeStr;

        if (isOnceMatch || isDailyMatch) {
          setActiveAlarm(rem);
          didFired = true;
          return { 
            ...rem, 
            fired: true, 
            lastFiredDate: dateStr 
          };
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

  // --- COMPANIES CRUD CALLBACKS ---
  const handleAddCompany = async () => {
    if (!companyNameInput.trim()) return;
    try {
      const newComp = await dbService.addCompany({
        name: companyNameInput.trim(),
        createdAt: new Date().toISOString()
      });
      setCompanies(prev => [...prev, newComp]);
      setSelectedCompanyId(newComp.id);
      setIsCompanyModalOpen(false);
      setCompanyNameInput("");
      addToast(`Company "${newComp.name}" created!`);
    } catch (err) {
      addToast("Failed to create company.", "error");
    }
  };

  const handleUpdateCompany = async () => {
    if (!companyNameInput.trim() || !editingCompany) return;
    const oldName = editingCompany.name;
    const newName = companyNameInput.trim();
    try {
      const updated = await dbService.updateCompany(editingCompany.id, {
        name: newName
      });
      setCompanies(prev => prev.map(c => c.id === editingCompany.id ? { ...c, ...updated } : c));
      
      // Update bookkeeping items associated with this company in Firebase & state
      const bksToUpdate = bookkeepings.filter(b => b.companyId === editingCompany.id);
      for (const bk of bksToUpdate) {
        const updatedFields = { clientName: newName };
        if (bk.paidBy === oldName || bk.paidBy === "Main Company") {
          updatedFields.paidBy = newName;
        }
        await dbService.updateBookkeeping(bk.id, updatedFields);
      }

      setBookkeepings(prev => prev.map(b => {
        if (b.companyId === editingCompany.id) {
          const updatedB = { ...b, clientName: newName };
          if (b.paidBy === oldName || b.paidBy === "Main Company") {
            updatedB.paidBy = newName;
          }
          return updatedB;
        }
        return b;
      }));

      setIsCompanyModalOpen(false);
      setEditingCompany(null);
      setCompanyNameInput("");
      addToast("Company renamed successfully!");
    } catch (err) {
      addToast("Failed to rename company.", "error");
    }
  };

  const handleDeleteCompany = async (compId) => {
    const comp = companies.find(c => c.id === compId);
    if (!comp) return;
    if (companies.length <= 1) {
      addToast("You must keep at least one company.", "warning");
      return;
    }
    if (confirm(`Are you sure you want to delete "${comp.name}"? This will permanently delete all its records.`)) {
      try {
        await dbService.deleteCompany(compId);
        
        // Delete all associated items in Firebase
        const colsToDelete = collections.filter(c => c.companyId === compId);
        for (const col of colsToDelete) {
          await dbService.deleteCollection(col.id);
        }
        const expsToDelete = expenses.filter(e => e.companyId === compId);
        for (const exp of expsToDelete) {
          await dbService.deleteExpense(exp.id);
        }
        const bksToDelete = bookkeepings.filter(b => b.companyId === compId);
        for (const bk of bksToDelete) {
          if (dbService.deleteBookkeeping) {
            await dbService.deleteBookkeeping(bk.id);
          }
        }
        
        setCollections(prev => prev.filter(c => c.companyId !== compId));
        setExpenses(prev => prev.filter(e => e.companyId !== compId));
        setBookkeepings(prev => prev.filter(b => b.companyId !== compId));
        
        const remaining = companies.filter(c => c.id !== compId);
        setCompanies(remaining);
        setSelectedCompanyId(remaining[0].id);
        addToast(`Company "${comp.name}" and its records deleted.`);
      } catch (err) {
        addToast("Failed to delete company.", "error");
      }
    }
  };

  // --- COLLECTIONS CRUD CALLBACKS ---
  const handleAddCollection = async (payload) => {
    try {
      const payloadWithCompany = { ...payload, companyId: selectedCompanyId };
      const newItem = await dbService.addCollection(payloadWithCompany);
      setCollections(prev => [...prev, newItem]);
      addToast(`Collection "${payload.description}" added successfully!`);
    } catch (err) {
      addToast("Failed to save collection entry.", "error");
    }
  };

  const handleUpdateCollection = async (id, payload) => {
    try {
      const payloadWithCompany = { ...payload, companyId: selectedCompanyId };
      const updated = await dbService.updateCollection(id, payloadWithCompany);
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
      const payloadWithCompany = { ...payload, companyId: selectedCompanyId };
      const newItem = await dbService.addExpense(payloadWithCompany);
      setExpenses(prev => [...prev, newItem]);
      addToast(`Expense "${payload.description}" logged successfully!`);
    } catch (err) {
      addToast("Failed to save expense entry.", "error");
    }
  };

  const handleUpdateExpense = async (id, payload) => {
    try {
      const payloadWithCompany = { ...payload, companyId: selectedCompanyId };
      const updated = await dbService.updateExpense(id, payloadWithCompany);
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

  // --- BOOKKEEPING CRUD CALLBACKS ---
  const handleAddBookkeeping = async (payload) => {
    try {
      const payloadWithCompany = { ...payload, companyId: selectedCompanyId };
      const newItem = await dbService.addBookkeeping(payloadWithCompany);
      setBookkeepings(prev => [...prev, newItem]);
      addToast("Bookkeeping service record saved successfully!");
    } catch (err) {
      addToast("Failed to save bookkeeping record.", "error");
    }
  };

  const handleUpdateBookkeeping = async (id, payload) => {
    try {
      const payloadWithCompany = { ...payload, companyId: selectedCompanyId };
      const updated = await dbService.updateBookkeeping(id, payloadWithCompany);
      setBookkeepings(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
      addToast("Bookkeeping record updated successfully!");
    } catch (err) {
      addToast("Failed to update bookkeeping record.", "error");
    }
  };

  const handleDeleteBookkeeping = async (id) => {
    try {
      await dbService.deleteBookkeeping(id);
      setBookkeepings(prev => prev.filter(item => item.id !== id));
      addToast("Bookkeeping record deleted.");
    } catch (err) {
      addToast("Failed to delete bookkeeping record.", "error");
    }
  };



  // --- SUMMARY CALCULATIONS ---
  const totalCollectionsValue = useMemo(() => {
    return activeCollections.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [activeCollections]);

  const totalExpensesValue = useMemo(() => {
    return activeExpenses.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [activeExpenses]);

  const totalReceivedInflow = useMemo(() => {
    return activeCollections.reduce((sum, item) => {
      const received = item.status?.toLowerCase() === "received" 
        ? Number(item.amount || 0) 
        : item.status?.toLowerCase() === "partial payment" 
        ? Number(item.paidAmount || 0) 
        : 0;
      return sum + received;
    }, 0);
  }, [activeCollections]);

  const netBalance = useMemo(() => {
    return totalCollectionsValue - totalExpensesValue;
  }, [totalCollectionsValue, totalExpensesValue]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 relative" suppressHydrationWarning>
      
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>{greeting}!</span>
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-1">
              <span>BiD Finance Monitor Dashboard</span>
              {isMounted && weather.temp !== null && (
                <>
                  <span className="text-slate-350">•</span>
                  <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/50 font-semibold text-[10px]">
                    {getWeatherIcon(weather.code)}
                    <span>{weather.city ? `${weather.city.toUpperCase()} • ` : ""}{weather.temp}°C</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Info: Separated Live Clock & Date Cards */}
        <div className="flex flex-row items-center gap-3">
          {/* Time Card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2 text-center min-w-[125px]">
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Current Time</p>
            <p className="text-xs font-semibold text-slate-850 tabular-nums flex items-center gap-1.5 justify-center mt-0.5">
              <ClockIcon size={11} className="text-slate-500" />
              <span>{isMounted ? currentTime : "--:--:--"}</span>
            </p>
          </div>

          {/* Date Card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2 text-center min-w-[155px]">
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Date</p>
            <p className="text-xs font-semibold text-slate-850 mt-0.5 whitespace-nowrap">
              {isMounted ? currentDate : "Loading Date..."}
            </p>
          </div>
        </div>

      </header>

      {/* Auto-Reminder Banner for Due/Overdue Collections */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence>
          {dueCollections.length > 0 && !isAutoBannerDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-6 bg-gradient-to-r from-amber-50/90 to-red-55/90 border border-red-200 shadow-sm rounded-2xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200 animate-pulse">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-2">
                    <span>Auto-Reminder: Overdue Collections Alert</span>
                    <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                      {dueCollections.length} Due
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    The following collections are due or overdue. Please collect them to avoid delays.
                  </p>
                  
                  {/* Quick-list of due collections */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dueCollections.slice(0, 3).map(col => {
                      const isPartial = col.status?.toLowerCase() === "partial payment";
                      const dueAmount = isPartial ? Number(col.amount - (col.paidAmount || 0)) : Number(col.amount);
                      return (
                        <div key={col.id} className="flex flex-wrap items-center gap-2 bg-white border border-red-100/50 rounded-lg px-2.5 py-1 text-xs shadow-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">{col.description}</span>
                          <span className="text-slate-400 font-light text-[10px] flex items-center gap-0.5">
                            <Calendar size={10} className="text-slate-400" />
                            {col.date}
                          </span>
                          <span className="text-slate-300 font-light">|</span>
                          <span className="font-bold text-red-600" title={isPartial ? `Total: ₹${Number(col.amount).toLocaleString("en-IN")} (Paid: ₹${Number(col.paidAmount).toLocaleString("en-IN")})` : ""}>
                            ₹{dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            {isPartial && <span className="text-[9px] text-slate-400 font-normal ml-1">(due)</span>}
                          </span>
                          <button
                            onClick={async () => {
                              await handleUpdateCollection(col.id, { ...col, status: "Received" });
                            }}
                            className="ml-1 text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            Receive
                          </button>
                        </div>
                      );
                    })}
                    {dueCollections.length > 3 && (
                      <button
                        onClick={() => setIsDueModalOpen(true)}
                        className="flex items-center bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] text-slate-550 font-bold cursor-pointer transition-colors"
                      >
                        +{dueCollections.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-row items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-200/60 pt-3 md:pt-0 justify-end">
                {/* Alarm Sound Controller */}
                {!isAutoAlarmMuted ? (
                  <button
                    type="button"
                    onClick={() => setIsAutoAlarmMuted(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Mute Warning Alarm"
                  >
                    <WifiOff size={13} className="animate-bounce" />
                    <span>Mute Alarm</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAutoAlarmMuted(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Unmute Warning Alarm"
                  >
                    <ClockIcon size={13} />
                    <span>Play Sound</span>
                  </button>
                )}
                
                {/* Dismiss Banner Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoBannerDismissed(true);
                    setIsAutoAlarmMuted(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-250 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Dismiss warning"
                >
                  <X size={13} />
                  <span>Dismiss</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        /* Loading Spinner */
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Fetching ledger records...</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Company Selector Bar */}
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-sm backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                <Building2 size={18} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Active Entity</span>
                <div className="relative mt-0.5 flex items-center gap-2">
                  <button
                    onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                    className="flex items-center gap-1.5 text-base font-bold text-slate-800 focus:outline-none hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <span>{companies.find(c => c.id === selectedCompanyId)?.name || "Select Business"}</span>
                    <ChevronDown size={15} className={`text-slate-500 transition-transform duration-250 ${isCompanyDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  <button
                    onClick={() => {
                      const activeComp = companies.find(c => c.id === selectedCompanyId);
                      if (activeComp) {
                        setEditingCompany(activeComp);
                        setCompanyNameInput(activeComp.name);
                        setIsCompanyModalOpen(true);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Rename Active Business"
                  >
                    <Edit3 size={14} />
                  </button>

                  <AnimatePresence>
                    {isCompanyDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setIsCompanyDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden"
                        >
                          <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {companies.map((comp) => (
                              <div
                                key={comp.id}
                                className={`flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors ${
                                  comp.id === selectedCompanyId ? "bg-slate-100/70" : ""
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedCompanyId(comp.id);
                                    setIsCompanyDropdownOpen(false);
                                  }}
                                  className="flex-1 text-left text-xs font-semibold text-slate-700 cursor-pointer"
                                >
                                  {comp.name}
                                </button>
                                <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCompany(comp);
                                      setCompanyNameInput(comp.name);
                                      setIsCompanyModalOpen(true);
                                      setIsCompanyDropdownOpen(false);
                                    }}
                                    className="p-1 text-slate-500 hover:text-slate-700 rounded transition-colors"
                                    title="Rename Business"
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                  {companies.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCompany(comp.id);
                                        setIsCompanyDropdownOpen(false);
                                      }}
                                      className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                                      title="Delete Business"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-slate-100 p-2 bg-slate-50">
                            <button
                              onClick={() => {
                                setEditingCompany(null);
                                setCompanyNameInput("");
                                setIsCompanyModalOpen(true);
                                setIsCompanyDropdownOpen(false);
                              }}
                              className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add Company</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Active Portfolio</span>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {companies.length} business entities managed
              </p>
            </div>
          </div>

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
          <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl max-w-xl w-full relative">
            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex-1 py-2 px-2 text-xs uppercase font-bold tracking-wider rounded-lg transition-colors duration-200 relative cursor-pointer ${
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
              <span className="relative z-10 truncate block">Ledger</span>
            </button>
            
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-2 px-2 text-xs uppercase font-bold tracking-wider rounded-lg transition-colors duration-200 relative cursor-pointer ${
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
              <span className="relative z-10 truncate block">AI Insights</span>
            </button>

            <button
              onClick={() => setActiveTab("bookkeeping")}
              className={`flex-1 py-2 px-2 text-xs uppercase font-bold tracking-wider rounded-lg transition-colors duration-200 relative cursor-pointer ${
                activeTab === "bookkeeping" ? "text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {activeTab === "bookkeeping" && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-slate-900 rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 truncate block">Book Keeping</span>
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
                  className="space-y-6"
                >
                  {/* Ledger sub-tabs selector bar with totals */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-sm backdrop-blur-md">
                    {/* Sub-tabs toggle selector */}
                    <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:max-w-xs relative">
                      <button
                        onClick={() => setActiveLedgerTab("collections")}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
                          activeLedgerTab === "collections"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Collections
                      </button>
                      <button
                        onClick={() => setActiveLedgerTab("expenses")}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
                          activeLedgerTab === "expenses"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Expenses
                      </button>
                    </div>

                    {/* Total Amount Display for current sub-tab */}
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {activeLedgerTab === "collections" ? "Total Collected (Received)" : "Total Outflow Paid"}
                      </span>
                      <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">
                        ₹{activeLedgerTab === "collections"
                          ? totalReceivedInflow.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                          : totalExpensesValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </h4>
                    </div>
                  </div>

                  {/* Render active sub-tab list */}
                  <div className="grid grid-cols-1 gap-8 items-start">
                    {activeLedgerTab === "collections" ? (
                      <CollectionList
                        items={activeCollections}
                        onAdd={handleAddCollection}
                        onUpdate={handleUpdateCollection}
                        onDelete={handleDeleteCollection}
                        onAddReminder={handleAddReminder}
                      />
                    ) : (
                      <FixedExpenses
                        items={activeExpenses}
                        onAdd={handleAddExpense}
                        onUpdate={handleUpdateExpense}
                        onDelete={handleDeleteExpense}
                      />
                    )}
                  </div>
                </motion.div>
              ) : activeTab === "analytics" ? (
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
                    collections={activeCollections} 
                    expenses={activeExpenses} 
                  />

                  {/* AI Analysis and Alarm Scheduler */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <AiAdvisor 
                        collections={activeCollections} 
                        expenses={activeExpenses} 
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
              ) : (
                <motion.div
                  key="bookkeeping"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  <Bookkeeping
                    items={activeBookkeepings}
                    onAdd={handleAddBookkeeping}
                    onUpdate={handleUpdateBookkeeping}
                    onDelete={handleDeleteBookkeeping}
                    activeCompanyName={companies.find(c => c.id === selectedCompanyId)?.name || "Active Entity"}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* Alarm Reminder Popups Overlay */}
      <AnimatePresence>
        {activeAlarm && (() => {
          const linkedCol = activeAlarm.collectionId 
            ? collections.find(c => c.id === activeAlarm.collectionId) 
            : null;
          
          return (
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
                  <h4 className="font-bold text-slate-800 text-sm">
                    {activeAlarm.frequency === "daily" ? "Daily Collection Alert" : "Alarm Reminder Triggered"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {activeAlarm.frequency === "daily" ? "Recurring daily alert" : "Scheduled task time is due!"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 text-xs font-semibold leading-relaxed">
                  {activeAlarm.description}
                </div>

                {linkedCol && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-left text-xs space-y-1.5">
                    <p className="font-bold text-indigo-950 uppercase text-[9px] tracking-wider">Linked Collection Details</p>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Amount:</span>
                      <span className="font-semibold text-slate-800">₹{Number(linkedCol.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    {linkedCol.status?.toLowerCase() === "partial payment" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Paid Amount:</span>
                          <span className="font-semibold text-emerald-700">₹{Number(linkedCol.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Due Amount:</span>
                          <span className="font-semibold text-red-650">₹{Number(linkedCol.amount - (linkedCol.paidAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Due Date:</span>
                      <span className="font-semibold text-slate-800">{linkedCol.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        linkedCol.status?.toLowerCase() === "received"
                          ? "bg-emerald-100 text-emerald-800"
                          : linkedCol.status?.toLowerCase() === "partial payment"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {linkedCol.status}
                      </span>
                    </div>
                    
                    {linkedCol.status?.toLowerCase() !== "received" && (
                      <button
                        onClick={async () => {
                          await handleUpdateCollection(linkedCol.id, {
                            ...linkedCol,
                            status: "Received"
                          });
                          setActiveAlarm(null);
                        }}
                        className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer text-center block shadow-sm"
                      >
                        Mark Collection as Received
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveAlarm(null);
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    Dismiss Alarm
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteReminder(activeAlarm.id);
                      setActiveAlarm(null);
                    }}
                    className="w-full py-1.5 text-xs text-red-500 hover:text-red-700 font-medium hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                  >
                    Cancel / Turn Off Schedule
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Due collections details modal */}
      <AnimatePresence>
        {isDueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <AlertTriangle size={18} className="animate-pulse" />
                  <h4 className="font-bold text-sm text-slate-800">
                    Overdue Collections List ({dueCollections.length})
                  </h4>
                </div>
                <button
                  onClick={() => setIsDueModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {dueCollections.map(col => {
                  const isPartial = col.status?.toLowerCase() === "partial payment";
                  const dueAmount = isPartial ? Number(col.amount - (col.paidAmount || 0)) : Number(col.amount);
                  return (
                    <div key={col.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/60 rounded-xl gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">{col.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5 font-medium">
                            <Calendar size={10} />
                            Due: {col.date}
                          </span>
                          <span>•</span>
                          <span className={`font-semibold uppercase ${isPartial ? "text-indigo-600" : "text-amber-600"}`}>
                            {col.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold text-red-650">
                            ₹{dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </p>
                          {isPartial && (
                            <p className="text-[8px] text-slate-450 font-normal">
                              Total: ₹{Number(col.amount).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={async () => {
                            await handleUpdateCollection(col.id, { ...col, status: "Received" });
                            if (dueCollections.length <= 1) {
                              setIsDueModalOpen(false);
                            }
                          }}
                          className="px-2.5 py-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                        >
                          Receive
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDueModalOpen(false)}
                  className="px-4 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Company Modal */}
      <AnimatePresence>
        {isCompanyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h4 className="font-bold text-sm text-slate-800">
                  {editingCompany ? "Rename Business" : "Create New Business"}
                </h4>
                <button
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  placeholder="e.g. Concrete Deliveries Ltd."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="flex-1 py-2 text-xs border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCompany ? handleUpdateCompany : handleAddCompany}
                  disabled={!companyNameInput.trim()}
                  className="flex-1 py-2 text-xs bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Save Business
                </button>
              </div>
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
