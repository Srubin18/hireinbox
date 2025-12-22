'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/* ===========================================
   HIREINBOX B2C - World-Class CV Analysis
   Matching the premium design reference
   =========================================== */

// Types
interface StrengthItem {
  strength: string;
  evidence: string;
  impact: string;
}

interface ImprovementItem {
  area: string;
  current_state: string;
  suggestion: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface CareerInsights {
  natural_fit_roles: Array<{ role: string; match: number }> | string[];
  industries: string[];
  trajectory_observation: string;
}

interface CVAnalysis {
  candidate_name: string | null;
  current_title: string | null;
  years_experience: number | null;
  education_level: string | null;
  overall_score: number;
  score_explanation: string;
  first_impression: string;
  strengths: StrengthItem[];
  improvements: ImprovementItem[];
  quick_wins: string[];
  career_insights: CareerInsights;
  summary: string;
}

// Ferrari-grade Video Analysis - FACS-based with timeline and transparency
interface VideoAnalysis {
  overall_score: number;
  overall_score_breakdown: string;
  score_headline: string;
  percentile_estimate: string;
  scores: {
    clarity: { score: number; calculation: string };
    confidence: { score: number; calculation: string };
    engagement: { score: number; calculation: string };
    authenticity: { score: number; calculation: string };
  };
  expression_analysis: {
    positive_expressions: string[];
    areas_to_improve: string[];
    warmth_indicators: {
      genuine_smiles: boolean;
      expression_consistency: string;
      overall_warmth: string;
    };
  };
  timeline: {
    journey_summary: string;
    trajectory: string;
    frames: Array<{
      timestamp: string;
      dominant_emotion: string;
      energy_level: number;
      eye_contact: string;
      key_observation: string;
    }>;
    peak_moment: { timestamp: string; description: string };
    dip_moment: { timestamp: string; description: string };
  };
  visual_analysis: {
    eye_contact_percentage: number;
    eye_contact_detail: string;
    posture: string;
    posture_detail: string;
    gestures: string;
    gesture_detail: string;
    facial_mobility: string;
    background: string;
    lighting: string;
    overall_visual_impression: string;
  };
  voice_analysis: {
    estimated_wpm: number;
    wpm_assessment: string;
    filler_count: number;
    fillers_detected: string[];
    filler_density: string;
    power_words_used: string[];
    weak_words_used: string[];
    verbal_confidence_score: number;
    verbal_confidence_detail: string;
  };
  first_impression: {
    first_5_seconds: string;
    would_watch_more: boolean;
    instant_credibility: string;
    memorability: string;
  };
  coaching_tips: Array<{
    priority: number;
    category: string;
    issue: string;
    fix: string;
    timestamp: string;
    impact: string;
  }>;
  transcript_analysis: {
    strongest_line: string;
    weakest_line: string;
    opening_hook: string;
    closing_impact: string;
    key_message: string;
    message_clarity: string;
  };
  employer_appeal: {
    best_fit_roles: string[];
    best_fit_industries: string[];
    culture_match: string;
    seniority_signal: string;
    hire_signal: string;
  };
  passport_badge: {
    badge_earned: string;
    badge_evidence: string;
  };
  comparison_insights: {
    above_average: string[];
    below_average: string[];
    unique_differentiator: string;
  };
  summary: string;
}

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
      <span style={{ fontSize: size > 28 ? '1.15rem' : '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>Less noise. Better hires.</span>
    </div>
  </div>
);

// Circular Score Component
const CircularScore = ({ score }: { score: number }) => {
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#8B5CF6';
    if (score >= 60) return '#8B5CF6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>out of 100</div>
      </div>
    </div>
  );
};

// Role icon component
const RoleIcon = ({ index }: { index: number }) => {
  const icons = ['💼', '📊', '🎯', '🚀'];
  const colors = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#D1FAE5'];
  return (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors[index % colors.length],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem'
    }}>
      {icons[index % icons.length]}
    </div>
  );
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [originalCVText, setOriginalCVText] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenCV, setRewrittenCV] = useState<string | null>(null);

  // Video recording state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const capturedFramesRef = useRef<string[]>([]);
  const frameTimestampsRef = useRef<number[]>([]); // Track when each frame was captured
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0); // Track when recording started
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pitchDataRef = useRef<number[]>([]); // Store pitch readings for analysis

  // Initialize camera when modal opens
  useEffect(() => {
    if (showVideoModal && !cameraReady && !isRecording && !isAnalyzingVideo) {
      const initCameraAsync = async () => {
        try {
          setVideoError(null);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: true
          });
          streamRef.current = stream;

          // Wait a tick for the video element to be in DOM
          setTimeout(() => {
            if (videoPreviewRef.current && streamRef.current) {
              videoPreviewRef.current.srcObject = streamRef.current;
              videoPreviewRef.current.play().catch(console.error);
              setCameraReady(true);
            }
          }, 100);
        } catch (err: unknown) {
          console.error('Camera error:', err);
          const error = err as Error & { name?: string };
          if (error.name === 'NotAllowedError') {
            setVideoError('Camera blocked. Go to System Settings → Privacy & Security → Camera → Enable for your browser.');
          } else if (error.name === 'NotFoundError') {
            setVideoError('No camera found.');
          } else {
            setVideoError('Could not access camera.');
          }
        }
      };
      initCameraAsync();
    }

    // Cleanup when modal closes
    return () => {
      if (!showVideoModal && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setCameraReady(false);
      }
    };
  }, [showVideoModal, cameraReady, isRecording, isAnalyzingVideo]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setPasteMode(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setPasteMode(false);
    }
  }, []);

  const analyzeCV = async () => {
    if (!file && !pastedText) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('cv', file);
      } else {
        formData.append('cvText', pastedText);
      }

      const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);
      if (data.originalCV) {
        setOriginalCVText(data.originalCV);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const rewriteCV = async () => {
    if (!analysis || !originalCVText) return;

    setIsRewriting(true);
    try {
      const response = await fetch('/api/rewrite-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalCV: originalCVText,
          analysis
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rewrite failed');
      }

      setRewrittenCV(data.rewrittenCV);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rewrite failed');
    } finally {
      setIsRewriting(false);
    }
  };

  const downloadRewrittenCV = (format: 'txt' | 'pdf') => {
    if (!rewrittenCV) return;

    // For now, download as text file
    const blob = new Blob([rewrittenCV], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis?.candidate_name || 'CV'}_Improved.${format === 'pdf' ? 'txt' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setFile(null);
    setPastedText('');
    setPasteMode(false);
    setAnalysis(null);
    setError(null);
    setOriginalCVText('');
    setRewrittenCV(null);
  };

  const showSampleReport = () => {
    const sampleAnalysis: CVAnalysis = {
      candidate_name: "Thabo Mokoena",
      current_title: "Senior Software Developer",
      years_experience: 6,
      education_level: "BSc Computer Science (Wits)",
      overall_score: 78,
      score_explanation: "Strong technical foundation with room to showcase leadership and measurable achievements.",
      first_impression: "Experienced developer with solid technical skills. The CV effectively communicates core competencies but lacks quantified achievements that would make it stand out to hiring managers.",
      strengths: [
        {
          strength: "Full-Stack Expertise",
          evidence: "\"Built and deployed 12 production applications using React, Node.js, and PostgreSQL\"",
          impact: "Demonstrates end-to-end delivery capability valued by growing tech teams"
        },
        {
          strength: "Cloud & DevOps Skills",
          evidence: "\"AWS Certified Solutions Architect with hands-on Kubernetes experience\"",
          impact: "Modern infrastructure skills are in high demand across SA tech companies"
        },
        {
          strength: "Fintech Domain Knowledge",
          evidence: "\"3 years at Standard Bank Digital developing payment systems\"",
          impact: "Banking experience opens doors to SA's thriving fintech sector"
        }
      ],
      improvements: [
        {
          area: "Quantify Achievements",
          current_state: "Statements like \"improved performance\" lack specifics",
          suggestion: "Add metrics: \"Reduced API response time by 40%, handling 10K requests/min\"",
          priority: "HIGH"
        },
        {
          area: "Leadership Evidence",
          current_state: "No mention of team leadership or mentoring",
          suggestion: "Add: \"Led team of 4 developers\" or \"Mentored 2 junior developers\"",
          priority: "HIGH"
        },
        {
          area: "Project Impact",
          current_state: "Projects listed without business outcomes",
          suggestion: "Include: \"Payment system processed R50M monthly transactions\"",
          priority: "MEDIUM"
        }
      ],
      quick_wins: [
        "Add 3 metrics to your top achievements (%, R-value, time saved)",
        "Include your GitHub profile link if you have public projects",
        "Add a 2-line summary at the top highlighting your unique value"
      ],
      career_insights: {
        natural_fit_roles: [
          { role: "Tech Lead", match: 85 },
          { role: "Senior Full-Stack Developer", match: 92 },
          { role: "Solutions Architect", match: 78 }
        ],
        industries: ["Fintech", "E-commerce", "Banking", "SaaS"],
        trajectory_observation: "Ready for technical leadership roles. Consider targeting scale-ups where you can grow into a CTO track."
      },
      summary: "Thabo has a strong technical foundation with 6 years of full-stack experience and valuable fintech domain knowledge. To move from good to exceptional, the CV needs quantified achievements and evidence of leadership. Three specific fixes could push this score above 90."
    };
    setAnalysis(sampleAnalysis);
    setError(null);
  };

  // Video Recording Functions - Now with actual video + facial analysis

  // Initialize camera when modal opens
  const initCamera = async () => {
    try {
      setVideoError(null);
      setCameraReady(false);

      // Request video + audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      });
      streamRef.current = stream;

      // Show preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      setCameraReady(true);
    } catch (err: unknown) {
      console.error('Camera error:', err);
      const error = err as Error & { name?: string };
      if (error.name === 'NotAllowedError') {
        setVideoError('Camera/Microphone blocked. On Mac: System Settings → Privacy & Security → Camera & Microphone → Enable for your browser. Then refresh.');
      } else if (error.name === 'NotFoundError') {
        setVideoError('No camera found. Please connect a camera and try again.');
      } else {
        setVideoError('Could not access camera. Please check your settings.');
      }
    }
  };

  // Capture a frame from the live video preview
  const captureFrameFromPreview = (): string | null => {
    if (!videoPreviewRef.current) return null;

    const video = videoPreviewRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 640;  // Higher res for better face analysis
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Draw the current frame (un-mirror it for analysis)
    ctx.save();
    ctx.scale(-1, 1);  // Flip horizontally to un-mirror
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await initCamera();
      if (!streamRef.current) return;
    }

    try {
      setVideoError(null);

      // Use video mime type
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      // FERRARI MODE: Reset for high-frequency capture
      capturedFramesRef.current = [];
      frameTimestampsRef.current = [];
      pitchDataRef.current = [];
      recordingStartTimeRef.current = Date.now();

      // Initialize Web Audio API for voice analysis
      try {
        const audioTrack = streamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioContextRef.current = new AudioContext();
          const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 2048;
          source.connect(analyserRef.current);
          console.log('[FERRARI] Audio analyser initialized for voice metrics');
        }
      } catch (audioErr) {
        console.log('[FERRARI] Audio analysis not available:', audioErr);
      }

      // Capture first frame immediately at 0:00
      const firstFrame = captureFrameFromPreview();
      if (firstFrame) {
        capturedFramesRef.current.push(firstFrame);
        frameTimestampsRef.current.push(0);
        console.log('[FERRARI] Captured frame 1 at 0:00');
      }

      // FERRARI MODE: Capture a frame every 4 seconds (15 frames for 60 sec video)
      // This gives us detailed timeline analysis
      frameIntervalRef.current = setInterval(() => {
        if (capturedFramesRef.current.length < 15) {
          const frame = captureFrameFromPreview();
          const elapsedSeconds = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
          if (frame) {
            capturedFramesRef.current.push(frame);
            frameTimestampsRef.current.push(elapsedSeconds);
            console.log(`[FERRARI] Captured frame ${capturedFramesRef.current.length} at ${elapsedSeconds}s`);
          }

          // Also capture pitch data for voice analysis
          if (analyserRef.current) {
            const dataArray = new Float32Array(analyserRef.current.fftSize);
            analyserRef.current.getFloatTimeDomainData(dataArray);
            // Simple pitch detection using autocorrelation
            const pitch = detectPitch(dataArray, audioContextRef.current?.sampleRate || 44100);
            if (pitch > 0) {
              pitchDataRef.current.push(pitch);
            }
          }
        }
      }, 4000); // Every 4 seconds

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clear frame capture interval
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current);
          frameIntervalRef.current = null;
        }

        // Capture final frame
        const finalFrame = captureFrameFromPreview();
        const finalElapsed = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        if (finalFrame && capturedFramesRef.current.length < 16) {
          capturedFramesRef.current.push(finalFrame);
          frameTimestampsRef.current.push(finalElapsed);
          console.log(`[FERRARI] Captured final frame at ${finalElapsed}s (total: ${capturedFramesRef.current.length})`);
        }

        // Calculate voice metrics from pitch data
        const voiceMetrics = calculateVoiceMetrics(pitchDataRef.current);
        console.log(`[FERRARI] Voice metrics:`, voiceMetrics);

        // Cleanup audio context
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }

        const videoBlob = new Blob(videoChunksRef.current, { type: mimeType });
        // Pass frames, timestamps, and voice metrics
        await analyzeVideoWithFrames(
          videoBlob,
          capturedFramesRef.current,
          frameTimestampsRef.current,
          voiceMetrics
        );
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: unknown) {
      console.error('Recording error:', err);
      setVideoError('Could not start recording. Please try again.');
    }
  };

  // Simple pitch detection using autocorrelation
  const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    let bestOffset = -1;
    let bestCorrelation = 0;
    let foundGoodCorrelation = false;
    const correlations = new Float32Array(SIZE);

    for (let offset = 50; offset < SIZE / 2; offset++) {
      let correlation = 0;
      for (let i = 0; i < SIZE / 2; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - (correlation / (SIZE / 2));
      correlations[offset] = correlation;
      if (correlation > 0.9 && correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
        foundGoodCorrelation = true;
      } else if (foundGoodCorrelation) {
        break;
      }
    }
    if (bestOffset === -1) return -1;
    return sampleRate / bestOffset;
  };

  // Calculate voice metrics from pitch readings
  const calculateVoiceMetrics = (pitchData: number[]): { avgPitch: number; pitchVariation: number; silenceRatio: number } => {
    if (pitchData.length === 0) {
      return { avgPitch: 0, pitchVariation: 0, silenceRatio: 1 };
    }
    const validPitches = pitchData.filter(p => p > 50 && p < 500);
    if (validPitches.length === 0) {
      return { avgPitch: 0, pitchVariation: 0, silenceRatio: 1 };
    }
    const avgPitch = validPitches.reduce((a, b) => a + b, 0) / validPitches.length;
    const variance = validPitches.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) / validPitches.length;
    const stdDev = Math.sqrt(variance);
    const pitchVariation = (stdDev / avgPitch) * 100;
    const silenceRatio = 1 - (validPitches.length / Math.max(pitchData.length, 1));
    return { avgPitch, pitchVariation, silenceRatio };
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Clear frame capture interval
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    }
  };

  // Extract frames from video for visual analysis
  const extractFrames = async (videoBlob: Blob): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];

      video.src = URL.createObjectURL(videoBlob);
      video.muted = true;
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        canvas.width = 320;  // Smaller for API efficiency
        canvas.height = 240;
        const duration = video.duration;

        // Guard against non-finite duration
        if (!isFinite(duration) || duration <= 0) {
          console.log('[VIDEO] Duration not available, skipping frame extraction');
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }

        const frameCount = Math.min(5, Math.max(1, Math.floor(duration / 10) + 1)); // 1 frame per 10 seconds, max 5, min 1
        const interval = duration / frameCount;

        let currentFrame = 0;

        const captureFrame = () => {
          if (currentFrame >= frameCount) {
            URL.revokeObjectURL(video.src);
            resolve(frames);
            return;
          }

          const seekTime = currentFrame * interval;
          // Double-check seekTime is valid
          if (!isFinite(seekTime)) {
            URL.revokeObjectURL(video.src);
            resolve(frames);
            return;
          }
          video.currentTime = seekTime;
        };

        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameData = canvas.toDataURL('image/jpeg', 0.7);
            frames.push(frameData);
          }
          currentFrame++;
          captureFrame();
        };

        captureFrame();
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(frames); // Return empty or partial frames on error
      };
    });
  };

  const analyzeVideoWithFrames = async (
    videoBlob: Blob,
    capturedFrames: string[] = [],
    timestamps: number[] = [],
    voiceMetrics?: { avgPitch: number; pitchVariation: number; silenceRatio: number }
  ) => {
    setIsAnalyzingVideo(true);
    setVideoError(null);

    // Close camera while analyzing
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);

    try {
      // Use pre-captured frames (from live recording) - much more reliable than WebM extraction
      const frames = capturedFrames.length > 0 ? capturedFrames : await extractFrames(videoBlob);
      console.log(`[FERRARI] Sending ${frames.length} frames for FACS analysis`);
      console.log(`[FERRARI] Frame timestamps: ${timestamps.map(t => `${t}s`).join(', ')}`);

      const formData = new FormData();
      formData.append('video', videoBlob, 'recording.webm');
      formData.append('frames', JSON.stringify(frames));
      formData.append('frameTimestamps', JSON.stringify(timestamps));

      // Pass voice metrics for audio analysis
      if (voiceMetrics && voiceMetrics.avgPitch > 0) {
        formData.append('voiceMetrics', JSON.stringify(voiceMetrics));
        console.log(`[FERRARI] Voice metrics: pitch=${voiceMetrics.avgPitch.toFixed(0)}Hz, variation=${voiceMetrics.pitchVariation.toFixed(1)}%`);
      }

      // Pass CV context if available for role-specific video feedback
      if (analysis) {
        const cvContext = {
          name: analysis.candidate_name,
          roles: analysis.career_insights?.natural_fit_roles,
          strengths: analysis.strengths?.map(s => s.strength),
          score: analysis.overall_score
        };
        formData.append('cvContext', JSON.stringify(cvContext));
        console.log('[FERRARI] Including CV context for personalized feedback');
      }

      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      console.log(`[FERRARI] Analysis complete - version: ${data.version}, frames analyzed: ${data.framesAnalyzed}`);
      setVideoAnalysis(data.analysis);
      setShowVideoModal(false);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  const openVideoRecorder = () => {
    setShowVideoModal(true);
    setVideoAnalysis(null);
    setVideoError(null);
    setRecordingTime(0);
    setCameraReady(false);
    // Camera will init when modal renders
    setTimeout(() => initCamera(), 100);
  };

  const closeVideoModal = () => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setShowVideoModal(false);
  };

  // Sample Video Analysis for demo - Ferrari-grade format
  const showSampleVideoAnalysis = () => {
    const sampleVideo: VideoAnalysis = {
      overall_score: 82,
      overall_score_breakdown: "Avg of clarity(85) + confidence(88) + engagement(78) + authenticity(77) = 82",
      score_headline: "Confident communicator with executive presence",
      percentile_estimate: "Top 15% of candidates analyzed",
      scores: {
        clarity: { score: 85, calculation: "Clear articulation, minimal filler words, structured delivery" },
        confidence: { score: 88, calculation: "Strong eye contact (8/12 frames), assertive posture, varied pitch" },
        engagement: { score: 78, calculation: "Good energy, natural gestures, authentic smiles in 6 frames" },
        authenticity: { score: 77, calculation: "Duchenne smiles detected, expression-word congruence high" }
      },
      expression_analysis: {
        positive_expressions: ["Genuine warm smiles throughout", "Engaged and animated delivery", "Natural enthusiasm when discussing achievements"],
        areas_to_improve: ["Brief moment of uncertainty at 0:24"],
        warmth_indicators: {
          genuine_smiles: true,
          expression_consistency: "Expressions matched words well - came across as authentic",
          overall_warmth: "high"
        }
      },
      timeline: {
        journey_summary: "Strong confident start, brief dip mid-video when discussing challenges, powerful recovery and close",
        trajectory: "ascending",
        frames: [
          { timestamp: "0:00", dominant_emotion: "confident", energy_level: 8, eye_contact: "camera", key_observation: "Strong opening, direct eye contact" },
          { timestamp: "0:08", dominant_emotion: "engaged", energy_level: 7, eye_contact: "camera", key_observation: "Natural hand gestures" },
          { timestamp: "0:16", dominant_emotion: "focused", energy_level: 7, eye_contact: "camera", key_observation: "Explaining experience clearly" },
          { timestamp: "0:24", dominant_emotion: "uncertain", energy_level: 5, eye_contact: "down", key_observation: "Brief look down when discussing challenges" },
          { timestamp: "0:32", dominant_emotion: "confident", energy_level: 8, eye_contact: "camera", key_observation: "Recovery - discussing achievements" },
          { timestamp: "0:40", dominant_emotion: "passionate", energy_level: 9, eye_contact: "camera", key_observation: "Peak energy discussing impact" },
          { timestamp: "0:52", dominant_emotion: "confident", energy_level: 8, eye_contact: "camera", key_observation: "Strong close with call to action" }
        ],
        peak_moment: { timestamp: "0:40", description: "Discussing R2M fraud prevention impact - genuine enthusiasm, Duchenne smile" },
        dip_moment: { timestamp: "0:24", description: "Brief uncertainty when transitioning to challenges - looked down momentarily" }
      },
      visual_analysis: {
        eye_contact_percentage: 85,
        eye_contact_detail: "Direct camera contact in 10/12 frames. Brief look-away at 0:24 during transition.",
        posture: "confident",
        posture_detail: "Upright, open shoulders, slight forward lean showing engagement",
        gestures: "natural",
        gesture_detail: "Used hands effectively to emphasize key points at 0:16, 0:40, and 0:52",
        facial_mobility: "expressive",
        background: "professional",
        lighting: "good",
        overall_visual_impression: "Polished professional presence with authentic engagement"
      },
      voice_analysis: {
        estimated_wpm: 142,
        wpm_assessment: "ideal (100-160)",
        filler_count: 3,
        fillers_detected: ["um: 2", "you know: 1"],
        filler_density: "low",
        power_words_used: ["delivered", "transformed", "led", "achieved"],
        weak_words_used: ["just", "kind of"],
        verbal_confidence_score: 82,
        verbal_confidence_detail: "Strong power words, minimal hedging, clear conviction in achievements"
      },
      first_impression: {
        first_5_seconds: "Confident professional who commands attention immediately",
        would_watch_more: true,
        instant_credibility: "high",
        memorability: "memorable"
      },
      coaching_tips: [
        {
          priority: 1,
          category: "content",
          issue: "Opening could be stronger",
          fix: "Start with impact: 'I helped Standard Bank save R2M in fraud prevention' instead of 'Hi, I'm Thabo'",
          timestamp: "0:00",
          impact: "HIGH"
        },
        {
          priority: 2,
          category: "eye_contact",
          issue: "Brief look-away during transition",
          fix: "Maintain camera contact when transitioning topics - practice the challenging moments",
          timestamp: "0:24",
          impact: "MEDIUM"
        },
        {
          priority: 3,
          category: "voice",
          issue: "Two 'um' filler words",
          fix: "Replace with strategic pauses - silence shows confidence",
          timestamp: "throughout",
          impact: "LOW"
        }
      ],
      transcript_analysis: {
        strongest_line: "I don't just solve problems - I prevent them from happening in the first place.",
        weakest_line: "I kind of helped with the project",
        opening_hook: "moderate",
        closing_impact: "strong",
        key_message: "Experienced fintech professional who delivers measurable impact",
        message_clarity: "crystal clear"
      },
      employer_appeal: {
        best_fit_roles: ["Tech Lead", "Solutions Architect", "Engineering Manager"],
        best_fit_industries: ["Fintech", "Banking", "Enterprise Software"],
        culture_match: "corporate",
        seniority_signal: "senior",
        hire_signal: "strong yes"
      },
      passport_badge: {
        badge_earned: "Executive Presence",
        badge_evidence: "Consistent confidence throughout (avg energy 7.6/10), Duchenne smiles, strong vocal delivery"
      },
      comparison_insights: {
        above_average: ["Eye contact consistency", "Vocal clarity", "Professional presence"],
        below_average: ["Opening hook strength"],
        unique_differentiator: "Authentic passion when discussing impact - genuine Duchenne smiles"
      },
      summary: "Thabo presents as a confident, articulate professional with strong executive presence. FACS analysis detected authentic Duchenne smiles and high expression-word congruence. His video journey shows a brief dip at 0:24 but strong recovery. The 85% eye contact rate and 142 WPM pace are optimal. With a stronger opening hook, this would be a top-tier video introduction. Hire signal: Strong yes."
    };
    setVideoAnalysis(sampleVideo);
    setShowUpsell(false); // Close upsell to show results
  };

  // Talent Passport state
  const [showTalentPassport, setShowTalentPassport] = useState(false);

  // Sample Talent Passport for demo
  const showSampleTalentPassport = () => {
    setShowTalentPassport(true);
    setShowUpsell(false); // Close upsell to show passport modal
  };

  const getScoreHeadline = (score: number) => {
    if (score >= 80) return 'Excellent CV — ready to impress';
    if (score >= 70) return 'Strong foundation — room to stand out';
    if (score >= 60) return 'Good start — a few tweaks will help';
    if (score >= 40) return 'Needs work — let\'s improve it together';
    return 'Major improvements needed';
  };

  // Count stats
  const strengthCount = analysis?.strengths?.length || 0;
  const improvementCount = analysis?.improvements?.length || 0;
  const highPriorityCount = analysis?.improvements?.filter(i => i.priority === 'HIGH').length || 0;

  /* ============================================
     UPSELL VIEW - Premium Features (Video + Passport)
     ============================================ */
  if (showUpsell && analysis) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'white',
        overflow: 'hidden'
      }}>
        {/* Gradient Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: 'radial-gradient(ellipse at 30% 0%, rgba(79, 70, 229, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <header style={{
          position: 'relative',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width={32} height={32} viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#4F46E5"/>
              <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
              <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
              <circle cx="36" cy="12" r="9" fill="#10B981"/>
              <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              <span style={{ color: 'white' }}>Hire</span>
              <span style={{ color: '#818CF8' }}>Inbox</span>
            </span>
          </div>
          <button
            onClick={() => setShowUpsell(false)}
            style={{
              color: 'rgba(255,255,255,0.6)',
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to results
          </button>
        </header>

        {/* Main Content */}
        <div style={{
          position: 'relative',
          maxWidth: 1100,
          margin: '0 auto',
          padding: '48px 24px 80px'
        }}>
          {/* Top Section - Score Recap + Headline */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            {/* Score Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              padding: '8px 20px 8px 8px',
              marginBottom: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: analysis.overall_score >= 70 ? '#10B981' : analysis.overall_score >= 50 ? '#F59E0B' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem'
              }}>
                {analysis.overall_score}
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                {analysis.candidate_name ? `${analysis.candidate_name}'s` : 'Your'} CV Score
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: 16
            }}>
              Your CV is ready.<br />
              <span style={{ color: '#818CF8' }}>Now stand out from the crowd.</span>
            </h1>

            <p style={{
              fontSize: '1.125rem',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: 600,
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Most CVs look the same. The candidates who get hired show <em>who they are</em>, not just what they've done.
            </p>
          </div>

          {/* Product Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
            marginBottom: 48
          }} className="upsell-grid">
            {/* Video Analysis Card */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 24,
              padding: 32,
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Glow effect */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              {/* Icon */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>

              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: 8
              }}>
                Video Personality Analysis
              </h2>

              <p style={{
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 20,
                lineHeight: 1.6
              }}>
                Most CVs look the same. The candidates who get hired show <em>who they are</em>, not just what they&apos;ve done.
              </p>

              {/* Benefits - WHY do this - Deep human needs */}
              <div style={{
                backgroundColor: 'rgba(139,92,246,0.1)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20
              }}>
                <div style={{ fontSize: '0.75rem', color: '#8B5CF6', fontWeight: 600, marginBottom: 16 }}>WHY RECORD A VIDEO?</div>
                {[
                  {
                    benefit: 'Be remembered, not filtered out',
                    detail: 'Recruiters spend 6 seconds on a CV. Your face stays with them.'
                  },
                  {
                    benefit: 'Practice makes confidence',
                    detail: 'See yourself as employers see you. Fix weak spots before they cost you the job.'
                  },
                  {
                    benefit: 'Prove culture fit upfront',
                    detail: '70% of rejections are "not the right fit" - show you fit before they have to guess.'
                  },
                  {
                    benefit: 'Turn your network into recruiters',
                    detail: 'Share on WhatsApp. People recommend candidates they can see, not just read about.'
                  },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: i < 3 ? 14 : 0 }}>
                    <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600, marginBottom: 2 }}>{item.benefit}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', lineHeight: 1.4 }}>{item.detail}</div>
                  </div>
                ))}
              </div>

              {/* What you get */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>WHAT YOU GET:</div>
                {[
                  'Confidence & clarity scores',
                  'Body language analysis',
                  'Personalized coaching tips',
                  'Shareable Talent Passport'
                ].map((feature, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)' }}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 20
              }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>R49</span>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>once-off</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={openVideoRecorder}
                  style={{
                    flex: 1,
                    backgroundColor: '#8B5CF6',
                    color: 'white',
                    border: 'none',
                    padding: '16px 24px',
                    borderRadius: 12,
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  Record
                </button>
                <button
                  onClick={showSampleVideoAnalysis}
                  style={{
                    backgroundColor: 'rgba(139,92,246,0.2)',
                    color: '#C4B5FD',
                    border: '1px solid rgba(139,92,246,0.3)',
                    padding: '16px 20px',
                    borderRadius: 12,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                  See Sample
                </button>
              </div>
            </div>

            {/* Talent Passport Card */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 24,
              padding: 32,
              border: '2px solid #10B981',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Popular Badge */}
              <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                backgroundColor: '#10B981',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 100,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Most Popular
              </div>

              {/* Glow effect */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              {/* Icon */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>

              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: 8
              }}>
                Talent Passport
              </h2>

              <p style={{
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 24,
                lineHeight: 1.6
              }}>
                A verified digital credential that proves your skills. Share with any employer via link or QR code.
              </p>

              {/* Features */}
              <div style={{ marginBottom: 24 }}>
                {[
                  'Verified CV score & analysis',
                  'Shareable profile link',
                  'QR code for interviews',
                  'Employer trust badge',
                  '12-month validity'
                ].map((feature, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 12
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.9)' }}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 20
              }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>R99</span>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>per year</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{
                  flex: 1,
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: 12,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Get Passport
                </button>
                <button
                  onClick={showSampleTalentPassport}
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.2)',
                    color: '#6EE7B7',
                    border: '1px solid rgba(16,185,129,0.3)',
                    padding: '16px 20px',
                    borderRadius: 12,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                  See Sample
                </button>
              </div>
            </div>
          </div>

          {/* Bundle Deal */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
            borderRadius: 20,
            padding: 32,
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24
          }}>
            <div>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                marginBottom: 12,
                textTransform: 'uppercase'
              }}>
                Save R19
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>
                Complete Career Bundle
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.7)' }}>
                Video Analysis + Talent Passport — everything you need to stand out
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>
                  R148
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>R129</div>
              </div>
              <button style={{
                backgroundColor: 'white',
                color: '#0F172A',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 10,
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                Get the Bundle →
              </button>
            </div>
          </div>

          {/* Trust Section */}
          <div style={{
            textAlign: 'center',
            marginTop: 56,
            paddingTop: 40,
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 32,
              flexWrap: 'wrap',
              marginBottom: 32
            }}>
              {[
                { icon: '🔒', text: 'Secure payment' },
                { icon: '⚡', text: 'Instant access' },
                { icon: '💬', text: 'Support included' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.7 }}>
                  <span>{item.icon}</span>
                  <span style={{ fontSize: '0.875rem' }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Skip link */}
            <button
              onClick={() => setShowUpsell(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '4px'
              }}
            >
              Continue with free results only
            </button>
          </div>
        </div>

        {/* Responsive styles */}
        <style>{`
          @media (max-width: 768px) {
            .upsell-grid { grid-template-columns: 1fr !important; }
          }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          .spin-icon { animation: spin 1s linear infinite; }
        `}</style>

        {/* Video Recording Modal - For upsell page */}
        {showVideoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#0F172A',
              borderRadius: 24,
              padding: 32,
              maxWidth: 600,
              width: '95%',
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}>
              <button
                onClick={closeVideoModal}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
                {isRecording ? 'Recording...' : isAnalyzingVideo ? 'Analyzing Your Video...' : '60-Second Video Intro'}
              </h2>

              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20, fontSize: '0.9375rem' }}>
                {isRecording
                  ? `${recordingTime}s / 60s — Look at the camera and speak naturally`
                  : isAnalyzingVideo
                  ? 'AI is analyzing your facial expressions, body language & voice...'
                  : 'Our AI will analyze your facial expressions, eye contact, confidence & communication style.'}
              </p>

              {/* Why Record - Benefits (shown before recording) */}
              {!isRecording && !isAnalyzingVideo && !cameraReady && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12,
                  marginBottom: 24,
                  textAlign: 'left'
                }}>
                  {[
                    { icon: '👁️', reason: 'Be remembered, not filtered out', detail: 'Recruiters spend 6 seconds on a CV. Your face stays.' },
                    { icon: '💪', reason: 'Practice makes confidence', detail: 'See yourself as employers see you.' },
                    { icon: '🤝', reason: 'Prove culture fit upfront', detail: "70% of rejections are 'not the right fit'." },
                    { icon: '📲', reason: 'Share on WhatsApp', detail: 'People recommend candidates they can see.' }
                  ].map((item, i) => (
                    <div key={i} style={{
                      backgroundColor: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: 12,
                      padding: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white' }}>{item.reason}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Camera Preview */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 480,
                margin: '0 auto 24px',
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#1E293B',
                aspectRatio: '4/3'
              }}>
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)', // Mirror for selfie view
                    display: cameraReady ? 'block' : 'none'
                  }}
                />

                {/* Loading camera */}
                {!cameraReady && !videoError && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" className="spin-icon" style={{ color: '#8B5CF6', marginBottom: 12 }}>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="60" strokeLinecap="round"/>
                    </svg>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Starting camera...</p>
                  </div>
                )}

                {/* Recording indicator */}
                {isRecording && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: 'rgba(239,68,68,0.9)',
                    padding: '6px 12px',
                    borderRadius: 100
                  }}>
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      animation: 'pulse 1s infinite'
                    }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>REC {recordingTime}s</span>
                  </div>
                )}
              </div>

              {isRecording && (
                <div style={{
                  width: '100%',
                  height: 8,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  marginBottom: 24,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(recordingTime / 60) * 100}%`,
                    height: '100%',
                    backgroundColor: '#EF4444',
                    transition: 'width 1s linear'
                  }} />
                </div>
              )}

              {videoError && (
                <div style={{
                  backgroundColor: 'rgba(239,68,68,0.2)',
                  border: '1px solid #EF4444',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                  color: '#FCA5A5',
                  fontSize: '0.875rem'
                }}>
                  {videoError}
                </div>
              )}

              {!isAnalyzingVideo && (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      style={{
                        backgroundColor: '#8B5CF6',
                        color: 'white',
                        border: 'none',
                        padding: '14px 32px',
                        borderRadius: 12,
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      style={{
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        padding: '14px 32px',
                        borderRadius: 12,
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2"/>
                      </svg>
                      Stop & Analyze
                    </button>
                  )}
                </div>
              )}

              {isAnalyzingVideo && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" className="spin-icon" style={{ color: '#8B5CF6' }}>
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FERRARI-GRADE Video Analysis Results */}
        {videoAnalysis && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            overflow: 'auto',
            zIndex: 1000,
            padding: 24
          }}>
            <div style={{
              maxWidth: 900,
              margin: '0 auto',
              backgroundColor: '#0F172A',
              borderRadius: 24,
              padding: 32,
              color: 'white'
            }}>
              {/* Header with Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>FACS Video Analysis</h2>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(139,92,246,0.3)',
                      borderRadius: 4,
                      fontWeight: 600
                    }}>FERRARI MODE</span>
                  </div>
                  <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>Powered by Paul Ekman&apos;s Facial Action Coding System</p>
                </div>
                <button
                  onClick={() => setVideoAnalysis(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>

              {/* Hero Score with Transparency */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginBottom: 24,
                padding: 24,
                backgroundColor: 'rgba(139,92,246,0.1)',
                borderRadius: 16,
                border: '1px solid rgba(139,92,246,0.3)'
              }}>
                <div style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `conic-gradient(#8B5CF6 ${videoAnalysis.overall_score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    backgroundColor: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{videoAnalysis.overall_score}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>/100</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{videoAnalysis.score_headline}</h3>
                    {videoAnalysis.passport_badge && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '4px 10px',
                        backgroundColor: 'rgba(16,185,129,0.2)',
                        color: '#10B981',
                        borderRadius: 20,
                        fontWeight: 600
                      }}>{videoAnalysis.passport_badge.badge_earned}</span>
                    )}
                  </div>
                  <p style={{ opacity: 0.7, marginBottom: 8 }}>{videoAnalysis.first_impression?.first_5_seconds || videoAnalysis.summary}</p>
                  {videoAnalysis.percentile_estimate && (
                    <p style={{ fontSize: '0.8rem', color: '#8B5CF6' }}>{videoAnalysis.percentile_estimate}</p>
                  )}
                  {/* Transparency: Show how score was calculated */}
                  {videoAnalysis.overall_score_breakdown && (
                    <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 8, fontFamily: 'monospace' }}>
                      {videoAnalysis.overall_score_breakdown}
                    </p>
                  )}
                </div>
              </div>

              {/* Scores with Transparency */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {videoAnalysis.scores && Object.entries(videoAnalysis.scores).map(([key, value]) => {
                  const scoreData = typeof value === 'object' ? value : { score: value, calculation: '' };
                  return (
                    <div key={key} style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 12,
                      padding: 16,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#8B5CF6' }}>
                        {scoreData.score}
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'capitalize', marginBottom: 4 }}>{key}</div>
                      {scoreData.calculation && (
                        <div style={{ fontSize: '0.65rem', opacity: 0.4, lineHeight: 1.3 }}>
                          {scoreData.calculation.slice(0, 50)}...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Timeline Journey */}
              {videoAnalysis.timeline && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>📈</span> Your Video Journey
                  </h3>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: 16
                  }}>
                    <p style={{ marginBottom: 12, opacity: 0.9 }}>{videoAnalysis.timeline.journey_summary}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Trajectory:</span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: 4,
                        backgroundColor: videoAnalysis.timeline.trajectory === 'ascending' ? 'rgba(16,185,129,0.2)' :
                                        videoAnalysis.timeline.trajectory === 'descending' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: videoAnalysis.timeline.trajectory === 'ascending' ? '#10B981' :
                               videoAnalysis.timeline.trajectory === 'descending' ? '#EF4444' : '#F59E0B'
                      }}>{videoAnalysis.timeline.trajectory}</span>
                    </div>
                    {/* Visual Timeline */}
                    {videoAnalysis.timeline.frames && videoAnalysis.timeline.frames.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 8 }}>
                        {videoAnalysis.timeline.frames.map((frame, i) => (
                          <div key={i} style={{
                            minWidth: 60,
                            padding: 8,
                            backgroundColor: 'rgba(139,92,246,0.1)',
                            borderRadius: 8,
                            textAlign: 'center',
                            borderBottom: `3px solid ${
                              frame.energy_level >= 8 ? '#10B981' :
                              frame.energy_level >= 5 ? '#F59E0B' : '#EF4444'
                            }`
                          }}>
                            <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{frame.timestamp}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{frame.energy_level}</div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{frame.eye_contact}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Peak & Dip */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ padding: 12, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: '#10B981', marginBottom: 4 }}>PEAK @ {videoAnalysis.timeline.peak_moment?.timestamp}</div>
                        <div style={{ fontSize: '0.8rem' }}>{videoAnalysis.timeline.peak_moment?.description}</div>
                      </div>
                      <div style={{ padding: 12, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: '#F59E0B', marginBottom: 4 }}>DIP @ {videoAnalysis.timeline.dip_moment?.timestamp}</div>
                        <div style={{ fontSize: '0.8rem' }}>{videoAnalysis.timeline.dip_moment?.description}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expression Analysis */}
              {videoAnalysis.expression_analysis && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>😊</span> Expression Analysis
                  </h3>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: 16
                  }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 6 }}>What&apos;s Working Well</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {videoAnalysis.expression_analysis.positive_expressions?.map((expr, i) => (
                          <span key={i} style={{
                            fontSize: '0.7rem',
                            padding: '4px 8px',
                            backgroundColor: 'rgba(16,185,129,0.2)',
                            borderRadius: 4,
                            color: '#10B981'
                          }}>{expr}</span>
                        ))}
                      </div>
                    </div>
                    {videoAnalysis.expression_analysis.warmth_indicators && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Genuine Smiles</div>
                          <div style={{ fontSize: '0.9rem', color: videoAnalysis.expression_analysis.warmth_indicators.genuine_smiles ? '#10B981' : '#F59E0B' }}>
                            {videoAnalysis.expression_analysis.warmth_indicators.genuine_smiles ? 'Yes' : 'Could be warmer'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Expression Consistency</div>
                          <div style={{ fontSize: '0.9rem' }}>{videoAnalysis.expression_analysis.warmth_indicators.expression_consistency}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Overall Warmth</div>
                          <div style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{videoAnalysis.expression_analysis.warmth_indicators.overall_warmth}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Voice Analysis */}
              {videoAnalysis.voice_analysis && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>🎤</span> Voice Analysis
                  </h3>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Speaking Pace</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{videoAnalysis.voice_analysis.estimated_wpm} WPM</div>
                      <div style={{ fontSize: '0.7rem', color: videoAnalysis.voice_analysis.wpm_assessment?.includes('ideal') ? '#10B981' : '#F59E0B' }}>
                        {videoAnalysis.voice_analysis.wpm_assessment}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Filler Words</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{videoAnalysis.voice_analysis.filler_count}</div>
                      <div style={{ fontSize: '0.7rem', color: videoAnalysis.voice_analysis.filler_density === 'low' ? '#10B981' : '#F59E0B' }}>
                        {videoAnalysis.voice_analysis.filler_density}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Verbal Confidence</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{videoAnalysis.voice_analysis.verbal_confidence_score}/100</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Coaching Tips - Prioritized */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>🎯</span> Coaching Tips
                </h3>
                {(videoAnalysis.coaching_tips || []).slice(0, 5).map((tip, i) => (
                  <div key={i} style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    borderLeft: `3px solid ${tip.impact === 'HIGH' ? '#EF4444' : tip.impact === 'MEDIUM' ? '#F59E0B' : '#10B981'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5, marginRight: 8 }}>#{tip.priority || i+1}</span>
                        <strong>{tip.issue || tip.fix}</strong>
                        {tip.timestamp && tip.timestamp !== 'throughout' && (
                          <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: 8 }}>@ {tip.timestamp}</span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: tip.impact === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: tip.impact === 'HIGH' ? '#FCA5A5' : '#FCD34D'
                      }}>{tip.impact}</span>
                    </div>
                    <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{tip.fix}</p>
                  </div>
                ))}
              </div>

              {/* Employer Appeal */}
              {videoAnalysis.employer_appeal && (
                <div style={{
                  backgroundColor: 'rgba(139,92,246,0.1)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Employer Appeal</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Best Fit Roles</div>
                      <div style={{ fontSize: '0.85rem' }}>{videoAnalysis.employer_appeal.best_fit_roles?.join(', ')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Seniority Signal</div>
                      <div style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{videoAnalysis.employer_appeal.seniority_signal}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Hire Signal</div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: videoAnalysis.employer_appeal.hire_signal?.includes('yes') ? '#10B981' : '#F59E0B'
                      }}>{videoAnalysis.employer_appeal.hire_signal}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <p style={{ opacity: 0.8, lineHeight: 1.7, fontSize: '0.95rem' }}>{videoAnalysis.summary}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ============================================
     UPLOAD VIEW
     ============================================ */
  if (!analysis) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <Logo size={32} />
          <a href="/" style={{
            color: '#4F46E5',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '8px 16px',
            border: '1px solid #4F46E5',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            Get matched to roles <span style={{ fontSize: '1rem' }}>→</span>
          </a>
        </header>

        {/* Trust Strip - Honest proof */}
        <div style={{
          backgroundColor: '#0F172A',
          padding: '12px 24px',
          textAlign: 'center',
          color: 'white',
          fontSize: '0.8125rem'
        }}>
          <span style={{ opacity: 0.7 }}>Free CV feedback</span>
          <span style={{ opacity: 0.4, margin: '0 12px' }}>•</span>
          <span style={{ fontWeight: 600 }}>AI-powered analysis</span>
          <span style={{ opacity: 0.4, margin: '0 12px' }}>•</span>
          <span style={{ fontWeight: 600 }}>POPIA compliant</span>
          <span style={{ opacity: 0.4, margin: '0 12px' }}>•</span>
          <span style={{ opacity: 0.7 }}>Built in South Africa 🇿🇦</span>
        </div>

        {/* Hero Section - Split Layout */}
        <div style={{
          backgroundColor: '#FAFAFA',
          padding: '64px 24px 80px',
        }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center'
          }} className="hero-grid">
            {/* Left Column - Copy + CTAs */}
            <div>
              {/* Category stake */}
              <p style={{
                fontSize: '0.875rem',
                color: '#4F46E5',
                fontWeight: 600,
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                The CV quality engine
              </p>

              {/* Headline */}
              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                marginBottom: 20
              }}>
                Your CV gets <span style={{ color: '#4F46E5' }}>6 seconds</span>.<br />Make them count.
              </h1>

              {/* Subheadline */}
              <p style={{
                fontSize: '1.125rem',
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: 32
              }}>
                See exactly what recruiters see. Get ruthless, specific fixes — not generic advice. Export a polished CV in minutes.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
                  style={{
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    padding: '16px 32px',
                    borderRadius: 10,
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  Scan my CV free
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button
                  onClick={showSampleReport}
                  style={{
                    backgroundColor: 'white',
                    color: '#0F172A',
                    padding: '16px 24px',
                    borderRadius: 10,
                    fontSize: '1rem',
                    fontWeight: 500,
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer'
                  }}
                >
                  See a sample report
                </button>
              </div>

              {/* Value Props Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                maxWidth: 400
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  What you'll get
                </div>
                {[
                  { icon: '📊', text: 'Honest score out of 100' },
                  { icon: '🎯', text: 'Specific fixes, not generic advice' },
                  { icon: '💼', text: 'Best-fit roles for your experience' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.9375rem', color: '#0F172A', fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Live Product Preview */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E2E8F0'
            }}>
              {/* Score Preview */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                {/* Animated Score Ring */}
                <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                  <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle stroke="#E5E7EB" fill="transparent" strokeWidth="8" r="42" cx="50" cy="50"/>
                    <circle
                      stroke="#4F46E5"
                      fill="transparent"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset="66"
                      r="42"
                      cx="50"
                      cy="50"
                      className="score-ring"
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>78</div>
                    <div style={{ fontSize: '0.625rem', color: '#6B7280' }}>/ 100</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Your Score</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Strong foundation</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>3 high-impact fixes will push you to 90+</div>
                </div>
              </div>

              {/* Top Fixes Preview */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Top 3 Fixes
                </div>
                {[
                  { num: 1, text: 'Add measurable achievements', tag: 'Non-negotiable', tagColor: '#DC2626' },
                  { num: 2, text: 'Strengthen your summary', tag: 'High impact', tagColor: '#D97706' },
                  { num: 3, text: 'Add missing keywords', tag: '60-sec fix', tagColor: '#059669' }
                ].map((fix, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{fix.num}</div>
                    <span style={{ flex: 1, fontSize: '0.875rem', color: '#0F172A' }}>{fix.text}</span>
                    <span style={{ fontSize: '0.625rem', fontWeight: 600, color: fix.tagColor, backgroundColor: `${fix.tagColor}15`, padding: '3px 8px', borderRadius: 4 }}>{fix.tag}</span>
                  </div>
                ))}
              </div>

              {/* Best-Fit Roles Preview */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Best-Fit Roles
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Account Executive', 'Sales Manager', 'BDR'].map((role, i) => (
                    <span key={i} style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 12px', fontSize: '0.8125rem', color: '#0F172A' }}>
                      {role} <span style={{ color: '#10B981', fontWeight: 600 }}>{92 - i * 5}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section - Below hero */}
        <div style={{ backgroundColor: 'white', padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Ready to see your score?</h2>
          <p style={{ fontSize: '1rem', color: '#64748B', marginBottom: 32 }}>Drop your CV below and get instant feedback</p>

          {/* Upload Box - With depth and polish */}
          <div style={{
            maxWidth: 520,
            margin: '0 auto',
            backgroundColor: '#FAFAFA',
            borderRadius: 20,
            padding: 8,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 20px 25px -5px rgba(0, 0, 0, 0.05)',
          }}>
            {!pasteMode ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && document.getElementById('file-input')?.click()}
                style={{
                  backgroundColor: isDragging ? '#F5F3FF' : '#FAFAFA',
                  border: `2px dashed ${isDragging ? '#4F46E5' : file ? '#10B981' : '#E2E8F0'}`,
                  borderRadius: 14,
                  padding: file ? '24px' : '40px 24px',
                  textAlign: 'center',
                  cursor: file ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {!file ? (
                  <>
                    <div style={{
                      width: 56,
                      height: 56,
                      backgroundColor: '#F9FAFB',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
                      Upload your CV
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: 4 }}>
                      Drop your file here or click to browse
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: '#D1D5DB' }}>
                      PDF, Word, or plain text
                    </p>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        backgroundColor: '#D1FAE5',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                          {file.name}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
                          {(file.size / 1024).toFixed(0)} KB • Ready to analyze
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 8
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Paste Text Mode */
              <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #D1D5DB',
                borderRadius: 16,
                padding: '16px',
              }}>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your CV content here..."
                  style={{
                    width: '100%',
                    minHeight: 200,
                    border: 'none',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '0.9375rem',
                    color: '#0F172A',
                    lineHeight: 1.6
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={() => { setPasteMode(false); setPastedText(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      padding: '8px 12px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 12,
                padding: 16,
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ color: '#DC2626', fontSize: '0.875rem' }}>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginTop: 24
            }}>
              <button
                onClick={analyzeCV}
                disabled={isAnalyzing || (!file && !pastedText)}
                style={{
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: (isAnalyzing || (!file && !pastedText)) ? 'not-allowed' : 'pointer',
                  opacity: (isAnalyzing || (!file && !pastedText)) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {isAnalyzing ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" className="spin-icon">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round"/>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload CV
                  </>
                )}
              </button>
              <button
                onClick={() => { setPasteMode(!pasteMode); setFile(null); }}
                style={{
                  backgroundColor: 'white',
                  color: '#0F172A',
                  padding: '14px 28px',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Paste text
              </button>
            </div>

            {/* What happens next - Benefit driven */}
            <p style={{
              fontSize: '0.875rem',
              color: '#64748B',
              marginTop: 20,
              marginBottom: 0
            }}>
              Score, rewrite suggestions, and export — <strong style={{ color: '#0F172A' }}>in under 2 minutes</strong>
            </p>

            {/* Trust Indicators - With icons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
              marginTop: 24,
              color: '#6B7280',
              fontSize: '0.8125rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                100% free
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Your data stays private
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                POPIA compliant
              </span>
            </div>

            {/* Quick Access - Samples & Video */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid #F1F5F9'
            }}>
              <button
                onClick={showSampleReport}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366F1',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                See sample CV report
              </button>
              <span style={{ color: '#E2E8F0' }}>|</span>
              <button
                onClick={() => setShowVideoModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8B5CF6',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                Try video analysis
              </button>
              <span style={{ color: '#E2E8F0' }}>|</span>
              <button
                onClick={showSampleVideoAnalysis}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                See video sample
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Founder */}
        <footer style={{
          borderTop: '1px solid #F1F5F9',
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 12
          }}>
            {/* Founder avatar placeholder - replace with real photo */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}>
              SR
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                Built by Simon Rubin
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Cape Town, South Africa
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            <a href="/privacy" style={{ color: '#64748B', textDecoration: 'none', marginRight: 16 }}>Privacy</a>
            <a href="/terms" style={{ color: '#64748B', textDecoration: 'none', marginRight: 16 }}>Terms</a>
            <a href="mailto:simon@hireinbox.co.za" style={{ color: '#64748B', textDecoration: 'none' }}>Contact</a>
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#CBD5E1', marginTop: 16 }}>
            © 2024 HireInbox. All rights reserved.
          </div>
        </footer>

        {/* Animation styles */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .spin-icon { animation: spin 1s linear infinite; }
          .score-ring { animation: score-fill 1.5s ease-out forwards; }
          @keyframes score-fill { from { stroke-dashoffset: 264; } to { stroke-dashoffset: 66; } }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
          @media (max-width: 900px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          }
        `}</style>

        {/* Video Analysis Results - Available from landing page */}
        {videoAnalysis && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            overflow: 'auto',
            zIndex: 1000,
            padding: 24
          }}>
            <div style={{
              maxWidth: 800,
              margin: '0 auto',
              backgroundColor: '#0F172A',
              borderRadius: 24,
              padding: 32,
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Video Personality Analysis</h2>
                <button
                  onClick={() => setVideoAnalysis(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>

              {/* Overall Score */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginBottom: 32,
                padding: 24,
                backgroundColor: 'rgba(139,92,246,0.1)',
                borderRadius: 16
              }}>
                <div style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `conic-gradient(#8B5CF6 ${videoAnalysis.overall_score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700 }}>{videoAnalysis.overall_score}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>/100</span>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 4 }}>{videoAnalysis.score_headline}</h3>
                  <p style={{ opacity: 0.7 }}>{videoAnalysis.first_impression?.first_5_seconds || videoAnalysis.summary}</p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                {videoAnalysis.scores && Object.entries(videoAnalysis.scores).map(([key, value]) => {
                  const scoreData = typeof value === 'object' ? value : { score: value, calculation: '' };
                  return (
                    <div key={key} style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 12,
                      padding: 16,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8B5CF6' }}>{scoreData.score}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'capitalize' }}>{key}</div>
                    </div>
                  );
                })}
              </div>

              {/* Coaching Tips */}
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 16 }}>Coaching Tips</h3>
                {(videoAnalysis.coaching_tips || []).map((tip, i) => (
                  <div key={i} style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong>{tip.issue || tip.fix}</strong>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: 4,
                        backgroundColor: tip.impact === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: tip.impact === 'HIGH' ? '#FCA5A5' : '#FCD34D'
                      }}>{tip.impact}</span>
                    </div>
                    <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>{tip.fix}</p>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: 24, opacity: 0.7, lineHeight: 1.6 }}>{videoAnalysis.summary}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ============================================
     RESULTS VIEW - Matching the reference design
     ============================================ */
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ cursor: 'pointer' }} onClick={resetUpload}>
          <Logo size={32} />
        </div>
        <a href="/" style={{
          color: '#4F46E5',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '8px 16px',
          border: '1px solid #4F46E5',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          Get matched to roles <span style={{ fontSize: '1rem' }}>→</span>
        </a>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '40px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 40
      }}>
        {/* Left Column - Main Content */}
        <div>
          {/* Score Section */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            border: '1px solid #F1F5F9'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 24
            }}>
              Your CV Health Score
            </div>

            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
              <CircularScore score={analysis.overall_score} />

              <div style={{ flex: 1 }}>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: 8,
                  lineHeight: 1.3
                }}>
                  {getScoreHeadline(analysis.overall_score)}
                </h1>
                <p style={{
                  fontSize: '0.9375rem',
                  color: '#6B7280',
                  lineHeight: 1.6,
                  marginBottom: 16
                }}>
                  {analysis.first_impression}
                </p>

                {/* Stats Pills */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#374151' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                    {strengthCount} strength{strengthCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#374151' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
                    {improvementCount} improvement{improvementCount !== 1 ? 's' : ''}
                  </span>
                  {highPriorityCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#374151' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
                      {highPriorityCount} to fix
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div style={{
            backgroundColor: '#EFF6FF',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span style={{ fontSize: '0.875rem', color: '#1E40AF' }}>
              Your profile is private by default. You control who sees your details.
            </span>
          </div>

          {/* Top Improvements Section */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 32,
            border: '1px solid #F1F5F9'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 24
            }}>
              Top {Math.min(5, analysis.improvements.length)} Improvements (by impact)
            </div>

            {analysis.improvements.slice(0, 5).map((imp, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 16,
                padding: '20px 0',
                borderBottom: i < Math.min(4, analysis.improvements.length - 1) ? '1px solid #F1F5F9' : 'none'
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4, fontSize: '1rem' }}>
                    {imp.area}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.5, marginBottom: 10 }}>
                    {imp.suggestion}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: imp.priority === 'HIGH' ? '#FEE2E2' : imp.priority === 'MEDIUM' ? '#FEF3C7' : '#DBEAFE',
                    color: imp.priority === 'HIGH' ? '#DC2626' : imp.priority === 'MEDIUM' ? '#D97706' : '#2563EB'
                  }}>
                    {imp.priority === 'HIGH' ? 'High impact' : imp.priority === 'MEDIUM' ? 'Medium impact' : 'Quick win'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Strengths Section */}
          {analysis.strengths.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 32,
              marginTop: 24,
              border: '1px solid #F1F5F9'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 24
              }}>
                What's Working Well
              </div>

              {analysis.strengths.map((s, i) => (
                <div key={i} style={{
                  padding: '16px 0',
                  borderBottom: i < analysis.strengths.length - 1 ? '1px solid #F1F5F9' : 'none'
                }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{s.strength}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', fontStyle: 'italic' }}>
                    "{s.evidence}"
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div>
          {/* AI CV Rewriter Card */}
          <div style={{
            backgroundColor: '#4F46E5',
            borderRadius: 16,
            padding: 24,
            color: 'white',
            marginBottom: 24
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>
              {rewrittenCV ? 'Your Improved CV is Ready!' : 'AI-Powered CV Rewriting'}
            </h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.85, marginBottom: 20, lineHeight: 1.5 }}>
              {rewrittenCV
                ? 'Download your professionally rewritten CV with all improvements applied.'
                : isRewriting
                ? 'AI is rewriting your CV with all the improvements above...'
                : 'Let AI rewrite your CV incorporating all the improvements above.'}
            </p>

            {!rewrittenCV ? (
              <button
                onClick={rewriteCV}
                disabled={isRewriting || !originalCVText}
                style={{
                  width: '100%',
                  backgroundColor: isRewriting ? 'rgba(255,255,255,0.5)' : 'white',
                  color: '#4F46E5',
                  border: 'none',
                  padding: '14px 20px',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: isRewriting || !originalCVText ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: !originalCVText ? 0.5 : 1
                }}>
                {isRewriting ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" className="spin-icon" style={{ color: '#4F46E5' }}>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round"/>
                    </svg>
                    Rewriting...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Rewrite My CV with AI
                  </>
                )}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => downloadRewrittenCV('txt')}
                  style={{
                    flex: 1,
                    backgroundColor: 'white',
                    color: '#4F46E5',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  Download TXT
                </button>
                <button
                  onClick={() => {
                    // Copy to clipboard
                    navigator.clipboard.writeText(rewrittenCV);
                    alert('Copied to clipboard!');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Copy
                </button>
              </div>
            )}

            {!originalCVText && (
              <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 12, textAlign: 'center' }}>
                Paste your CV text to enable rewriting
              </p>
            )}
          </div>

          {/* Upsell Card - Video + Passport */}
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: 16,
            padding: 24,
            color: 'white',
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                </div>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>
                Stand out from 1000s of applicants
              </h3>
              <p style={{ fontSize: '0.8125rem', opacity: 0.8, marginBottom: 16, lineHeight: 1.5 }}>
                Add video analysis & get your verified Talent Passport
              </p>

              <button
                onClick={() => setShowUpsell(true)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #10B981 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                Unlock premium features
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              <p style={{ fontSize: '0.6875rem', opacity: 0.5, textAlign: 'center', marginTop: 10 }}>
                From R49 once-off
              </p>
            </div>
          </div>

          {/* Best-Fit Roles */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #F1F5F9',
            marginBottom: 24
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6
            }}>
              Best-Fit Roles For You
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', marginBottom: 20 }}>
              Based on your CV content and role requirements
            </p>

            {(analysis.career_insights.natural_fit_roles || []).slice(0, 4).map((role, i) => {
              const roleName = typeof role === 'string' ? role : role.role;
              const match = typeof role === 'object' && role.match ? role.match : (92 - i * 5);
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none',
                  cursor: 'pointer'
                }}>
                  <RoleIcon index={i} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9375rem' }}>{roleName}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 600 }}>{match}% match</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              );
            })}
          </div>

          {/* CTA Card */}
          <div style={{
            backgroundColor: '#FEF7EC',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>🎯</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Discover your hidden strengths
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
              Get personalized career insights and job recommendations
            </p>
            <button
              onClick={resetUpload}
              style={{
                backgroundColor: '#0F172A',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Analyze another CV
            </button>
          </div>
        </div>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .results-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Video Analysis Results */}
      {videoAnalysis && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          overflow: 'auto',
          zIndex: 1000,
          padding: 24
        }}>
          <div style={{
            maxWidth: 800,
            margin: '0 auto',
            backgroundColor: '#0F172A',
            borderRadius: 24,
            padding: 32,
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Video Personality Analysis</h2>
              <button
                onClick={() => setVideoAnalysis(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            {/* Overall Score */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              marginBottom: 32,
              padding: 24,
              backgroundColor: 'rgba(139,92,246,0.1)',
              borderRadius: 16
            }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `conic-gradient(#8B5CF6 ${videoAnalysis.overall_score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <span style={{ fontSize: '2rem', fontWeight: 700 }}>{videoAnalysis.overall_score}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>/100</span>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 4 }}>{videoAnalysis.score_headline}</h3>
                <p style={{ opacity: 0.7 }}>{videoAnalysis.first_impression?.first_5_seconds || videoAnalysis.summary}</p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              {videoAnalysis.scores && Object.entries(videoAnalysis.scores).map(([key, value]) => {
                const scoreData = typeof value === 'object' ? value : { score: value, calculation: '' };
                return (
                <div key={key} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8B5CF6' }}>{scoreData.score}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'capitalize' }}>{key}</div>
                </div>
              );
              })}
            </div>

            {/* Analysis Insights */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 16 }}>Analysis Insights</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                  <span style={{ opacity: 0.7 }}>Trajectory:</span> <strong>{videoAnalysis.timeline?.trajectory || 'steady'}</strong>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                  <span style={{ opacity: 0.7 }}>Eye Contact:</span> <strong>{videoAnalysis.visual_analysis?.eye_contact_percentage || 0}%</strong>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                  <span style={{ opacity: 0.7 }}>Speaking Pace:</span> <strong>{videoAnalysis.voice_analysis?.estimated_wpm || 0} WPM</strong>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                  <span style={{ opacity: 0.7 }}>Culture Fit:</span> <strong>{videoAnalysis.employer_appeal?.culture_match || 'flexible'}</strong>
                </div>
              </div>
            </div>

            {/* Coaching Tips */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 16 }}>Coaching Tips</h3>
              {(videoAnalysis.coaching_tips || []).map((tip, i) => (
                <div key={i} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{tip.issue || tip.fix}</strong>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: tip.impact === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                      color: tip.impact === 'HIGH' ? '#FCA5A5' : '#FCD34D'
                    }}>{tip.impact}</span>
                  </div>
                  <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>{tip.fix}</p>
                </div>
              ))}
            </div>

            {/* Best Fit Roles */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 16 }}>Best-Fit Roles</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(videoAnalysis.employer_appeal?.best_fit_roles || []).map((role, i) => (
                  <span key={i} style={{
                    backgroundColor: 'rgba(139,92,246,0.2)',
                    color: '#C4B5FD',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: '0.875rem'
                  }}>{role}</span>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{
              backgroundColor: 'rgba(16,185,129,0.1)',
              borderRadius: 12,
              padding: 20,
              borderLeft: '4px solid #10B981'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: '#10B981' }}>Summary</h3>
              <p style={{ lineHeight: 1.6 }}>{videoAnalysis.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Talent Passport - 5 Design Options */}
      {showTalentPassport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#111',
          overflow: 'auto',
          zIndex: 1000,
          padding: 20
        }}>
          {(() => {
            const name = analysis?.candidate_name || 'Thabo Mokoena';
            const title = analysis?.current_title || 'Senior Software Developer';
            const years = analysis?.years_experience || 6;
            const firstImpression = analysis?.first_impression || 'A well-structured CV that immediately communicates technical depth and leadership potential. The progression from developer to senior roles shows clear growth.';
            const strengths = analysis?.strengths?.slice(0, 3) || [
              { strength: 'Full-Stack Expertise', evidence: 'Built and deployed 12 production applications' },
              { strength: 'Cloud Architecture', evidence: 'AWS Certified Solutions Architect' },
              { strength: 'Team Leadership', evidence: 'Led a team of 5 developers' }
            ];
            const roles = analysis?.career_insights?.natural_fit_roles?.slice(0, 3) || ['Tech Lead', 'Senior Full-Stack Developer', 'Solutions Architect'];
            const score = analysis?.overall_score || 78;

            const whatsappText = `${name} - ${title}\n\nKey strengths: ${strengths.map(s => s.strength).join(', ')}\n\nAssessed by HireInbox`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

            return (
              <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ color: 'white', fontSize: '1.25rem', margin: 0 }}>5 Passport Designs - Pick your favorite</h2>
                  <button onClick={() => setShowTalentPassport(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>x</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>

                  {/* OPTION 1: Recruiter Message */}
                  <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ background: '#4F46E5', padding: '8px 12px', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>1. RECRUITER MESSAGE</div>
                    <div style={{ padding: 16 }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem', marginBottom: 8 }}>From: HireInbox Assessment</div>
                      <div style={{ color: 'white', fontWeight: 600, marginBottom: 12 }}>&ldquo;You should meet {name}&rdquo;</div>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: 12 }}>{title}{years ? `, ${years} years exp.` : ''} {firstImpression.split('.')[0]}.</p>
                      <div style={{ marginBottom: 12 }}>
                        {strengths.slice(0, 2).map((s, i) => (
                          <div key={i} style={{ color: '#10B981', fontSize: '0.6875rem', marginBottom: 4 }}>+ {s.strength}</div>
                        ))}
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.625rem' }}>HireInbox</span>
                        <span style={{ color: '#10B981', fontSize: '0.625rem' }}>Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* OPTION 2: Score Card */}
                  <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ background: '#10B981', padding: '8px 12px', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>2. SCORE CARD</div>
                    <div style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 800, color: score >= 70 ? '#10B981' : '#F59E0B', marginBottom: 4 }}>{score}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.625rem', marginBottom: 16 }}>TALENT SCORE</div>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: 16 }}>{title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                        {roles.slice(0, 2).map((r, i) => (
                          <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, fontSize: '0.625rem', color: 'rgba(255,255,255,0.7)' }}>
                            {typeof r === 'string' ? r : r.role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* OPTION 3: LinkedIn Style */}
                  <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ background: '#0A66C2', padding: '8px 12px', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>3. LINKEDIN STYLE</div>
                    <div style={{ padding: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E5E7EB', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#374151' }}>
                        {name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, color: '#111', marginBottom: 2 }}>{name}</div>
                        <div style={{ color: '#666', fontSize: '0.75rem' }}>{title}</div>
                      </div>
                      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
                        {strengths.slice(0, 2).map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: 'white', fontSize: '0.5rem' }}>✓</span>
                            </div>
                            <span style={{ fontSize: '0.6875rem', color: '#333' }}>{s.strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* OPTION 4: Quote/Testimonial */}
                  <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ background: '#F59E0B', padding: '8px 12px', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>4. TESTIMONIAL</div>
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: '2rem', color: '#F59E0B', lineHeight: 1, marginBottom: 8 }}>&ldquo;</div>
                      <p style={{ color: 'white', fontSize: '0.8125rem', lineHeight: 1.5, marginBottom: 16, fontStyle: 'italic' }}>
                        {firstImpression.split('.').slice(0, 2).join('.')}.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4F46E5' }} />
                        <div>
                          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.75rem' }}>{name}</div>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.625rem' }}>{title}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OPTION 5: Achievement */}
                  <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ background: '#8B5CF6', padding: '8px 12px', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>5. ACHIEVEMENT</div>
                    <div style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ width: 56, height: 56, margin: '0 auto 12px', borderRadius: '50%', border: '3px solid #8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="#8B5CF6"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                      </div>
                      <div style={{ color: '#8B5CF6', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 4 }}>VERIFIED TALENT</div>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4 }}>{name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: 12 }}>{title}</div>
                      <div style={{ background: 'rgba(139,92,246,0.2)', borderRadius: 8, padding: 8 }}>
                        <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)' }}>READY FOR</div>
                        <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>{roles.slice(0, 2).map(r => typeof r === 'string' ? r : r.role).join(', ')}</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* WHY THIS MATTERS section */}
                <div style={{ marginTop: 32, background: '#1a1a1a', borderRadius: 12, padding: 24 }}>
                  <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: 16 }}>Why share your Talent Passport?</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <div>
                      <div style={{ color: '#10B981', fontWeight: 600, marginBottom: 4 }}>Stand Out</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>95% of job seekers just send a CV. You send proof.</div>
                    </div>
                    <div>
                      <div style={{ color: '#3B82F6', fontWeight: 600, marginBottom: 4 }}>Get Referrals</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>Share with your network. Let them vouch for you.</div>
                    </div>
                    <div>
                      <div style={{ color: '#F59E0B', fontWeight: 600, marginBottom: 4 }}>Skip the Line</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>Recruiters see verified candidates first.</div>
                    </div>
                    <div>
                      <div style={{ color: '#8B5CF6', fontWeight: 600, marginBottom: 4 }}>Show Confidence</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>Sharing your assessment shows you have nothing to hide.</div>
                    </div>
                  </div>
                </div>

                {/* Share button */}
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: '#25D366', color: 'white',
                    padding: '14px 32px', borderRadius: 12, fontSize: '1rem', fontWeight: 600, textDecoration: 'none'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Share on WhatsApp
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
