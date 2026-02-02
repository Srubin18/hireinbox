'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ============================================
// HIREINBOX B2C - VIDEO ANALYSIS
// /candidates/video
//
// Upsell from CV scan results:
// - Record or upload video introduction
// - AI analysis with Claude Vision
// - Professional presentation coaching
// ============================================

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div>
      <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#4F46E5' }}>Hyred</span>
      </div>
    </div>
  </div>
);

interface VideoAnalysis {
  overall_score: number;
  score_headline: string;
  summary: string;
  scores: {
    clarity: { score: number; calculation: string };
    confidence: { score: number; calculation: string };
    engagement: { score: number; calculation: string };
    authenticity: { score: number; calculation: string };
  };
  coaching_tips: Array<{
    priority: number;
    category: string;
    issue: string;
    fix: string;
    impact: string;
  }>;
  first_impression: {
    first_5_seconds: string;
    would_watch_more: boolean;
    instant_credibility: string;
    memorability: string;
  };
  visual_analysis: {
    eye_contact_percentage: number;
    eye_contact_detail: string;
    posture: string;
    posture_detail: string;
    gestures: string;
    background: string;
    lighting: string;
  };
  voice_analysis: {
    estimated_wpm: number;
    filler_count: number;
    verbal_confidence_score: number;
  };
  passport_badge: {
    badge_earned: string;
    badge_evidence: string;
  };
  interview_decision: {
    would_interview: boolean;
    decision_reasoning: string;
  };
  what_to_fix_first: string;
}

function VideoAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stage = searchParams.get('stage') || 'experienced';

  const [mode, setMode] = useState<'upload' | 'record'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.mov')) {
      setError('Please upload MP4, WebM, or MOV format');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('Video must be under 100MB');
      return;
    }
    setError(null);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setRecordedBlob(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setVideoFile(null);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Could not access camera. Please check permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const extractFrames = async (video: HTMLVideoElement): Promise<string[]> => {
    const frames: string[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return frames;

    const ctx = canvas.getContext('2d');
    if (!ctx) return frames;

    const duration = video.duration;
    const frameCount = Math.min(5, Math.ceil(duration / 4));
    const interval = duration / frameCount;

    canvas.width = 640;
    canvas.height = 360;

    for (let i = 0; i < frameCount; i++) {
      const time = i * interval;
      video.currentTime = time;
      await new Promise(resolve => {
        video.onseeked = resolve;
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.7));
    }

    video.currentTime = 0;
    return frames;
  };

  const analyzeVideo = async () => {
    if (!videoFile && !recordedBlob) {
      setError('Please upload or record a video first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setError(null);

    try {
      const formData = new FormData();

      if (recordedBlob) {
        formData.append('video', recordedBlob, 'recording.webm');
      } else if (videoFile) {
        formData.append('video', videoFile);
      }

      // Extract frames for visual analysis
      setAnalysisProgress(20);
      if (videoRef.current && videoUrl) {
        const tempVideo = document.createElement('video');
        tempVideo.src = videoUrl;
        tempVideo.crossOrigin = 'anonymous';
        await new Promise(resolve => {
          tempVideo.onloadedmetadata = resolve;
        });

        const frames = await extractFrames(tempVideo);
        if (frames.length > 0) {
          formData.append('frames', JSON.stringify(frames));
          const timestamps = frames.map((_, i) => i * 4);
          formData.append('frameTimestamps', JSON.stringify(timestamps));
        }
      }

      // Add CV context if available from session
      const cvResult = sessionStorage.getItem('cvAnalysisResult');
      if (cvResult) {
        try {
          const cv = JSON.parse(cvResult);
          formData.append('cvContext', JSON.stringify({
            name: cv.candidate_name,
            roles: cv.best_fit_roles || [],
            strengths: cv.strengths?.map((s: { strength?: string }) => s.strength) || [],
            score: cv.overall_score
          }));
        } catch {
          // Ignore CV context errors
        }
      }

      setAnalysisProgress(40);

      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        body: formData
      });

      setAnalysisProgress(80);

      if (!response.ok) {
        throw new Error('Analysis failed. Please try again.');
      }

      const result = await response.json();
      setAnalysisProgress(100);

      if (result.success && result.analysis) {
        setAnalysisResult(result.analysis);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetVideo = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setRecordedBlob(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return '#ECFDF5';
    if (score >= 60) return '#FFFBEB';
    return '#FEF2F2';
  };

  // Results view
  if (analysisResult) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <header style={{
          padding: '16px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Logo />
          <button
            onClick={() => router.push(`/candidates/scan?stage=${stage}`)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#64748b',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Back to CV Results
          </button>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
          {/* Score Header */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: getScoreBgColor(analysisResult.overall_score),
              color: getScoreColor(analysisResult.overall_score),
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              {analysisResult.passport_badge?.badge_earned || 'Video Analyzed'}
            </div>

            <div style={{
              fontSize: '64px',
              fontWeight: 700,
              color: getScoreColor(analysisResult.overall_score),
              marginBottom: '8px'
            }}>
              {analysisResult.overall_score}
            </div>

            <div style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '8px'
            }}>
              {analysisResult.score_headline}
            </div>

            <p style={{
              fontSize: '15px',
              color: '#64748b',
              lineHeight: 1.6,
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              {analysisResult.summary}
            </p>
          </div>

          {/* Score Breakdown */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '20px'
            }}>
              Performance Breakdown
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {Object.entries(analysisResult.scores).map(([key, value]) => (
                <div key={key} style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                      textTransform: 'capitalize'
                    }}>
                      {key}
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: getScoreColor(value.score)
                    }}>
                      {value.score}
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${value.score}%`,
                      backgroundColor: getScoreColor(value.score),
                      borderRadius: '3px',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#64748b',
                    marginTop: '8px',
                    lineHeight: 1.4
                  }}>
                    {value.calculation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* First Impression */}
          {analysisResult.first_impression && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '16px'
              }}>
                First Impression Analysis
              </h3>

              <div style={{
                padding: '16px',
                backgroundColor: analysisResult.first_impression.would_watch_more ? '#f0fdf4' : '#fef3c7',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: analysisResult.first_impression.would_watch_more ? '#166534' : '#92400e',
                  marginBottom: '4px'
                }}>
                  First 5 Seconds
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  {analysisResult.first_impression.first_5_seconds}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Credibility</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                    {analysisResult.first_impression.instant_credibility}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Memorability</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                    {analysisResult.first_impression.memorability}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Improvement */}
          {analysisResult.what_to_fix_first && (
            <div style={{
              backgroundColor: '#eff6ff',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #bfdbfe'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#1e40af',
                marginBottom: '12px'
              }}>
                Your #1 Priority
              </h3>
              <p style={{
                fontSize: '15px',
                color: '#1e3a8a',
                lineHeight: 1.6
              }}>
                {analysisResult.what_to_fix_first}
              </p>
            </div>
          )}

          {/* Coaching Tips */}
          {analysisResult.coaching_tips && analysisResult.coaching_tips.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '16px'
              }}>
                Coaching Tips
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analysisResult.coaching_tips.slice(0, 5).map((tip, i) => (
                  <div key={i} style={{
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${tip.impact === 'HIGH' ? '#EF4444' : tip.impact === 'MEDIUM' ? '#F59E0B' : '#10B981'}`
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0f172a'
                      }}>
                        {tip.category}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: tip.impact === 'HIGH' ? '#FEE2E2' : tip.impact === 'MEDIUM' ? '#FEF3C7' : '#ECFDF5',
                        color: tip.impact === 'HIGH' ? '#DC2626' : tip.impact === 'MEDIUM' ? '#D97706' : '#059669'
                      }}>
                        {tip.impact}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      {tip.issue}
                    </p>
                    <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>
                      {tip.fix}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Decision */}
          {analysisResult.interview_decision && (
            <div style={{
              backgroundColor: analysisResult.interview_decision.would_interview ? '#f0fdf4' : '#fef3c7',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              border: `1px solid ${analysisResult.interview_decision.would_interview ? '#86efac' : '#fcd34d'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>
                  {analysisResult.interview_decision.would_interview ? '✓' : '!'}
                </span>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: analysisResult.interview_decision.would_interview ? '#166534' : '#92400e'
                }}>
                  Interview Decision: {analysisResult.interview_decision.would_interview ? 'Would Interview' : 'Needs Improvement'}
                </h3>
              </div>
              <p style={{
                fontSize: '14px',
                color: analysisResult.interview_decision.would_interview ? '#166534' : '#92400e',
                lineHeight: 1.6
              }}>
                {analysisResult.interview_decision.decision_reasoning}
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={resetVideo}
              style={{
                padding: '14px 28px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Record Another
            </button>
            <button
              onClick={() => router.push(`/candidates/scan?stage=${stage}`)}
              style={{
                padding: '14px 28px',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Back to Results
            </button>
          </div>
        </main>

        {/* Support button */}
        <button
          aria-label="Get support"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 50
          }}
        >
          Support
        </button>
      </div>
    );
  }

  // Upload/Record view
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <header style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Logo />
        <button
          onClick={() => router.push(`/candidates/scan?stage=${stage}`)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Back to CV Results
        </button>
      </header>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#eff6ff',
            color: '#3b82f6',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            Video Analysis
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '12px'
          }}>
            Stand out with video
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: 1.6,
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            Your CV gets you considered. Your video gets you interviewed.
            Record a 1-2 minute introduction and get AI coaching on your presentation.
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '32px'
        }}>
          <button
            onClick={() => { setMode('upload'); resetVideo(); }}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: mode === 'upload' ? '#ffffff' : 'transparent',
              color: mode === 'upload' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Upload Video
          </button>
          <button
            onClick={() => { setMode('record'); resetVideo(); }}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: mode === 'record' ? '#ffffff' : 'transparent',
              color: mode === 'record' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Record Now
          </button>
        </div>

        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            borderRadius: '12px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && !videoUrl && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? '#4F46E5' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '64px 32px',
              textAlign: 'center',
              backgroundColor: dragActive ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mov"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />

            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#eff6ff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>

            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '8px'
            }}>
              Drop your video here
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '16px'
            }}>
              or click to browse
            </p>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              MP4, WebM, or MOV up to 100MB
            </p>
          </div>
        )}

        {/* Record Mode */}
        {mode === 'record' && !videoUrl && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              backgroundColor: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '24px',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isRecording ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <p>Click Start Recording to begin</p>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#EF4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%'
                  }} />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#EF4444',
                    borderRadius: '4px'
                  }} />
                  Stop Recording
                </button>
              )}
            </div>

            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                Tips for a great video
              </h4>
              <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#64748b', fontSize: '13px', lineHeight: 1.8 }}>
                <li>Keep it under 2 minutes</li>
                <li>Good lighting - face a window if possible</li>
                <li>Look directly at the camera</li>
                <li>Speak clearly and at a natural pace</li>
                <li>Share what makes you unique</li>
              </ul>
            </div>
          </div>
        )}

        {/* Video Preview */}
        {videoUrl && !isAnalyzing && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              style={{
                width: '100%',
                borderRadius: '12px',
                backgroundColor: '#000',
                marginBottom: '24px'
              }}
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={resetVideo}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                onClick={analyzeVideo}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Analyze My Video
              </button>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '48px 32px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid #e2e8f0',
              borderTopColor: '#4F46E5',
              borderRadius: '50%',
              margin: '0 auto 24px',
              animation: 'spin 1s linear infinite'
            }} />

            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '8px'
            }}>
              Analyzing your video...
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '24px'
            }}>
              Our AI is reviewing your presentation skills
            </p>

            <div style={{
              height: '8px',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              <div style={{
                height: '100%',
                width: `${analysisProgress}%`,
                backgroundColor: '#4F46E5',
                borderRadius: '4px',
                transition: 'width 0.3s'
              }} />
            </div>

            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Value Props */}
        {!videoUrl && !isAnalyzing && (
          <div style={{
            marginTop: '40px',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '16px'
            }}>
              What you will get
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '1', title: 'Presentation Score', desc: 'Overall assessment of your video presence' },
                { icon: '2', title: 'First Impression Analysis', desc: 'How you come across in the first 5 seconds' },
                { icon: '3', title: 'Coaching Tips', desc: 'Specific, actionable improvements' },
                { icon: '4', title: 'Interview Readiness', desc: 'Would an employer want to interview you?' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4F46E5',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden canvas for frame extraction */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </main>

      {/* Support button */}
      <button
        aria-label="Get support"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: 'none',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 50
        }}
      >
        Support
      </button>

      {/* Tagline footer */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        color: '#94a3b8',
        fontSize: '13px'
      }}>
        Hyred - Less noise. More hires.
      </div>
    </div>
  );
}

export default function VideoAnalysisPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>}>
      <VideoAnalysisContent />
    </Suspense>
  );
}
