import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Copy, Check, Clock, Calendar } from 'lucide-react';

interface TemplatesViewProps {
  theme: any;
  isDarkMode: boolean;
  onBack: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ theme, isDarkMode, onBack }) => {
  const getTodayDate = () => {
    const today = new Date();
    return `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${String(today.getFullYear()).slice(-2)}`;
  };

  const [times, setTimes] = useState({
    pickupArrived: new Date().toTimeString().slice(0, 5),
    pickupCompleted: new Date().toTimeString().slice(0, 5),
    deliveryArrived: new Date().toTimeString().slice(0, 5),
    deliveryCompleted: new Date().toTimeString().slice(0, 5),
  });

  const [dates, setDates] = useState({
    pickupArrived: getTodayDate(),
    pickupCompleted: getTodayDate(),
    deliveryArrived: getTodayDate(),
    deliveryCompleted: getTodayDate(),
  });

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const updateTime = (key: keyof typeof times, value: string) => {
    setTimes(prev => ({ ...prev, [key]: value }));
  };

  const updateDate = (key: keyof typeof dates, value: string) => {
    // Expecting value in format YYYY-MM-DD from input type="date"
    // Convert to MM/DD/YY
    if (!value) return;
    const [year, month, day] = value.split('-');
    const formattedDate = `${month}/${day}/${year.slice(-2)}`;
    setDates(prev => ({ ...prev, [key]: formattedDate }));
  };

  // Helper to get YYYY-MM-DD for input value
  const getInputValueDate = (dateStr: string) => {
    const [month, day, yearShort] = dateStr.split('/');
    const year = `20${yearShort}`;
    return `${year}-${month}-${day}`;
  };

  const setNow = (key: keyof typeof times) => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
    
    setTimes(prev => ({ ...prev, [key]: time }));
    setDates(prev => ({ ...prev, [key as keyof typeof dates]: date }));
  };

  const handleTimeChange = (key: keyof typeof times, value: string) => {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');
    
    // Limit to 4 digits
    digits = digits.slice(0, 4);
    
    // Format as HH:mm
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}:${digits.slice(2)}`;
    }
    
    updateTime(key, formatted);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const pickupTemplate = `Hi team, 

Your load is now picked up. Please see attached BOL. 

Arrived at Shipper 
${dates.pickupArrived} ${times.pickupArrived}

Actual pick up Completed 
${dates.pickupCompleted} ${times.pickupCompleted}

Kind regards.`;

  const deliveryTemplate = `Hi team, 

Your load is now delivered. Please see attached POD. 

Arrived at Receiver 
${dates.deliveryArrived} ${times.deliveryArrived}

Actual Delivery Completed 
${dates.deliveryCompleted} ${times.deliveryCompleted}

