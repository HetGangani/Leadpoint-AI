'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall, PhoneOff, Mic, MicOff, Volume2, Globe, Sparkles,
  Flame, CheckCircle2, AlertTriangle, MessageSquare, ShieldAlert,
  Clock, Play, RefreshCw, Send, Check
} from 'lucide-react';
import { SupportedLocale, CallWebhookResult } from '@/types';

interface VoiceAgentSimulatorProps {
  initialLead?: {
    id: string;
    name: string;
    companyName: string;
    industry: string;
    phone?: string | null;
  };
}

export default function VoiceAgentSimulator({ initialLead }: VoiceAgentSimulatorProps) {
  const defaultLead = initialLead || {
    id: 'lead_sim_01',
    name: 'Sarah Jenkins',
    companyName: 'Apex Cloud Solutions',
    industry: 'Enterprise Software',
    phone: '+1 (555) 382-9901',
  };

  const [lead, setLead] = useState(defaultLead);
  const [locale, setLocale] = useState<SupportedLocale>('en');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [conversation, setConversation] = useState<Array<{ speaker: 'agent' | 'prospect'; text: string; timestamp: string; sentiment?: string }>>([]);
  const [isHighIntent, setIsHighIntent] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [webhookResult, setWebhookResult] = useState<CallWebhookResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        const langMap: Record<SupportedLocale, string> = {
          en: 'en-US',
          es: 'es-ES',
          de: 'de-DE',
          hi: 'hi-IN',
          fr: 'fr-FR',
        };
        recognition.lang = langMap[locale] || 'en-US';

        recognition.onresult = (event: any) => {
          const transcriptText = event.results[0][0].transcript;
          if (transcriptText) {
            handleSendUserMessage(transcriptText);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [locale]);

  // Call timer effect
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  // Format call duration MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Text to Speech playback (Web Speech API)
  const speakAgentResponse = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any active speech
      const utterance = new SpeechSynthesisUtterance(text);

      const langMap: Record<SupportedLocale, string> = {
        en: 'en-US',
        es: 'es-ES',
        de: 'de-DE',
        hi: 'hi-IN',
        fr: 'fr-FR',
      };
      utterance.lang = langMap[locale] || 'en-US';
      utterance.rate = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Start Voice Call Session
  const handleStartCall = async () => {
    setIsCallActive(true);
    setCallDuration(0);
    setConversation([]);
    setIsHighIntent(false);
    setWebhookResult(null);
    setCurrentStage('CONNECTING');

    // Generate initial greeting
    setIsProcessing(true);
    try {
      const res = await fetch('/api/voice/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          companyName: lead.companyName,
          userUtterance: 'Hello',
          locale,
          clientBusinessProfile: {
            name: 'CloudScale Solutions',
            description: 'Enterprise Cloud Modernization & AI Sales Automation Platform',
            offerings: ['SharePoint to M365 Migration', 'AI Voice Agents', 'AWS Cloud Scaling'],
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        const greetingText = data.data.replyText;
        const now = formatTime(0);
        setConversation([{ speaker: 'agent', text: greetingText, timestamp: now }]);
        setCurrentStage(data.data.stage);
        speakAgentResponse(greetingText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Send turn in call
  const handleSendUserMessage = async (textToSend?: string) => {
    const text = textToSend || currentUtterance;
    if (!text.trim() || !isCallActive || isProcessing) return;

    const now = formatTime(callDuration);
    const updatedConversation = [...conversation, { speaker: 'prospect' as const, text, timestamp: now }];
    setConversation(updatedConversation);
    setCurrentUtterance('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/voice/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          companyName: lead.companyName,
          userUtterance: text,
          locale,
          conversationHistory: updatedConversation.map((c) => ({ sender: c.speaker, text: c.text })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        const reply = data.data.replyText;
        setConversation((prev) => [
          ...prev,
          { speaker: 'agent', text: reply, timestamp: formatTime(callDuration + 1), sentiment: data.data.sentiment },
        ]);
        setCurrentStage(data.data.stage);

        if (data.data.isHighIntent) {
          setIsHighIntent(true);
        }

        speakAgentResponse(reply);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulate Line Busy / Callback trigger
  const handleSimulateBusy = async () => {
    if (!isCallActive) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/voice/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          companyName: lead.companyName,
          userUtterance: 'Line busy / cannot talk',
          forceDisposition: 'BUSY',
          locale,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const reply = data.data.replyText;
        setConversation((prev) => [
          ...prev,
          { speaker: 'agent', text: reply, timestamp: formatTime(callDuration) },
        ]);
        setCurrentStage('BUSY_CALLBACK');
        speakAgentResponse(reply);
        setTimeout(() => handleEndCall('BUSY'), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulate Voicemail trigger
  const handleSimulateVoicemail = async () => {
    if (!isCallActive) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/voice/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          companyName: lead.companyName,
          userUtterance: 'Answering machine tone',
          forceDisposition: 'VOICEMAIL',
          locale,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const reply = data.data.replyText;
        setConversation((prev) => [
          ...prev,
          { speaker: 'agent', text: reply, timestamp: formatTime(callDuration) },
        ]);
        setCurrentStage('VOICEMAIL_LEFT');
        speakAgentResponse(reply);
        setTimeout(() => handleEndCall('VOICEMAIL'), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Voice Input (Mic)
  const toggleMicrophone = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. You can use text input instead!');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // End Call & Trigger Call Webhook Analysis
  const handleEndCall = async (manualDisposition?: any) => {
    setIsCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Call Webhook to post transcript, compute sentiment, auto-flag high intent, write summary
    setIsProcessing(true);
    try {
      const res = await fetch('/api/voice/call-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          durationSeconds: callDuration || 45,
          transcript: conversation.map((c) => ({ speaker: c.speaker, text: c.text, timestamp: c.timestamp })),
          manualDisposition: manualDisposition || (isHighIntent ? 'INTERESTED' : 'INTERESTED'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookResult(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Web Speech API / WebRTC Voice Engine • Gemini LLM Backend</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Interactive AI Voice Agent Simulator</span>
            </h2>
            <p className="text-sm text-slate-400">
              Simulate outbound B2B calls in real-time, test multilingual personas, and trigger automated webhook intent flagging.
            </p>
          </div>

          {/* Language / Locale Selector */}
          <div className="flex items-center space-x-3 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
            <Globe className="h-4 w-4 text-blue-400 ml-2" />
            <span className="text-xs text-slate-400 font-medium">Locale:</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              disabled={isCallActive}
              className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              <option value="en">English (US)</option>
              <option value="es">Spanish (Español)</option>
              <option value="de">German (Deutsch)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="fr">French (Français)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Call Control Visualizer & Status */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
            {/* Prospect Badge */}
            <div className="w-full bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 mb-6 text-left">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Target Prospect</span>
              <div className="font-semibold text-white text-base">{lead.name}</div>
              <div className="text-xs text-slate-400">{lead.companyName} • {lead.industry}</div>
              <div className="text-xs text-blue-400 font-mono mt-1">{lead.phone || '+1 (555) 382-9901'}</div>
            </div>

            {/* Audio Waveform & Pulse Animation */}
            <div className="relative my-4 flex items-center justify-center">
              {isCallActive && (
                <>
                  <div className={`absolute w-36 h-36 rounded-full border-2 border-blue-500/30 animate-ping ${isSpeaking ? 'scale-125 border-purple-500/50' : ''}`} />
                  <div className={`absolute w-28 h-28 rounded-full bg-gradient-to-r ${isSpeaking ? 'from-blue-600/30 to-purple-600/30' : 'from-blue-600/10 to-indigo-600/10'} blur-xl`} />
                </>
              )}

              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCallActive
                  ? isSpeaking
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/40 ring-4 ring-purple-500/20'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isCallActive ? (
                  isSpeaking ? <Volume2 className="h-10 w-10 animate-pulse" /> : <PhoneCall className="h-10 w-10" />
                ) : (
                  <PhoneOff className="h-10 w-10" />
                )}
              </div>
            </div>

            {/* Call State & Timer */}
            <div className="mt-2 space-y-1">
              <div className="font-mono text-2xl font-bold text-white tracking-widest">
                {isCallActive ? formatTime(callDuration) : '00:00'}
              </div>
              <div className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>{isCallActive ? (isSpeaking ? 'AI Speaking...' : isListening ? 'Listening to Prospect...' : 'Call Active') : 'Call Disconnected'}</span>
              </div>
            </div>

            {/* Real-time Intent & Stage Badges */}
            {isCallActive && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Stage: {currentStage}
                </span>
                {isHighIntent && (
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1 animate-bounce">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    <span>🔥 HIGH INTENT DETECTED</span>
                  </span>
                )}
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="w-full mt-6 space-y-3">
              {!isCallActive ? (
                <button
                  onClick={handleStartCall}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-semibold text-sm shadow-xl shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Start Voice Call Simulation</span>
                </button>
              ) : (
                <button
                  onClick={() => handleEndCall()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-sm shadow-xl shadow-red-600/20 transition flex items-center justify-center space-x-2"
                >
                  <PhoneOff className="h-4 w-4" />
                  <span>End Call & Process Webhook</span>
                </button>
              )}

              {/* In-Call Simulation Utility Actions */}
              {isCallActive && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={toggleMicrophone}
                    className={`py-2 px-2 rounded-xl border text-xs font-medium flex flex-col items-center justify-center space-y-1 transition ${
                      isListening
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {isListening ? <Mic className="h-4 w-4 text-purple-400 animate-pulse" /> : <MicOff className="h-4 w-4" />}
                    <span>{isListening ? 'Mic On' : 'Speak'}</span>
                  </button>

                  <button
                    onClick={handleSimulateBusy}
                    disabled={isProcessing}
                    className="py-2 px-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-medium flex flex-col items-center justify-center space-y-1 transition"
                  >
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>Line Busy</span>
                  </button>

                  <button
                    onClick={handleSimulateVoicemail}
                    disabled={isProcessing}
                    className="py-2 px-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs font-medium flex flex-col items-center justify-center space-y-1 transition"
                  >
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    <span>Voicemail</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Transcript Stream & Dual Input */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <span className="font-semibold text-white text-sm">Live Audio Transcript Stream</span>
              </div>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {conversation.length} turn(s)
              </span>
            </div>

            {/* Scrollable Conversation History */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-8 space-y-2">
                  <PhoneCall className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-sm font-medium">No active transcript.</p>
                  <p className="text-xs text-slate-600">Click "Start Voice Call Simulation" to establish call connection with Gemini LLM persona.</p>
                </div>
              ) : (
                conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${msg.speaker === 'agent' ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-400">{msg.timestamp}</span>
                      <span className={`text-xs font-semibold ${msg.speaker === 'agent' ? 'text-blue-400' : 'text-purple-300'}`}>
                        {msg.speaker === 'agent' ? 'AI Voice Agent (Alex)' : lead.name}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                        msg.speaker === 'agent'
                          ? 'bg-blue-600/10 border border-blue-500/20 text-slate-100 rounded-tl-xs'
                          : 'bg-purple-600/20 border border-purple-500/30 text-purple-50 rounded-tr-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}

              {isProcessing && (
                <div className="flex items-center space-x-2 text-slate-400 text-xs py-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
                  <span>Gemini Voice LLM generating turn response...</span>
                </div>
              )}
            </div>

            {/* Input Box for Speech / Text Dual Mode */}
            <div className="pt-4 border-t border-slate-800 mt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendUserMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={currentUtterance}
                  onChange={(e) => setCurrentUtterance(e.target.value)}
                  disabled={!isCallActive || isProcessing}
                  placeholder={
                    isCallActive
                      ? "Type prospect response or click 'Speak' to talk..."
                      : "Start call to unlock transcript controls..."
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!isCallActive || !currentUtterance.trim() || isProcessing}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Post-Call Intelligence Card */}
      {webhookResult && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span>Structured Call Webhook Processed</span>
                  {webhookResult.isHighIntentFlagged && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="h-3 w-3 text-amber-400" />
                      <span>🔥 HIGH INTENT / INTERESTED</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  API `/api/voice/call-webhook` written to database for Lead: <strong className="text-white">{webhookResult.leadName}</strong> ({webhookResult.companyName})
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
              Call ID: {webhookResult.callId}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-mono block mb-1">Sentiment & Disposition</span>
              <div className="font-bold text-white text-base">{webhookResult.sentiment}</div>
              <div className="text-xs text-blue-400 font-mono mt-1">Disposition: {webhookResult.disposition}</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 md:col-span-2">
              <span className="text-xs text-slate-400 font-mono block mb-1">Next Best Action</span>
              <div className="font-semibold text-emerald-300 text-sm">{webhookResult.nextBestAction}</div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono block mb-2">Bulleted Executive Summary</span>
            <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed font-sans">
              {webhookResult.summaryBulletPoints.join('\n')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
