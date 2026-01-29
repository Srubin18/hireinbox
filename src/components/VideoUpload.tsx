'use client';

import { useState, useRef } from 'react';

// ============================================
// VIDEO UPLOAD COMPONENT
// Simple, elegant video intro upload
// ============================================

interface VideoUploadProps {
  candidateId: string;
  currentVideoUrl?: string | null;
  onUploadComplete?: (videoUrl: string) => void;
  onDelete?: () => void;
}

export function VideoUpload({
  candidateId,
  currentVideoUrl,
  onUploadComplete,
  onDelete
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(currentVideoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload MP4, WebM, or MOV format');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be under 50MB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('candidateId', candidateId);

      // Simulate progress (real progress would need XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/video-upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (data.success) {
        setVideoUrl(data.videoUrl);
        onUploadComplete?.(data.videoUrl);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your video intro?')) return;

    try {
      const response = await fetch(`/api/video-upload?candidateId=${candidateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setVideoUrl(null);
        onDelete?.();
      }
    } catch {
      setError('Failed to delete video');
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '24px'
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: '#0f172a',
        marginBottom: '8px'
      }}>
        Video Introduction
      </h3>
      <p style={{
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '16px'
      }}>
        A 1-2 minute video helps employers get to know you better
      </p>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {videoUrl ? (
        <div>
          <video
            src={videoUrl}
            controls
            style={{
              width: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              backgroundColor: '#000'
            }}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Replace Video
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '10px 16px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: '2px dashed #e2e8f0',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: uploading ? '#f8fafc' : '#ffffff',
            transition: 'all 0.2s'
          }}
        >
          {uploading ? (
            <>
              <div style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                border: '4px solid #e2e8f0',
                borderTopColor: '#4F46E5',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Uploading... {progress}%
              </div>
              <div style={{
                height: '4px',
                backgroundColor: '#e2e8f0',
                borderRadius: '2px',
                marginTop: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: '#4F46E5',
                  transition: 'width 0.3s'
                }} />
              </div>
            </>
          ) : (
            <>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                style={{ margin: '0 auto 16px', display: 'block' }}
              >
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', marginBottom: '4px' }}>
                Click to upload video
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                MP4, WebM, or MOV • Max 50MB • 1-2 minutes recommended
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default VideoUpload;
