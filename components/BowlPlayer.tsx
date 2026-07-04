'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Clock, Info, Share2, Settings, Waves } from 'lucide-react';
import { bowlSynth } from '@/lib/audio';
import { translations, Language, languages } from '@/lib/i18n';
import Visualizer3D from './Visualizer3D';

export default function BowlPlayer() {
  const [lang, setLang] = useState<Language>('en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState<number>(432);
  const [volume, setVolume] = useState(0.7);
  const [noiseVolume, setNoiseVolume] = useState(0.3);
  const [noiseType, setNoiseType] = useState<'none' | 'rain' | 'ocean' | 'womb'>('none');
  const [visType, setVisType] = useState<'sphere' | 'liquid' | 'stars'>('sphere');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customFrequency, setCustomFrequency] = useState<string>('432.000');
  const [timer, setTimer] = useState<number>(0); // minutes
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // seconds
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const t = translations[lang];
  const dir = languages.find(l => l.code === lang)?.dir || 'ltr';

  const frequencies = [
    { value: 111, label: t.bowl111, desc: t.bowl111Desc },
    { value: 174, label: (t as any).bowl174, desc: (t as any).bowl174Desc },
    { value: 396, label: t.bowl396, desc: t.bowl396Desc },
    { value: 432, label: t.bowl432, desc: t.bowl432Desc },
    { value: 528, label: t.bowl528, desc: t.bowl528Desc },
    { value: 1033, label: (t as any).bowl1033, desc: (t as any).bowl1033Desc },
  ];

  const currentFreqData = frequencies.find(f => f.value === frequency) || frequencies[2];

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    bowlSynth.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    bowlSynth.setNoiseVolume(noiseVolume);
  }, [noiseVolume]);

  useEffect(() => {
    if (isPlaying) {
      bowlSynth.setBackgroundNoise(noiseType);
    } else {
      bowlSynth.setBackgroundNoise('none');
    }
  }, [noiseType, isPlaying]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      bowlSynth.stop();
      setIsPlaying(false);
    } else {
      const freq = isCustomMode ? parseFloat(customFrequency) : frequency;
      await bowlSynth.play(freq);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (timer > 0 && isPlaying) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handlePlayPause(); // Stop playing
            setTimer(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timer, isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimerSet = (mins: number) => {
    setTimer(mins);
    setTimeRemaining(mins * 60);
  };

  const handleFreqChange = async (newFreq: number) => {
    setFrequency(newFreq);
    setIsCustomMode(false);
    if (isPlaying) {
      await bowlSynth.play(newFreq);
    }
  };

  const handleCustomFreqChange = async (val: string) => {
    setCustomFrequency(val);
    const freq = parseFloat(val);
    if (!isNaN(freq) && isPlaying) {
      await bowlSynth.play(freq);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert(t.shareSuccess);
    } catch (e) {
      alert(t.shareError);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center relative overflow-hidden font-sans ${dir === 'rtl' ? 'rtl' : 'ltr'}`} dir={dir}>
      
      {/* Background 3D Visualizer */}
      <div className="absolute inset-0 z-0">
        <Visualizer3D isPlaying={isPlaying} frequency={frequency} type={visType} />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <h1 className="text-2xl font-light tracking-widest opacity-80">{t.title}</h1>
        <div className="flex gap-4">
          <button onClick={() => setShowInfo(!showInfo)} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition backdrop-blur-md">
            <Info size={20} className="opacity-80" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition backdrop-blur-md">
            <Settings size={20} className="opacity-80" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center w-full max-w-md px-6 mt-12">
        
        {/* Frequency Display */}
        <div className="text-center mb-12">
          <div className="text-7xl font-extralight tracking-tighter mb-4 drop-shadow-2xl">
            {isCustomMode ? parseFloat(customFrequency).toFixed(3) : frequency} <span className="text-3xl opacity-50 font-light">Hz</span>
          </div>
          <p className="text-sm opacity-70 max-w-xs mx-auto leading-relaxed font-light">
            {isCustomMode ? t.customDesc : currentFreqData.desc}
          </p>
        </div>

        {/* Play Button */}
        <button 
          onClick={handlePlayPause}
          className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all duration-500 shadow-[0_0_60px_rgba(255,255,255,0.05)] backdrop-blur-xl mb-12 group"
        >
          {isPlaying ? (
            <Pause size={48} className="opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <Play size={48} className="opacity-80 group-hover:opacity-100 transition-opacity ml-2" />
          )}
        </button>

        {/* Controls Panel */}
        <div className="w-full bg-black/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl">
          
          {/* Frequency Selector */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] uppercase tracking-widest opacity-50 block">{t.frequency}</label>
              <button 
                onClick={() => setIsCustomMode(!isCustomMode)}
                className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border transition-all ${isCustomMode ? 'bg-white text-black border-white' : 'text-white border-white/20 hover:border-white/50'}`}
              >
                {t.customMode}
              </button>
            </div>

            {isCustomMode ? (
              <div className="space-y-3">
                <div className="relative">
                  <input 
                    type="number"
                    step="0.001"
                    min="0"
                    max="400000"
                    value={customFrequency}
                    onChange={(e) => handleCustomFreqChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-light outline-none focus:border-white/30 transition-colors text-center"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-30 uppercase tracking-widest">Hz</div>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="400000"
                  step="0.001"
                  value={customFrequency}
                  onChange={(e) => handleCustomFreqChange(e.target.value)}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="text-[10px] opacity-40 text-center uppercase tracking-widest">{t.frequencyStep}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {frequencies.map(f => (
                  <button
                    key={f.value}
                    onClick={() => handleFreqChange(f.value)}
                    className={`py-3 px-4 rounded-xl text-sm transition-all duration-300 ${!isCustomMode && frequency === f.value ? 'bg-white/20 font-medium shadow-inner' : 'bg-white/5 hover:bg-white/10 opacity-70'}`}
                  >
                    {f.value} Hz
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2">
                <Volume2 size={14} /> {t.volume}
              </label>
              <span className="text-xs opacity-50 font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Timer Control */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2">
                <Clock size={14} /> {t.timer}
              </label>
              {timeRemaining > 0 && (
                <span className="text-xs text-emerald-400 font-mono">{formatTime(timeRemaining)}</span>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[0, 15, 30, 60, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleTimerSet(mins)}
                  className={`flex-shrink-0 py-2 px-4 rounded-lg text-sm transition-all duration-300 ${timer === mins ? 'bg-white/20 font-medium shadow-inner' : 'bg-white/5 hover:bg-white/10 opacity-70'}`}
                >
                  {mins === 0 ? t.timerOff : `${mins}${t.timerMin}`}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-all">
          <div className="bg-neutral-900/90 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-light mb-8 tracking-wide">Settings</h2>
            
            <div className="mb-8">
              <label className="text-[10px] uppercase tracking-widest opacity-50 mb-3 block">{t.language}</label>
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as Language)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-white/30 transition-colors"
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code} className="bg-neutral-900">{l.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-8">
              <label className="text-[10px] uppercase tracking-widest opacity-50 mb-3 block">{t.visualizer}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['sphere', 'liquid', 'stars'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setVisType(type)}
                    className={`py-3 px-2 rounded-xl text-xs transition-all duration-300 ${visType === type ? 'bg-white/20 font-medium' : 'bg-white/5 hover:bg-white/10 opacity-70'}`}
                  >
                    {type === 'sphere' ? t.visSphere : type === 'liquid' ? t.visLiquid : t.visStars}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[10px] uppercase tracking-widest opacity-50 mb-3 block">{t.backgroundNoise}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['none', 'rain', 'ocean', 'womb'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setNoiseType(type)}
                    className={`py-3 px-4 rounded-xl text-sm transition-all duration-300 ${noiseType === type ? 'bg-white/20 font-medium' : 'bg-white/5 hover:bg-white/10 opacity-70'}`}
                  >
                    {type === 'none' ? t.noiseNone : type === 'rain' ? t.noiseRain : type === 'ocean' ? t.noiseOcean : t.noiseWomb}
                  </button>
                ))}
              </div>
              
              {noiseType !== 'none' && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-2"><Waves size={14} /> {t.volume}</span>
                    <span className="text-xs opacity-50 font-mono">{Math.round(noiseVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={noiseVolume} 
                    onChange={(e) => setNoiseVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full py-4 bg-white text-black rounded-xl font-medium mt-4 hover:bg-neutral-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-all">
          <div className="bg-neutral-900/90 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-light mb-6 tracking-wide">{t.about}</h2>
            <p className="text-sm opacity-70 leading-relaxed mb-8 font-light">
              {t.aboutText}
            </p>
            
            <button 
              onClick={handleShare}
              className="w-full py-4 bg-white/10 rounded-xl font-medium mb-3 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={18} /> {t.share}
            </button>

            <button 
              onClick={() => setShowInfo(false)}
              className="w-full py-4 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