Kind regards.`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className={`text-3xl font-display font-medium ${theme.text}`}>Templates</h2>
          <p className={`${theme.textMuted} text-sm`}>Quick status updates for your team</p>
        </div>
        <button 
          onClick={onBack}
          className={`px-4 py-2 rounded-xl border ${theme.border} ${theme.textMuted} hover:${theme.text} hover:${theme.cardBg} transition-colors flex items-center gap-2 glass-button`}
        >
          <ChevronLeft size={18} />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pickup Template Card */}
        <div className={`${theme.cardBg} glass-card rounded-2xl border ${theme.border} p-6 shadow-sm flex flex-col space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium ${theme.text} flex items-center gap-2`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Pickup Template
            </h3>
            <button 
              onClick={() => handleCopy(pickupTemplate, 'pickup')}
              className={`p-2 rounded-lg border ${theme.border} ${theme.textMuted} hover:${theme.text} hover:${theme.cardBg} transition-colors relative`}
            >
              {copied === 'pickup' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-[10px] uppercase tracking-wider ${theme.textMuted} font-bold`}>Arrived at Shipper</label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={getInputValueDate(dates.pickupArrived)}
                    onChange={(e) => updateDate('pickupArrived', e.target.value)}
                    className={`flex-1 ${theme.inputBg} border ${theme.border} rounded-lg px-2 py-1.5 text-xs ${theme.text} focus:outline-none focus:border-indigo-500`}
                  />
                  <input 
                    type="text" 
                    value={times.pickupArrived}
                    onChange={(e) => handleTimeChange('pickupArrived', e.target.value)}
                    onFocus={handleFocus}
                    placeholder="HH:mm"
                    className={`w-24 ${theme.inputBg} border ${theme.border} rounded-lg px-2 py-1.5 text-xs ${theme.text} focus:outline-none focus:border-indigo-500 font-mono`}
                  />
                  <button onClick={() => setNow('pickupArrived')} className={`p-1.5 rounded-lg border ${theme.border} ${theme.textMuted} hover:text-indigo-500 transition-colors`}>
                    <Clock size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] uppercase tracking-wider ${theme.textMuted} font-bold`}>Pick up Completed</label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={getInputValueDate(dates.pickupCompleted)}
                    onChange={(e) => updateDate('pickupCompleted', e.target.value)}
                    className={`flex-1 ${theme.inputBg} border ${theme.border} rounded-lg px-2 py-1.5 text-xs ${theme.text} focus:outline-none focus:border-indigo-500`}
                  />
                  <input 
                    type="text" 
                    value={times.pickupCompleted}
                    onChange={(e) => handleTimeChange('pickupCompleted', e.target.value)}
                    onFocus={handleFocus}
                    placeholder="HH:mm"
                    className={`w-24 ${theme.inputBg} border ${theme.border} rounded-lg px-2 py-1.5 text-xs ${theme.text} focus:outline-none focus:border-indigo-500 font-mono`}
                  />
                  <button onClick={() => setNow('pickupCompleted')} className={`p-1.5 rounded-lg border ${theme.border} ${theme.textMuted} hover:text-indigo-500 transition-colors`}>
                    <Clock size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'} border ${theme.border} font-mono text-xs whitespace-pre-wrap leading-relaxed ${theme.textMuted}`}>
              {pickupTemplate}
            </div>
          </div>
        </div>

        {/* Delivery Template Card */}
        <div className={`${theme.cardBg} glass-card rounded-2xl border ${theme.border} p-6 shadow-sm flex flex-col space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium ${theme.text} flex items-center gap-2`}>
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Delivery Template
            </h3>
            <button 
              onClick={() => handleCopy(deliveryTemplate, 'delivery')}
              className={`p-2 rounded-lg border ${theme.border} ${theme.textMuted} hover:${theme.text} hover:${theme.cardBg} transition-colors relative`}
            >
              {copied === 'delivery' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`text-[10px] uppercase tracking-wider ${theme.textMuted} font-bold`}>Arrived at Receiver</label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={getInputValueDate(dates.deliveryArrived)}
                    onChange={(e) => updateDate('deliveryArrived', e.target.value)}
                    className={`flex-1 ${theme.inputBg} border ${theme.border} rounded-lg px-2 py-1.5 text-xs ${theme.text} focus:outline-none focus:border-indigo-500`}
                  />
                  <input 
                    type="text" 
                    value={times.deliveryArrived}
                    onChange={(e) => handleTimeChange('deliveryArrived', e.target.value)}
                    onFocus={handleFocus}
                    placeholder="HH:mm"
                    className={`w-24 ${theme.inputBg} border ${theme.border} rounded-lg px-2 py-1.5 text-xs ${theme.text} focus:outline-none focus:border-indigo-500 font-mono`}
                  />
                  <button onClick={() => setNow('deliveryArrived')} className={`p-1.5 rounded-lg border ${theme.border} ${theme.textMuted} hover:text-indigo-500 transition-colors`}>
                    <Clock size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] uppercase tracking-wider ${theme.textMuted} font-bold`}>Delivery Completed</label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={getInputValueDate(dates.deliveryCompleted)}
                    onChange={(e) => updateDate('deliveryCompleted', e.target.value)}
                    className={`flex-1 ${theme.inputBg} border ${theme.border} rounded-lg px-2 py-1.5 text-xs ${theme.text} focus:outline-none focus:border-indigo-500`}
                  />
                  <input 
                    type="text" 
                    value={times.deliveryCompleted}
                    onChange={(e) => handleTimeChange('deliveryCompleted', e.target.value)}
                    onFocus={handleFocus}
                    placeholder="HH:mm"
                    className={`w-24 ${theme.inputBg} border ${theme.border} rounded-lg px-2 py-1.5 text-xs ${theme.text} focus:outline-none focus:border-indigo-500 font-mono`}
                  />
                  <button onClick={() => setNow('deliveryCompleted')} className={`p-1.5 rounded-lg border ${theme.border} ${theme.textMuted} hover:text-indigo-500 transition-colors`}>
                    <Clock size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'} border ${theme.border} font-mono text-xs whitespace-pre-wrap leading-relaxed ${theme.textMuted}`}>
              {deliveryTemplate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


