'use client';

import { useState } from 'react';
import { BRAND, SUPPORT_CONFIG } from '@/lib/guardrails';

// ============================================
// HIREINBOX - GLOBAL SUPPORT BUTTON
//
// Must be visible on ALL screens per guardrails.
// Provides quick access to help and support.
// ============================================

interface SupportButtonProps {
  position?: 'bottom-right' | 'bottom-left';
  variant?: 'dark' | 'light';
}

export function SupportButton({
  position = 'bottom-right',
  variant = 'dark'
}: SupportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionStyles = {
    'bottom-right': { bottom: '24px', right: '24px' },
    'bottom-left': { bottom: '24px', left: '24px' },
  };

  const variantStyles = {
    dark: {
      button: { backgroundColor: '#0f172a', color: '#ffffff' },
      panel: { backgroundColor: '#ffffff', color: '#0f172a' },
    },
    light: {
      button: { backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' },
      panel: { backgroundColor: '#ffffff', color: '#0f172a' },
    },
  };

  return (
    <>
      {/* Support Panel */}
      {isOpen && (
        <div
          id="support-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="support-panel-title"
          style={{
            position: 'fixed',
            ...positionStyles[position],
            marginBottom: '60px',
            width: '320px',
            backgroundColor: variantStyles[variant].panel.backgroundColor,
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px',
            backgroundColor: '#4F46E5',
            color: '#ffffff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="support-panel-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                Need help?
              </h3>
              <button
                type="button"
                aria-label="Close support panel"
                onClick={() => setIsOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.9 }}>
              We typically respond within {SUPPORT_CONFIG.channels.responseTime}
            </p>
          </div>

          {/* Quick help topics */}
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
              Quick Help
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 0, padding: 0, listStyle: 'none' }}>
              {SUPPORT_CONFIG.helpTopics.map((topic, i) => (
                <li
                  key={i}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#475569',
                  }}
                >
                  {topic}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact options */}
          <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
              Contact Us
            </div>
            <a
              href={`mailto:${SUPPORT_CONFIG.channels.email}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>Email Support</span>
            </a>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'center',
          }}>
            {BRAND.name} — {BRAND.tagline}
          </div>
        </div>
      )}

      {/* Support Button */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="support-panel"
        aria-label={isOpen ? 'Close support panel' : 'Open support panel'}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          ...positionStyles[position],
          padding: '12px 20px',
          ...variantStyles[variant].button,
          border: 'none',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 999,
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
      >
        <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
          {isOpen ? '×' : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          )}
        </span>
        <span>{isOpen ? 'Close' : 'Support'}</span>
      </button>
    </>
  );
}

export default SupportButton;
