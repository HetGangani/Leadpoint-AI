'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PhoneCall, PhoneOff, Mic, MicOff, Volume2, Globe, Sparkles,
  Flame, CheckCircle2, AlertTriangle, MessageSquare, ShieldAlert,
  Clock, Play, RefreshCw, Send, Check, Users, Building2, Phone
} from 'lucide-react';
import { SupportedLocale, CallWebhookResult } from '@/types';

export interface LeadItem {
  id: string;
  name: string;
  companyName: string;
  industry: string;
  phone?: string | null;
  businessEmail?: string;
}

interface VoiceAgentSimulatorProps {
  initialLead?: LeadItem | null;
  availableLeads?: LeadItem[];
  companyProfile?: {
    name: string;
    description: string;
    offerings?: string[];
  } | null;
  onSelectLead?: (lead: LeadItem) => void;
}

export type VoiceAgentState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export default function VoiceAgentSimulator({
  initialLead,
  availableLeads: propLeads,
  companyProfile: propCompany,
  onSelectLead,
}: VoiceAgentSimulatorProps) {
  const [leadsList, setLeadsList] = useState<LeadItem[]>(propLeads || []);
  const [lead, setLead] = useState<LeadItem | null>(initialLead || null);
  const [company, setCompany] = useState<any>(propCompany || null);
  const [isLoadingData, setIsLoadingData] = useState(!propLeads);

  const [locale, setLocale] = useState<SupportedLocale>('en');
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentState, setAgentState] = useState<VoiceAgentState>('IDLE');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentUtterance, setCurrentUtterance] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [conversation, setConversation] = useState<
    Array<{ speaker: 'agent' | 'prospect'; role?: 'assistant' | 'user'; content?: string; text: string; timestamp: string; sentiment?: string }>
  >([]);
  const [isHighIntent, setIsHighIntent] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [webhookResult, setWebhookResult] = useState<CallWebhookResult | null>(null);
  const [smsDetails, setSmsDetails] = useState<any>(null);
  const [bookingSimulated, setBookingSimulated] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Refs for managing timers, speech recognition, and state across callbacks
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const shouldListenRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const conversationRef = useRef<
    Array<{ speaker: 'agent' | 'prospect'; role?: 'assistant' | 'user'; content?: string; text: string; timestamp: string; sentiment?: string }>
  >([]);
  const callDurationRef = useRef<number>(0);
  const leadRef = useRef<LeadItem | null>(initialLead || null);
  const companyRef = useRef<any>(propCompany || null);
  const localeRef = useRef<SupportedLocale>('en');
  const currentUtteranceRef = useRef<string>('');
  const lastFinalTranscriptRef = useRef<string>('');
  const sendUserMessageRef = useRef<((textToSend?: string) => Promise<void>) | null>(null);

  // Sync refs to avoid stale closures
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  useEffect(() => {
    leadRef.current = lead;
  }, [lead]);

  useEffect(() => {
    companyRef.current = company;
  }, [company]);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    currentUtteranceRef.current = currentUtterance;
  }, [currentUtterance]);

  useEffect(() => {
    if (initialLead) {
      setLead(initialLead);
      leadRef.current = initialLead;
    }
  }, [initialLead]);

  // Fetch authenticated user's company and leads if not supplied via props
  useEffect(() => {
    let mounted = true;
    async function loadTenantData() {
      try {
        const [leadsRes, meRes] = await Promise.all([
          fetch('/api/leads').then((r) => r.json()).catch(() => ({ success: false })),
          fetch('/api/auth/me').then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (!mounted) return;

        if (meRes.success && meRes.data?.companyProfile) {
          setCompany(meRes.data.companyProfile);
          companyRef.current = meRes.data.companyProfile;
        }

        if (leadsRes.success && Array.isArray(leadsRes.data)) {
          setLeadsList(leadsRes.data);

          // If no initial lead provided, select the matching lead or first lead
          if (!leadRef.current) {
            if (initialLead) {
              const matched = leadsRes.data.find((l: LeadItem) => l.id === initialLead.id);
              if (matched) {
                setLead(matched);
                leadRef.current = matched;
              }
            } else if (leadsRes.data.length > 0) {
              setLead(leadsRes.data[0]);
              leadRef.current = leadsRes.data[0];
            }
          }
        }
      } catch (err) {
        console.error('Error loading tenant data for simulator:', err);
      } finally {
        if (mounted) setIsLoadingData(false);
      }
    }

    if (!propLeads || !propCompany) {
      loadTenantData();
    } else {
      setIsLoadingData(false);
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propLeads, propCompany, initialLead]);

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
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Text to Speech playback (Web Speech API) - PART 5
  const speakAgentResponse = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();

        // PART 5: Prevent AI Voice Feedback - SpeechRecognition MUST NOT be listening while AI speaks
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        isListeningRef.current = false;
        setIsListening(false);

        const utterance = new SpeechSynthesisUtterance(text);
        const langMap: Record<SupportedLocale, string> = {
          en: 'en-US',
          es: 'es-ES',
          de: 'de-DE',
          hi: 'hi-IN',
          fr: 'fr-FR',
        };
        utterance.lang = langMap[localeRef.current] || 'en-US';
        utterance.rate = 1.0;

        utterance.onstart = () => {
          console.log('[VOICE DEBUG] event=tts-start');
          isSpeakingRef.current = true;
          setIsSpeaking(true);
          setAgentState('SPEAKING');
        };

        const handleSpeechEnd = () => {
          console.log('[VOICE DEBUG] event=tts-end');
          isSpeakingRef.current = false;
          setIsSpeaking(false);

          // After speechSynthesis.onend, restart recognition if voice mode is still active
          if (shouldListenRef.current) {
            setAgentState('LISTENING');
            console.log('[VOICE DEBUG] event=mic-restart');
            setTimeout(() => {
              if (shouldListenRef.current && !isSpeakingRef.current && !isProcessingRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (err: any) {
                  if (!err?.message?.includes('already started')) {
                    console.warn('[VOICE DEBUG] Recognition restart after TTS warning:', err);
                  }
                }
              }
            }, 250);
          } else {
            setAgentState('IDLE');
          }
        };

        utterance.onend = handleSpeechEnd;
        utterance.onerror = (e) => {
          console.warn('Speech synthesis error:', e);
          handleSpeechEnd();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis playback exception:', err);
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setAgentState(shouldListenRef.current ? 'LISTENING' : 'IDLE');
      }
    }
  }, []);

  // Common sendUserMessage function called by both TEXT and VOICE inputs (PARTS 6 & 7)
  const sendUserMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || currentUtteranceRef.current).trim();
      if (!text) return;
      if (isProcessingRef.current) return;

      const currentLead = leadRef.current;
      if (!currentLead) {
        alert('Please select an authoritative tenant lead first.');
        return;
      }

      // Automatically activate call session on user message so text chat works independently
      setIsCallActive(true);
      setApiError(null);
      setCurrentUtterance('');
      setInterimTranscript('');

      // Stop recognition while turn is being processed to prevent acoustic loop
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      isListeningRef.current = false;
      setIsListening(false);

      isProcessingRef.current = true;
      setIsProcessing(true);
      setAgentState('PROCESSING');

      const now = formatTime(callDurationRef.current);
      // The current user message MUST be present as the final prospect message (PART 7)
      const updatedConversation = [
        ...conversationRef.current,
        {
          speaker: 'prospect' as const,
          role: 'user' as const,
          content: text,
          text,
          timestamp: now,
        },
      ];
      conversationRef.current = updatedConversation;
      setConversation(updatedConversation);

      console.log(
        `[VOICE DEBUG] event=api-request userUtterance="${text}" historyLength=${updatedConversation.length}`
      );

      try {
        const res = await fetch('/api/voice/agent-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: currentLead.id,
            leadName: currentLead.name,
            companyName: currentLead.companyName,
            userUtterance: text,
            locale: localeRef.current,
            conversationHistory: updatedConversation.map((c) => ({
              sender: c.speaker === 'agent' ? 'agent' : 'prospect',
              role: c.role || (c.speaker === 'agent' ? 'assistant' : 'user'),
              text: c.text,
              content: c.text,
            })),
            clientBusinessProfile: companyRef.current
              ? {
                  name: companyRef.current.name,
                  description: companyRef.current.description,
                  offerings: companyRef.current.offerings,
                }
              : undefined,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const reply = data.data.replyText;
          console.log(`[VOICE DEBUG] event=api-response reply="${reply}"`);

          const withAgentReply = [
            ...conversationRef.current,
            {
              speaker: 'agent' as const,
              role: 'assistant' as const,
              content: reply,
              text: reply,
              timestamp: formatTime(callDurationRef.current + 1),
              sentiment: data.data.sentiment,
            },
          ];
          conversationRef.current = withAgentReply;
          setConversation(withAgentReply);
          setCurrentStage(data.data.stage);

          if (data.data.isHighIntent) {
            setIsHighIntent(true);
          }

          if (data.data.smsDetails) {
            setSmsDetails(data.data.smsDetails);
          }

          if (data.data.extractedPhone && currentLead) {
            setLead((prev) => (prev ? { ...prev, phone: data.data.extractedPhone } : null));
          }

          speakAgentResponse(reply);
        } else {
          const errMsg = data.error || 'Failed to process voice agent turn';
          setApiError(errMsg);
          const withError = [
            ...conversationRef.current,
            {
              speaker: 'agent' as const,
              role: 'assistant' as const,
              content: `[Error: ${errMsg}]`,
              text: `[Error: ${errMsg}]`,
              timestamp: formatTime(callDurationRef.current + 1),
              sentiment: 'NEGATIVE',
            },
          ];
          conversationRef.current = withError;
          setConversation(withError);
          setAgentState('ERROR');
        }
      } catch (e: any) {
        console.error('Error in sendUserMessage:', e);
        const errMsg = e.message || 'Network error processing turn';
        setApiError(errMsg);
        setAgentState('ERROR');
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
        if (!isSpeakingRef.current) {
          setAgentState(shouldListenRef.current ? 'LISTENING' : 'IDLE');
        }
      }
    },
    [formatTime, speakAgentResponse]
  );

  // Maintain ref to latest sendUserMessage so SpeechRecognition always calls the latest logic
  useEffect(() => {
    sendUserMessageRef.current = sendUserMessage;
  }, [sendUserMessage]);

  // Create ONE stable SpeechRecognition instance for the component/locale (PARTS 1, 2, 4)
  // Dependencies MUST ONLY be [locale]
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    setIsSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const langMap: Record<SupportedLocale, string> = {
      en: 'en-US',
      es: 'es-ES',
      de: 'de-DE',
      hi: 'hi-IN',
      fr: 'fr-FR',
    };
    recognition.lang = langMap[locale] || 'en-US';

    // Only set isListening=true from recognition.onstart (PART 3)
    recognition.onstart = () => {
      console.log('[VOICE DEBUG] event=mic-start');
      isListeningRef.current = true;
      setIsListening(true);
      if (!isProcessingRef.current && !isSpeakingRef.current) {
        setAgentState('LISTENING');
      }
      setMicError(null);
    };

    recognition.onresult = (event: any) => {
      // PART 5: Suppress microphone input if AI is speaking
      if (isSpeakingRef.current) {
        return;
      }

      let interim = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      const trimmedFinal = finalTranscript.trim();
      // PART 4: Only send FINAL speech results. Prevent duplicate final results.
      if (trimmedFinal) {
        if (trimmedFinal !== lastFinalTranscriptRef.current && !isProcessingRef.current) {
          lastFinalTranscriptRef.current = trimmedFinal;
          setInterimTranscript('');
          console.log(`[VOICE DEBUG] event=mic-result transcript="${trimmedFinal}"`);

          // 1. Stop/pause recognition
          try {
            recognition.stop();
          } catch (e) {}

          // 2. Set LISTENING=false
          isListeningRef.current = false;
          setIsListening(false);

          // 3-8. Dispatch message
          sendUserMessageRef.current?.(trimmedFinal);
        }
      } else {
        setInterimTranscript(interim);
      }
    };

    // PART 2: Specific error handling without infinite auto-restart loops
    recognition.onerror = (event: any) => {
      console.log(
        `[VOICE DEBUG] event=mic-error error="${event.error}" message="${event.message || ''}"`
      );

      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      shouldListenRef.current = false;
      isListeningRef.current = false;
      setIsListening(false);
      setAgentState('ERROR');

      if (event.error === 'network' || event.error === 'service-not-allowed') {
        setMicError('Speech recognition service is unavailable. Check Chrome/network settings and try again.');
      } else if (event.error === 'not-allowed') {
        setMicError('Microphone permission denied. Allow microphone access for this site.');
      } else if (event.error === 'audio-capture') {
        setMicError('No microphone/audio input is available.');
      } else if (event.error === 'language-not-supported') {
        setMicError('Speech recognition does not support the selected language.');
      } else {
        setMicError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      if (shouldListenRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current && !isSpeakingRef.current && !isProcessingRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err: any) {
              if (!err?.message?.includes('already started')) {
                console.warn('[VOICE DEBUG] Recognition auto-restart suppressed:', err);
              }
            }
          }
        }, 250);
      } else {
        setIsListening(false);
        if (!isProcessingRef.current && !isSpeakingRef.current) {
          setAgentState('IDLE');
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      isListeningRef.current = false;
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [locale]);

  // Toggle Microphone with getUserMedia permission check (PART 3)
  const toggleMicrophone = async () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    if (isListeningRef.current || shouldListenRef.current) {
      // User explicitly stopped listening
      shouldListenRef.current = false;
      isListeningRef.current = false;
      setIsListening(false);
      setInterimTranscript('');
      setAgentState('IDLE');
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
    } else {
      // PART 3: Verify microphone access first with getUserMedia
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release test tracks so SpeechRecognition has clean microphone access
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        console.log(`[VOICE DEBUG] event=mic-error error="not-allowed" message="${err?.message || ''}"`);
        shouldListenRef.current = false;
        isListeningRef.current = false;
        setIsListening(false);
        setAgentState('ERROR');
        setMicError('Microphone permission denied. Allow microphone access for this site.');
        return;
      }

      if (!isCallActive) {
        setIsCallActive(true);
      }
      setMicError(null);
      shouldListenRef.current = true;
      // Do not fake UI as LISTENING before recognition actually starts!
      // Only set isListening=true from recognition.onstart.
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        if (!err?.message?.includes('already started')) {
          console.warn('[VOICE DEBUG] Error starting recognition:', err);
        }
      }
    }
  };

  // Start Voice Call Session
  const handleStartCall = async () => {
    const currentLead = leadRef.current;
    if (!currentLead) {
      alert('Please select a lead before starting the call.');
      return;
    }

    setIsCallActive(true);
    setCallDuration(0);
    setConversation([]);
    conversationRef.current = [];
    setIsHighIntent(false);
    setSmsDetails(null);
    setBookingSimulated(false);
    setWebhookResult(null);
    setApiError(null);
    setCurrentStage('CONNECTING');
    setAgentState('PROCESSING');

    // Generate initial greeting
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/voice/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: currentLead.id,
          leadName: currentLead.name,
          companyName: currentLead.companyName,
          userUtterance: 'Hello',
          locale: localeRef.current,
          clientBusinessProfile: companyRef.current
            ? {
                name: companyRef.current.name,
                description: companyRef.current.description,
                offerings: companyRef.current.offerings,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const greetingText = data.data.replyText;
        const now = formatTime(0);
        const initConversation = [
          {
            speaker: 'agent' as const,
            role: 'assistant' as const,
            content: greetingText,
            text: greetingText,
            timestamp: now,
          },
        ];
        conversationRef.current = initConversation;
        setConversation(initConversation);
        setCurrentStage(data.data.stage);
        speakAgentResponse(greetingText);
      } else {
        setApiError(data.error || 'Failed to start call');
        setAgentState('ERROR');
      }
    } catch (e: any) {
      console.error('Error starting voice call:', e);
      setApiError(e.message || 'Failed to start call');
      setAgentState('ERROR');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
      if (!isSpeakingRef.current) {
        setAgentState(shouldListenRef.current ? 'LISTENING' : 'IDLE');
      }
    }
  };

  // Simulate Human Handoff request
  const handleSimulateHandoff = async () => {
    if (!isCallActive || isProcessing) return;
    sendUserMessage('I want to speak with a human SDR and get a Calendly link.');
  };

  // Simulate lead booking on Calendly via webhook
  const handleSimulateCalendlyBooking = async () => {
    if (!lead) return;
    try {
      const res = await fetch('/api/webhooks/calendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          inviteeEmail: lead.businessEmail || 'lead@example.com',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingSimulated(true);
      }
    } catch (err) {
      console.error('Failed to simulate booking:', err);
    }
  };

  // Simulate Line Busy / Callback trigger
  const handleSimulateBusy = async () => {
    if (!isCallActive || !lead) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/voice/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
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
        const updated = [
          ...conversationRef.current,
          { speaker: 'agent' as const, text: reply, timestamp: formatTime(callDuration) },
        ];
        conversationRef.current = updated;
        setConversation(updated);
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
    if (!isCallActive || !lead) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/voice/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
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
        const updated = [
          ...conversationRef.current,
          { speaker: 'agent' as const, text: reply, timestamp: formatTime(callDuration) },
        ];
        conversationRef.current = updated;
        setConversation(updated);
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

  // End Call & Trigger Call Webhook Analysis
  const handleEndCall = async (manualDisposition?: any) => {
    setIsCallActive(false);
    shouldListenRef.current = false;
    isListeningRef.current = false;
    setIsListening(false);
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setAgentState('IDLE');
    setInterimTranscript('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (!lead) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setAgentState('PROCESSING');
    try {
      const res = await fetch('/api/voice/call-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          durationSeconds: callDuration || 45,
          transcript: conversationRef.current.map((c) => ({
            speaker: c.speaker,
            text: c.text,
            timestamp: c.timestamp,
          })),
          manualDisposition: manualDisposition || (isHighIntent ? 'INTERESTED' : 'INTERESTED'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookResult(data.data);
      }
    } catch (e) {
      console.error('Error ending call / webhook:', e);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
      setAgentState('IDLE');
    }
  };

  // Handle lead change from dropdown
  const handleLeadChange = (selectedId: string) => {
    if (isCallActive) {
      handleEndCall();
    }
    const found = leadsList.find((l) => l.id === selectedId);
    if (found) {
      setLead(found);
      leadRef.current = found;
      setConversation([]);
      conversationRef.current = [];
      setSmsDetails(null);
      setWebhookResult(null);
      setApiError(null);
      setMicError(null);
      if (onSelectLead) onSelectLead(found);
    }
  };

  if (isLoadingData) {
    return (
      <div className="w-full max-w-6xl mx-auto p-12 text-center text-slate-500 glass-card-solid rounded-3xl shadow-sm">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#0F0F12] mb-3" />
        <p className="text-sm font-bold text-[#0F0F12]">Loading Authenticated Tenant Leads...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="glass-card-solid rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12] text-xs px-3 py-1 rounded-full mb-2 font-semibold shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#E5C158]" />
              <span>
                {company?.name ? `${company.name} AI SDR` : 'LeadPoint AI Platform'} • Gemini Voice Pipeline
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F0F12] tracking-tight flex items-center gap-2">
              <span>Interactive AI Voice Agent Simulator</span>
            </h2>
            <p className="text-sm text-slate-600">
              Interactive voice simulation using real authenticated tenant leads and dynamic multi-turn qualification.
            </p>
          </div>

          {/* Lead Selector & Locale Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Authenticated Leads Dropdown */}
            {leadsList.length > 0 && (
              <div className="flex items-center space-x-2 bg-white/70 p-2 rounded-2xl border border-[#5C1D3A]/15 shadow-xs">
                <Users className="h-4 w-4 text-emerald-700 ml-2" />
                <span className="text-xs text-slate-700 font-bold">Lead:</span>
                <select
                  value={lead?.id || ''}
                  onChange={(e) => handleLeadChange(e.target.value)}
                  disabled={isCallActive}
                  className="bg-[#F2F0FF]/60 text-[#0F0F12] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#5C1D3A]/20 focus:outline-none focus:ring-1 focus:ring-[#0F0F12] cursor-pointer disabled:opacity-50 max-w-[200px] truncate"
                >
                  {leadsList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.companyName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Language / Locale Selector */}
            <div className="flex items-center space-x-3 bg-white/70 p-2 rounded-2xl border border-[#5C1D3A]/15 shadow-xs">
              <Globe className="h-4 w-4 text-[#0F0F12] ml-2" />
              <span className="text-xs text-slate-700 font-bold">Locale:</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                disabled={isCallActive}
                className="bg-[#F2F0FF]/60 text-[#0F0F12] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#5C1D3A]/20 focus:outline-none focus:ring-1 focus:ring-[#0F0F12] cursor-pointer disabled:opacity-50"
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
      </div>

      {/* Browser Speech Support Warning Banner */}
      {!isSpeechSupported && (
        <div className="bg-[#FBBF24]/15 border border-[#FBBF24]/40 text-amber-900 text-xs px-5 py-3 rounded-2xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Speech recognition is not supported in this browser. Please use Google Chrome.</span>
        </div>
      )}

      {/* Mic Error Banner */}
      {micError && (
        <div className="bg-[#F87171]/15 border border-[#F87171]/40 text-rose-900 text-xs px-5 py-3 rounded-2xl flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{micError}</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setMicError(null);
                toggleMicrophone();
              }}
              className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition shadow-xs"
            >
              Retry Microphone
            </button>
            <button onClick={() => setMicError(null)} className="text-slate-600 hover:text-[#0F0F12] font-mono text-[10px]">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* API Error Banner */}
      {apiError && (
        <div className="bg-[#F87171]/15 border border-[#F87171]/40 text-rose-900 text-xs px-5 py-3 rounded-2xl flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>API Error: {apiError}</span>
          </span>
          <button onClick={() => setApiError(null)} className="text-slate-600 hover:text-[#0F0F12] font-mono text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* If No Lead Selected */}
      {!lead ? (
        <div className="glass-card-solid rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="p-4 bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-amber-700 rounded-2xl inline-block">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-extrabold text-[#0F0F12]">No lead selected</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            You do not currently have a selected lead for this session. Discover or import leads in the Lead Discovery page to begin AI voice interactions.
          </p>
          <a
            href="/en/leads"
            className="btn-primary-black inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold"
          >
            <span>Go to Lead Discovery</span>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Call Control Visualizer & Status */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card-solid rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              {/* Prospect Badge */}
              <div className="w-full bg-white/70 rounded-2xl p-4 border border-[#5C1D3A]/15 mb-6 text-left shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                    Database Lead Record
                  </span>
                  <span className="text-[10px] font-mono bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12] px-2 py-0.5 rounded-full font-bold">
                    ID: {lead.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="font-extrabold text-[#0F0F12] text-base">{lead.name}</div>
                <div className="text-xs text-slate-600">
                  {lead.companyName} • {lead.industry}
                </div>
                <div className="flex items-center space-x-1.5 mt-2">
                  <Phone className="h-3.5 w-3.5 text-emerald-700" />
                  <span className={`text-xs font-mono font-bold ${lead.phone ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {lead.phone || 'No phone number on record'}
                  </span>
                </div>
              </div>

              {/* Audio Waveform & Pulse Ring Animation */}
              <div className="relative my-4 flex items-center justify-center">
                {isCallActive && (
                  <>
                    <div
                      className={`absolute w-36 h-36 rounded-full border-2 animate-ping ${
                        agentState === 'SPEAKING'
                          ? 'border-[#E5C158]/50'
                          : agentState === 'LISTENING'
                          ? 'border-[#34D399]/60'
                          : agentState === 'PROCESSING'
                          ? 'border-[#FBBF24]/50'
                          : 'border-[#34D399]/50'
                      }`}
                    />
                    <div
                      className={`absolute w-28 h-28 rounded-full blur-xl ${
                        agentState === 'SPEAKING'
                          ? 'bg-[#E5C158]/20'
                          : agentState === 'LISTENING'
                          ? 'bg-[#34D399]/20'
                          : agentState === 'PROCESSING'
                          ? 'bg-[#FBBF24]/20'
                          : 'bg-[#34D399]/20'
                      }`}
                    />
                  </>
                )}

                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCallActive
                      ? agentState === 'SPEAKING'
                        ? 'bg-[#0F0F12] text-[#F6E27A] border border-[#E5C158]/40 shadow-lg shadow-[#0F0F12]/30 ring-4 ring-[#E6F0FA]'
                        : agentState === 'LISTENING'
                        ? 'bg-[#34D399] text-white shadow-lg shadow-[#34D399]/30 ring-4 ring-[#34D399]/20'
                        : agentState === 'PROCESSING'
                        ? 'bg-[#FBBF24] text-white shadow-lg shadow-[#FBBF24]/30 ring-4 ring-[#FBBF24]/20'
                        : 'bg-[#0F0F12] text-white shadow-lg ring-4 ring-[#E6F0FA]'
                      : 'bg-white/80 text-slate-400 border border-[#5C1D3A]/20'
                  }`}
                >
                  {isCallActive ? (
                    agentState === 'SPEAKING' ? (
                      <Volume2 className="h-10 w-10 animate-pulse text-[#F6E27A]" />
                    ) : agentState === 'LISTENING' ? (
                      <Mic className="h-10 w-10 animate-pulse" />
                    ) : (
                      <PhoneCall className="h-10 w-10 text-[#F6E27A]" />
                    )
                  ) : (
                    <PhoneOff className="h-10 w-10" />
                  )}
                </div>
              </div>

              {/* Call State & Timer */}
              <div className="mt-2 space-y-1">
                <div className="font-mono text-3xl font-extrabold text-[#0F0F12] tracking-widest">
                  {isCallActive ? formatTime(callDuration) : '00:00'}
                </div>
                <div className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      agentState === 'SPEAKING'
                        ? 'bg-[#E5C158] animate-pulse'
                        : agentState === 'LISTENING'
                        ? 'bg-[#34D399] animate-pulse'
                        : agentState === 'PROCESSING'
                        ? 'bg-[#FBBF24] animate-pulse'
                        : agentState === 'ERROR'
                        ? 'bg-[#F87171]'
                        : isCallActive
                        ? 'bg-[#34D399]'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {agentState === 'SPEAKING'
                      ? 'AI Speaking...'
                      : agentState === 'PROCESSING'
                      ? 'Processing Turn...'
                      : agentState === 'LISTENING'
                      ? 'Active Listening...'
                      : agentState === 'ERROR'
                      ? 'Microphone Error'
                      : isCallActive
                      ? 'Call Connected'
                      : 'Call Disconnected'}
                  </span>
                </div>
              </div>

              {/* Real-time Intent & Stage Badges */}
              {isCallActive && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-white/80 text-[#0F0F12] font-mono border border-[#5C1D3A]/20 font-bold">
                    Stage: {currentStage}
                  </span>
                  {isHighIntent && (
                    <span className="text-xs px-3 py-1 rounded-full bg-[#FBBF24]/20 text-amber-900 font-extrabold border border-[#FBBF24]/40 flex items-center gap-1 shadow-xs">
                      <Flame className="h-3.5 w-3.5 text-amber-600" />
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
                    className="w-full btn-primary-black py-3 px-4 text-sm font-bold flex items-center justify-center space-x-2"
                  >
                    <PhoneCall className="h-4 w-4 text-[#F6E27A]" />
                    <span>Start Voice Call Simulation</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleEndCall()}
                    className="w-full btn-danger-crimson py-3 px-4 text-sm font-bold flex items-center justify-center space-x-2"
                  >
                    <PhoneOff className="h-4 w-4 text-white" />
                    <span>End Call & Process Webhook</span>
                  </button>
                )}

                {/* In-Call Simulation Utility Actions */}
                {isCallActive && (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={toggleMicrophone}
                        disabled={!isSpeechSupported || isProcessing}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                          agentState === 'LISTENING'
                            ? 'bg-[#34D399]/15 border-[#34D399]/40 text-emerald-900 ring-2 ring-[#34D399]/30'
                            : agentState === 'ERROR'
                            ? 'bg-[#F87171]/15 border-[#F87171]/40 text-rose-900'
                            : 'bg-white/80 border-[#5C1D3A]/15 text-[#0F0F12] hover:bg-white disabled:opacity-50'
                        }`}
                      >
                        {agentState === 'LISTENING' ? (
                          <Mic className="h-4 w-4 text-emerald-700 animate-pulse" />
                        ) : agentState === 'ERROR' ? (
                          <AlertTriangle className="h-4 w-4 text-rose-600" />
                        ) : (
                          <MicOff className="h-4 w-4 text-slate-500" />
                        )}
                        <span>
                          {agentState === 'LISTENING'
                            ? 'Stop Mic'
                            : agentState === 'PROCESSING'
                            ? 'Processing'
                            : agentState === 'SPEAKING'
                            ? 'Speaking'
                            : 'Click Mic'}
                        </span>
                      </button>

                      <button
                        onClick={handleSimulateBusy}
                        disabled={isProcessing}
                        className="py-2 px-2 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/40 text-amber-900 hover:bg-[#FBBF24]/25 text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition"
                      >
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span>Line Busy</span>
                      </button>

                      <button
                        onClick={handleSimulateVoicemail}
                        disabled={isProcessing}
                        className="py-2 px-2 rounded-xl bg-blue-500/10 border border-blue-400/30 text-blue-900 hover:bg-blue-500/20 text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition"
                      >
                        <MessageSquare className="h-4 w-4 text-blue-700" />
                        <span>Voicemail</span>
                      </button>
                    </div>

                    <button
                      onClick={handleSimulateHandoff}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12] hover:bg-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#E5C158]" />
                      <span>Ask for Human SDR & Calendly SMS</span>
                    </button>
                  </div>
                )}

                {/* Real-time SMS Notification Banner */}
                {smsDetails && (
                  <div className="w-full mt-4 bg-white/80 border border-[#5C1D3A]/20 rounded-2xl p-4 text-left space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#0F0F12] flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <span>Human Handoff Triggered</span>
                      </span>
                      <span className="text-[10px] font-mono bg-[#E6F0FA] text-[#0F0F12] px-2 py-0.5 rounded-full border border-[#5C1D3A]/20 font-bold">
                        SMS: {smsDetails.provider?.toUpperCase()} ({smsDetails.status})
                      </span>
                    </div>
                    {smsDetails.sent ? (
                      <>
                        <div className="text-xs text-slate-700 font-mono">
                          Recipient: <span className="text-emerald-800 font-bold">{smsDetails.recipient}</span>
                        </div>
                        <div className="text-[11px] text-slate-800 bg-[#E6F0FA]/70 p-2.5 rounded-xl border border-[#5C1D3A]/15 font-mono break-all leading-relaxed">
                          {smsDetails.message}
                        </div>
                        {!bookingSimulated ? (
                          <button
                            onClick={handleSimulateCalendlyBooking}
                            className="w-full mt-2 btn-success-mint py-2 px-3 text-xs font-bold transition flex items-center justify-center space-x-1"
                          >
                            <span>Simulate Lead Booking on Calendly</span>
                          </button>
                        ) : (
                          <div className="text-xs text-emerald-900 font-extrabold bg-[#34D399]/20 p-2 rounded-xl border border-[#34D399]/40 flex items-center justify-center space-x-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Lead Status Updated: BOOKED</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-rose-800 font-semibold">
                        Unable to send booking link: {smsDetails.error || 'SMS send failed.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Transcript Stream & Dual Input */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card-solid rounded-3xl p-6 shadow-sm flex flex-col h-[520px]">
              <div className="flex items-center justify-between pb-4 border-b border-[#5C1D3A]/15 mb-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-[#0F0F12]" />
                  <span className="font-extrabold text-[#0F0F12] text-sm">Live Audio Transcript Stream</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isListening && (
                    <span className="text-xs font-mono bg-[#34D399]/15 text-emerald-900 border border-[#34D399]/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse font-bold">
                      <Mic className="h-3 w-3 text-emerald-700" />
                      <span>Live Mic</span>
                    </span>
                  )}
                  <span className="text-xs font-mono bg-white/70 text-slate-700 px-2.5 py-0.5 rounded-full border border-[#5C1D3A]/15 font-bold">
                    {conversation.length} turn(s)
                  </span>
                </div>
              </div>

              {/* Scrollable Conversation History */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 bg-white/40 p-3 rounded-2xl border border-[#5C1D3A]/10">
                {conversation.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-2">
                    <PhoneCall className="h-8 w-8 text-[#0F0F12]/30 mb-2" />
                    <p className="text-sm font-bold text-[#0F0F12]">No active transcript.</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Type a message below or click "Start Voice Call Simulation" to establish call connection with {company?.name || 'LeadPoint AI'}.
                    </p>
                  </div>
                ) : (
                  conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${msg.speaker === 'agent' ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-mono text-slate-400">{msg.timestamp}</span>
                        <span
                          className={`text-xs font-bold ${
                            msg.speaker === 'agent' ? 'text-[#0F0F12]' : 'text-slate-700'
                          }`}
                        >
                          {msg.speaker === 'agent' ? `AI Voice Agent (${company?.name || 'Alex'})` : lead.name}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                          msg.speaker === 'agent'
                            ? 'bg-white border border-[#5C1D3A]/15 text-[#0F0F12] rounded-tl-xs'
                            : 'bg-[#0F0F12] text-white rounded-tr-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}

                {/* Interim Live Speech Bubble */}
                {isListening && interimTranscript && (
                  <div className="flex flex-col items-end opacity-85">
                    <span className="text-[10px] font-mono text-emerald-800 font-bold mb-1">Hearing...</span>
                    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs bg-[#34D399]/15 border border-[#34D399]/40 text-emerald-900 italic font-medium">
                      "{interimTranscript}"
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="flex items-center space-x-2 text-slate-600 text-xs py-2 font-medium">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0F0F12]" />
                    <span>Gemini Voice Engine generating turn response...</span>
                  </div>
                )}
              </div>

              {/* Input Box for Speech / Text Dual Mode */}
              <div className="pt-4 border-t border-[#5C1D3A]/15 mt-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendUserMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={currentUtterance}
                    onChange={(e) => setCurrentUtterance(e.target.value)}
                    disabled={isProcessing}
                    placeholder={
                      isProcessing
                        ? 'AI is thinking...'
                        : isSpeaking
                        ? 'AI is speaking... (or type your response)'
                        : isListening
                        ? 'Microphone listening (speak or type response)...'
                        : 'Type prospect response or click microphone to speak...'
                    }
                    className="flex-1 bg-white/90 border border-[#5C1D3A]/20 rounded-xl px-4 py-2.5 text-sm text-[#0F0F12] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F0F12] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!currentUtterance.trim() || isProcessing}
                    className="p-2.5 rounded-xl bg-[#0F0F12] text-[#F6E27A] border border-[#E5C158]/30 disabled:opacity-40 transition shadow-xs"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Post-Call Intelligence Card */}
      {webhookResult && (
        <div className="glass-card-solid rounded-3xl p-6 shadow-sm space-y-4 border border-[#34D399]/40">
          <div className="flex items-center justify-between border-b border-[#5C1D3A]/15 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-[#34D399]/15 border border-[#34D399]/40 text-emerald-800">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0F0F12] text-lg flex items-center gap-2">
                  <span>Structured Call Webhook Processed</span>
                  {webhookResult.isHighIntentFlagged && (
                    <span className="text-xs bg-[#FBBF24]/20 text-amber-900 font-extrabold border border-[#FBBF24]/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="h-3 w-3 text-amber-600" />
                      <span>🔥 HIGH INTENT / INTERESTED</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-600">
                  API `/api/voice/call-webhook` written to database for Lead:{' '}
                  <strong className="text-[#0F0F12]">{webhookResult.leadName}</strong> ({webhookResult.companyName})
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-white/70 text-slate-700 px-3 py-1 rounded-full border border-[#5C1D3A]/15 font-bold">
              Call ID: {webhookResult.callId}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/70 p-4 rounded-2xl border border-[#5C1D3A]/15">
              <span className="text-xs text-slate-500 font-mono block mb-1 font-bold">Sentiment & Disposition</span>
              <div className="font-extrabold text-[#0F0F12] text-base">{webhookResult.sentiment}</div>
              <div className="text-xs text-[#0F0F12] font-mono mt-1 font-bold">Disposition: {webhookResult.disposition}</div>
            </div>

            <div className="bg-white/70 p-4 rounded-2xl border border-[#5C1D3A]/15 md:col-span-2">
              <span className="text-xs text-slate-500 font-mono block mb-1 font-bold">Next Best Action</span>
              <div className="font-bold text-emerald-900 text-sm">{webhookResult.nextBestAction}</div>
            </div>
          </div>

          <div className="bg-white/70 p-4 rounded-2xl border border-[#5C1D3A]/15">
            <span className="text-xs text-slate-500 font-mono block mb-2 font-bold">Bulleted Executive Summary</span>
            <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
              {webhookResult.summaryBulletPoints.join('\n')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
