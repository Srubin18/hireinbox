'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

/* ===========================================
   HIREINBOX VOICE AI INTERVIEW
   Real-time voice conversation with candidates
   Uses OpenAI Realtime API
   =========================================== */

// Types
interface TranscriptItem {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface InterviewSession {
  sessionId: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    currentTitle: string | null;
    yearsExperience: number | null;
    aiScore: number | null;
    aiRecommendation: string | null;
  };
  role: {
    id: string;
    title: string;
  } | null;
  interviewPlan: {
    summary: {
      candidate_name: string;
      role_title: string;
      estimated_duration_minutes: number;
      difficulty_level: string;
    };
    focusAreas: string[];
    questionCount: number;
    openingScript: string;
    closingScript: string;
  };
  voiceInstructions: string;
}

interface AnalysisResult {
  summary: {
    duration_minutes: number;
    questions_answered: number;
    overall_impression: string;
  };
  scores: Record<string, { score: number; evidence: string[]; notes: string }>;
  overallScore: number;
  recommendation: string;
  recommendationReason: string;
  keyStrengths: Array<{ strength: string; evidence: string; impact: string }>;
  concerns: Array<{ concern: string; evidence: string; severity: string; mitigation: string }>;
  hiringManagerNotes: string;
}

type InterviewState = 'loading' | 'ready' | 'connecting' | 'active' | 'ending' | 'analyzing' | 'complete' | 'error';

