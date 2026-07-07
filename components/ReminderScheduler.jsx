"use client";

import { useState } from "react";
import { Clock, Plus, Trash2, Calendar, AlertCircle } from "lucide-react";

export default function ReminderScheduler({ 
  reminders = [], 
  onAddReminder, 
  onDeleteReminder
}) {
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("");
  const [tone, setTone] = useState("chime");
  const [frequency, setFrequency] = useState("once");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc.trim()) {
      setError("Provide a reminder description.");
      return;
    }
    if (frequency === "once" && !date) {
      setError("Select a date.");
      return;
    }
    if (!time) {
      setError("Select a time.");
      return;
    }

    const payload = {
      description: desc.trim(),
      date: frequency === "daily" ? "" : date,
      time,
      tone,
      frequency,
      fired: false,
      lastFiredDate: null,
      collectionId: null
    };

    onAddReminder(payload);
    setDesc("");
    setTime("");
    setTone("chime");
    setFrequency("once");
    setError("");
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between h-full">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
          <Clock size={14} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Operational Reminders</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Alarm reminders with tone alerts</p>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-2 rounded bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-100 flex items-center gap-1.5">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}      {/* Scheduler Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2.5">

        <div>
          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Task Description</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. Pay Mayfair Office Rent"
            className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-500 text-slate-700 placeholder-slate-350"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700 bg-white"
            >
              <option value="once">📅 One-Time</option>
              <option value="daily">🔄 Daily Alert</option>
            </select>
          </div>
          <div>
            {frequency === "once" ? (
              <>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
                />
              </>
            ) : (
              <>
                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Date</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[9px] text-slate-500 text-center font-medium leading-tight h-[31px] flex items-center justify-center">
                  Repeats daily from today
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Alarm Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-slate-500 text-slate-700 bg-white"
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

        <div className="flex gap-2 pt-1">
          {(desc || time) && (
            <button
              type="button"
              onClick={() => {
                setDesc("");
                setTime("");
                setTone("chime");
                setFrequency("once");
                setError("");
              }}
              className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 font-semibold text-xs rounded-lg transition-colors cursor-pointer text-center"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="flex-[2] py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Schedule Alert</span>
          </button>
        </div>
      </form>

      {/* Reminders List */}
      <div className="border-t border-slate-100 pt-3">
        <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Scheduled Alarms</h4>
        <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
          {reminders.length > 0 ? (
            reminders.map((rem) => (
              <div 
                key={rem.id} 
                className={`flex items-center justify-between p-2 rounded-lg border text-xs leading-normal transition-all ${
                  rem.fired && rem.frequency !== 'daily'
                    ? "bg-slate-50 border-slate-200/50 opacity-55 text-slate-500" 
                    : "bg-emerald-50/20 border-emerald-100 text-slate-750"
                }`}
              >
                <div className="truncate max-w-[75%]">
                  <div className="flex items-center gap-1 truncate mb-0.5">
                    <span className={`px-1 py-0.2 rounded text-[7px] font-bold uppercase shrink-0 ${
                      rem.frequency === 'daily'
                        ? 'bg-indigo-50 border border-indigo-100 text-indigo-750'
                        : 'bg-slate-100 border border-slate-200/60 text-slate-600'
                    }`}>
                      {rem.frequency === 'daily' ? 'Daily' : 'Once'}
                    </span>
                    <p className={`font-semibold truncate ${rem.fired && rem.frequency !== 'daily' ? "line-through text-slate-400 font-normal" : ""}`}>{rem.description}</p>
                  </div>
                  <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={10} />
                    <span>
                      {rem.frequency === 'daily' ? 'Every day' : rem.date} @ {rem.time} ({
                        rem.tone === 'beep' ? 'Beep' : 
                        rem.tone === 'retro' ? 'Retro' : 
                        rem.tone === 'ascending' ? 'Sweep' : 
                        rem.tone === 'digital' ? 'Digital' :
                        rem.tone === 'zen' ? 'Zen' :
                        'Chime'
                      })
                    </span>
                    {rem.fired && rem.frequency !== 'daily' && <span className="text-[7px] bg-slate-200 text-slate-600 px-1 rounded ml-1 font-semibold uppercase shrink-0">Fired</span>}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteReminder(rem.id)}
                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                  title="Cancel Alert Reminder"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-slate-400 font-light text-center py-2">No alarms scheduled.</p>
          )}
        </div>
      </div>

    </div>
  );
}