// Logo Component
const Logo = ({ size = 32 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>AI Interview</span>
    </div>
  </div>
);

// Voice Visualizer - animated waveform
const VoiceVisualizer = ({ isActive, isSpeaking }: { isActive: boolean; isSpeaking: boolean }) => {
  const bars = 12;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      height: 60,
    }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: isActive ? `${20 + Math.random() * 40}px` : '8px',
            backgroundColor: isSpeaking ? '#10B981' : '#4F46E5',
            borderRadius: 2,
            transition: isActive ? 'height 0.1s ease' : 'height 0.3s ease',
            animation: isActive ? `pulse${i % 3} 0.${3 + (i % 4)}s ease-in-out infinite` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse0 { 0%, 100% { height: 15px; } 50% { height: 45px; } }
        @keyframes pulse1 { 0%, 100% { height: 25px; } 50% { height: 55px; } }
        @keyframes pulse2 { 0%, 100% { height: 20px; } 50% { height: 40px; } }
      `}</style>
    </div>
  );
};

// Timer display
const InterviewTimer = ({ startTime, isActive }: { startTime: number | null; isActive: boolean }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime || !isActive) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div style={{
      fontFamily: 'monospace',
      fontSize: '1.5rem',
      fontWeight: 600,
      color: isActive ? '#0F172A' : '#94A3B8',
    }}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
};

// Transcript display
const TranscriptView = ({ items, autoScroll = true }: { items: TranscriptItem[]; autoScroll?: boolean }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items, autoScroll]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#94A3B8',
          padding: 32,
          fontStyle: 'italic',
        }}>
          Conversation will appear here...
        </div>
      ) : (
        items.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: item.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              fontSize: '0.75rem',
              color: '#94A3B8',
              marginBottom: 4,
              fontWeight: 500,
            }}>
              {item.role === 'assistant' ? 'Interviewer' : 'You'}
            </div>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: 16,
              backgroundColor: item.role === 'user' ? '#4F46E5' : '#F1F5F9',
              color: item.role === 'user' ? 'white' : '#0F172A',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              borderBottomLeftRadius: item.role === 'assistant' ? 4 : 16,
              borderBottomRightRadius: item.role === 'user' ? 4 : 16,
            }}>
              {item.text}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Main Interview Page Component
export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.candidateId as string;

  // State
  const [state, setState] = useState<InterviewState>('loading');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize session
  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, [candidateId]);

  const initializeSession = async () => {
    try {
      setState('loading');
      setError(null);

      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start interview');
      }

      setSession(data);
      setState('ready');

      // Check microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setMicPermission('granted');
      } catch {
        setMicPermission('denied');
      }

    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load interview');
      setState('error');
    }
  };

  const startInterview = async () => {
    if (!session) return;

    try {
      setState('connecting');
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Create audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });

      // Connect to OpenAI Realtime API
      await connectToRealtimeAPI();

      setState('active');
      setStartTime(Date.now());

    } catch (err) {
      console.error('Failed to start interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setState('error');
    }
  };

  const connectToRealtimeAPI = async () => {
    return new Promise<void>((resolve, reject) => {
      // Get API key from environment (passed through session or fetched separately)
      // In production, you'd want a secure token exchange
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        // Fallback: Use a server-side proxy approach
        console.warn('No API key available, using mock mode');
        startMockInterview();
        resolve();
        return;
      }

      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;

      const ws = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${apiKey}`,
        'openai-beta.realtime-v1',
      ]);

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Interview] WebSocket connected');
        configureSession();
        resolve();
      };

      ws.onclose = () => {
        console.log('[Interview] WebSocket closed');
        setVoiceState('idle');
      };

      ws.onerror = (event) => {
        console.error('[Interview] WebSocket error:', event);
        reject(new Error('Connection failed'));
      };

      ws.onmessage = (event) => {
        handleWebSocketMessage(event.data);
      };
    });
  };

  const startMockInterview = () => {
    // Mock mode for demo/development without API key
    console.log('[Interview] Starting mock interview mode');

    // Simulate AI greeting
    setTimeout(() => {
      addTranscriptItem({
        role: 'assistant',
        text: `Hello ${session?.candidate.name || 'there'}! Welcome to your interview for the ${session?.role?.title || 'position'}. This is a demo mode interview. In the full version, you would be having a real voice conversation with our AI interviewer. Let me start with a few questions...`,
        timestamp: Date.now(),
      });
    }, 1000);

    // Simulate follow-up questions
    const mockQuestions = [
      "Can you tell me about your current role and key responsibilities?",
      "What achievement are you most proud of in your career?",
      "Why are you interested in this position?",
    ];

    let delay = 5000;
    mockQuestions.forEach((q) => {
      setTimeout(() => {
        addTranscriptItem({
          role: 'assistant',
          text: q,
          timestamp: Date.now(),
        });
      }, delay);
      delay += 8000;
    });
  };

  const configureSession = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: session?.voiceInstructions || getDefaultInstructions(),
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        temperature: 0.8,
        max_response_output_tokens: 4096,
      },
    };

    wsRef.current.send(JSON.stringify(sessionConfig));

    // Start microphone capture
    startMicrophoneCapture();
  };

  const getDefaultInstructions = () => {
    return `You are a professional AI interviewer.
    Start by greeting the candidate and explaining this is a 10-12 minute screening interview.
    Ask clear questions one at a time and wait for responses.
    Keep your responses brief (2-3 sentences) since this is voice conversation.
    Be warm but professional.`;
  };

  const startMicrophoneCapture = () => {
    if (!mediaStreamRef.current || !audioContextRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(inputData);
      const base64Audio = arrayBufferToBase64(pcm16);

      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      }));
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
  };

  const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleWebSocketMessage = (data: string) => {
    try {
      const event = JSON.parse(data);

      switch (event.type) {
        case 'session.created':
        case 'session.updated':
          console.log('[Interview] Session configured');
          break;

        case 'input_audio_buffer.speech_started':
          setVoiceState('listening');
          break;

        case 'input_audio_buffer.speech_stopped':
          setVoiceState('processing');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          if (event.transcript) {
            addTranscriptItem({
              role: 'user',
              text: event.transcript,
              timestamp: Date.now(),
            });
          }
          break;

        case 'response.created':
          setVoiceState('speaking');
          break;

        case 'response.audio.delta':
          handleAudioDelta(event.delta);
          break;

        case 'response.audio_transcript.done':
          if (event.transcript) {
            addTranscriptItem({
              role: 'assistant',
              text: event.transcript,
              timestamp: Date.now(),
            });
          }
          break;

        case 'response.done':
          setVoiceState('idle');
          break;

        case 'error':
          console.error('[Interview] API error:', event.error);
          setError(event.error?.message || 'An error occurred');
          break;
      }
    } catch (err) {
      console.error('[Interview] Failed to parse message:', err);
    }
  };

  const handleAudioDelta = (delta: string) => {
    if (!delta) return;

    const binaryString = atob(delta);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    audioQueueRef.current.push(bytes.buffer);
    playAudioQueue();
  };

  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    // Combine queued chunks
    const combinedLength = audioQueueRef.current.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combined = new Uint8Array(combinedLength);
    let offset = 0;

    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift()!;
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // Convert to Float32
    const float32 = new Float32Array(combined.length / 2);
    const dataView = new DataView(combined.buffer);
    for (let i = 0; i < float32.length; i++) {
      float32[i] = dataView.getInt16(i * 2, true) / 32768;
    }

    // Play
    const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      playAudioQueue();
    };
    source.start();
  };

  const addTranscriptItem = useCallback((item: TranscriptItem) => {
    setTranscript(prev => [...prev, item]);
  }, []);

  const endInterview = async () => {
    setState('ending');

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    // Analyze interview
    setState('analyzing');

    try {
      const duration = startTime ? Math.floor((Date.now() - startTime) / 60000) : 10;

      const response = await fetch('/api/interview/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId,
          candidateId,
          transcript,
          duration,
          roleId: session?.role?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);
      setState('complete');

    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze interview');
      setState('complete'); // Still show complete, but with error
    }
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Render based on state
  if (state === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid #E2E8F0',
            borderTopColor: '#4F46E5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748B' }}>Preparing interview...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: 400,
          padding: 32,
          backgroundColor: 'white',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{
            width: 64,
            height: 64,
            backgroundColor: '#FEE2E2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: '#64748B', marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (state === 'complete') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          padding: '16px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Logo />
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#64748B',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Back to Dashboard
          </button>
        </header>

        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 24px',
        }}>
          {/* Success Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: 40,
          }}>
            <div style={{
              width: 80,
              height: 80,
              backgroundColor: '#D1FAE5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Interview Complete
            </h1>
            <p style={{ color: '#64748B' }}>
              {session?.candidate.name}'s interview has been recorded and analyzed
            </p>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div style={{
              display: 'grid',
              gap: 24,
            }}>
              {/* Score Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 32,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 32,
              }}>
                <div style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  border: '8px solid',
                  borderColor: analysis.overallScore >= 70 ? '#10B981' : analysis.overallScore >= 50 ? '#F59E0B' : '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A' }}>
                    {analysis.overallScore}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>out of 100</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: analysis.recommendation === 'STRONG_YES' || analysis.recommendation === 'YES' ? '#D1FAE5' : analysis.recommendation === 'MAYBE' ? '#FEF3C7' : '#FEE2E2',
                    color: analysis.recommendation === 'STRONG_YES' || analysis.recommendation === 'YES' ? '#059669' : analysis.recommendation === 'MAYBE' ? '#D97706' : '#DC2626',
                    borderRadius: 100,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}>
                    {analysis.recommendation.replace('_', ' ')}
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
                    {analysis.summary.overall_impression}
                  </h2>
                  <p style={{ color: '#64748B', margin: 0 }}>
                    {analysis.recommendationReason}
                  </p>
                </div>
              </div>

              {/* Scores Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
              }}>
                {Object.entries(analysis.scores).map(([key, value]) => (
                  <div key={key} style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 20,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>
                        {key.replace('_', ' ')}
                      </span>
                      <span style={{
                        fontWeight: 700,
                        color: value.score >= 70 ? '#10B981' : value.score >= 50 ? '#F59E0B' : '#EF4444',
                      }}>
                        {value.score}
                      </span>
                    </div>
                    <div style={{
                      height: 6,
                      backgroundColor: '#E2E8F0',
                      borderRadius: 100,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${value.score}%`,
                        backgroundColor: value.score >= 70 ? '#10B981' : value.score >= 50 ? '#F59E0B' : '#EF4444',
                        borderRadius: 100,
                      }} />
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '8px 0 0' }}>
                      {value.notes}
                    </p>
                  </div>
                ))}
              </div>

              {/* Key Strengths */}
              {analysis.keyStrengths.length > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
                    Key Strengths
                  </h3>
                  {analysis.keyStrengths.map((s, i) => (
                    <div key={i} style={{
                      padding: 16,
                      backgroundColor: '#F0FDF4',
                      borderRadius: 8,
                      borderLeft: '4px solid #10B981',
                      marginBottom: i < analysis.keyStrengths.length - 1 ? 12 : 0,
                    }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{s.strength}</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748B', fontStyle: 'italic' }}>"{s.evidence}"</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hiring Manager Notes */}
              <div style={{
                backgroundColor: '#4F46E5',
                borderRadius: 16,
                padding: 24,
                color: 'white',
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>
                  Hiring Manager Notes
                </h3>
                <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.9 }}>
                  {analysis.hiringManagerNotes}
                </p>
              </div>
            </div>
          )}

          {/* Transcript */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            marginTop: 24,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
              Interview Transcript
            </h3>
            <div style={{
              maxHeight: 400,
              overflowY: 'auto',
              padding: 16,
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
            }}>
              {transcript.map((item, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: item.role === 'assistant' ? '#4F46E5' : '#10B981', marginBottom: 4 }}>
                    {item.role === 'assistant' ? 'Interviewer' : 'Candidate'}
                  </div>
                  <div style={{ fontSize: '0.9375rem', color: '#0F172A', lineHeight: 1.5 }}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ready / Active Interview State
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        padding: '16px 24px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Logo />
        {state === 'active' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <InterviewTimer startTime={startTime} isActive={state === 'active'} />
            <button
              onClick={endInterview}
              style={{
                padding: '8px 16px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              End Interview
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 900,
        margin: '0 auto',
        width: '100%',
        padding: '24px',
      }}>
        {/* Ready / Connecting State */}
        {(state === 'ready' || state === 'connecting') && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 48,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}>
              {/* Candidate Info */}
              <div style={{
                width: 80,
                height: 80,
                backgroundColor: '#4F46E5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '2rem',
                color: 'white',
                fontWeight: 700,
              }}>
                {session?.candidate.name?.charAt(0).toUpperCase() || 'C'}
              </div>

              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                {session?.candidate.name}
              </h1>
              <p style={{ color: '#64748B', marginBottom: 8 }}>
                {session?.candidate.currentTitle || 'Candidate'}{session?.candidate.yearsExperience ? ` - ${session.candidate.yearsExperience} years experience` : ''}
              </p>
              <p style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                borderRadius: 100,
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: 32,
              }}>
                {session?.role?.title || 'General Interview'}
              </p>

              {/* Interview Plan Summary */}
              <div style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 12,
                padding: 20,
                marginBottom: 32,
                textAlign: 'left',
              }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>
                  Interview Plan
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Duration</div>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>
                      ~{session?.interviewPlan.summary.estimated_duration_minutes || 12} minutes
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Questions</div>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>
                      {session?.interviewPlan.questionCount || 8} questions
                    </div>
                  </div>
                </div>
                {session?.interviewPlan.focusAreas && session.interviewPlan.focusAreas.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 4 }}>Focus Areas</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {session.interviewPlan.focusAreas.slice(0, 3).map((area, i) => (
                        <span key={i} style={{
                          padding: '4px 10px',
                          backgroundColor: '#E0E7FF',
                          color: '#4338CA',
                          borderRadius: 100,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}>
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Microphone Permission */}
              {micPermission === 'denied' && (
                <div style={{
                  backgroundColor: '#FEF3C7',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#92400E' }}>Microphone Access Required</div>
                    <div style={{ fontSize: '0.875rem', color: '#B45309' }}>
                      Please allow microphone access to start the interview
                    </div>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={startInterview}
                disabled={state === 'connecting'}
                style={{
                  width: '100%',
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  cursor: state === 'connecting' ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 8px 30px rgba(79, 70, 229, 0.4)',
                }}
              >
                {state === 'connecting' ? (
                  <>
                    <div style={{
                      width: 20,
                      height: 20,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="22"/>
                    </svg>
                    Start Voice Interview
                  </>
                )}
              </button>

              <p style={{ marginTop: 16, fontSize: '0.875rem', color: '#94A3B8' }}>
                The interview will be recorded for review
              </p>
            </div>
          </div>
        )}

        {/* Active Interview State */}
        {(state === 'active' || state === 'ending' || state === 'analyzing') && (
          <>
            {/* Voice Status */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 16,
            }}>
              <VoiceVisualizer
                isActive={voiceState === 'listening' || voiceState === 'speaking'}
                isSpeaking={voiceState === 'speaking'}
              />
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: voiceState === 'listening' ? '#10B981' : voiceState === 'speaking' ? '#4F46E5' : '#94A3B8',
              }}>
                {voiceState === 'listening' && 'Listening...'}
                {voiceState === 'speaking' && 'AI Speaking...'}
                {voiceState === 'processing' && 'Processing...'}
                {voiceState === 'idle' && 'Waiting...'}
              </div>
            </div>

            {/* Transcript */}
            <div style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                fontWeight: 600,
                color: '#0F172A',
              }}>
                Conversation
              </div>
              <TranscriptView items={transcript} />
            </div>

            {/* Analyzing overlay */}
            {(state === 'ending' || state === 'analyzing') && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: 20,
                  padding: 40,
                  textAlign: 'center',
                  maxWidth: 400,
                }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    border: '4px solid #E2E8F0',
                    borderTopColor: '#4F46E5',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 24px',
                  }} />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                    {state === 'ending' ? 'Ending Interview...' : 'Analyzing Interview...'}
                  </h2>
                  <p style={{ color: '#64748B' }}>
                    {state === 'ending' ? 'Saving transcript...' : 'Extracting insights and scoring responses...'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
