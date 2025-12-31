'use client';

import React, { useState, useEffect } from 'react';
import EmailModal from './EmailModal';

interface StrengthItem {
  label: string;
  evidence: string;
}

interface RiskItem {
  risk: string;
  severity: 'minor' | 'moderate' | 'serious';
  evidence: string;
  question: string;
}

interface Overqualification {
  flag: boolean;
  evidence: string | null;
  why_it_matters: string | null;
  questions: string[];
}

interface ScreeningResult {
  overall_score: number;
  recommendation: string;
  recommendation_reason: string;
  summary?: {
    strengths?: StrengthItem[] | string[];
    weaknesses?: Array<{ label: string; evidence: string }> | string[];
    fit_assessment?: string;
  };
  risks?: {
    items?: RiskItem[];
  };
  overqualification?: Overqualification;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ai_score: number;
  ai_recommendation: string;
  ai_reasoning: string;
  screening_result?: ScreeningResult;
  strengths?: string[];
  missing?: string[];
}

function isStructuredStrength(item: unknown): item is StrengthItem {
  return typeof item === 'object' && item !== null && 'label' in item && 'evidence' in item;
}

function getTopRisk(screening: ScreeningResult | undefined): RiskItem | null {
  if (!screening?.risks?.items?.length) return null;
  
  const severityOrder = { serious: 0, moderate: 1, minor: 2 };
  const sorted = [...screening.risks.items].sort((a, b) => 
    severityOrder[a.severity] - severityOrder[b.severity]
  );
  return sorted[0] || null;
}

export default function CandidateCard({
  candidate,
  onClick,
  onSaveToPool,
  companyId,
  roleId,
  roleTitle,
  companyName,
}: {
  candidate: Candidate;
  onClick?: () => void;
  onSaveToPool?: (candidateId: string) => void;
  companyId?: string;
  roleId?: string;
  roleTitle?: string;
  companyName?: string;
}) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isInPool, setIsInPool] = useState(false);
  const [isCheckingPool, setIsCheckingPool] = useState(true);
  const [isSavingPool, setIsSavingPool] = useState(false);

  const screening = candidate.screening_result;
  const score = candidate.ai_score || 0;
  const recommendation = candidate.ai_recommendation || 'UNKNOWN';
  const reason = candidate.ai_reasoning || '';

  // Check if candidate is already in talent pool
  useEffect(() => {
    const checkPoolStatus = async () => {
      try {
        const response = await fetch(`/api/talent-pool?candidate_id=${candidate.id}`);
        const data = await response.json();
        setIsInPool(data.inPool || false);
      } catch (error) {
        console.error('Failed to check pool status:', error);
      } finally {
        setIsCheckingPool(false);
      }
    };

    checkPoolStatus();
  }, [candidate.id]);

  // Handle star click - add/remove from talent pool
  const handleStarClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isSavingPool) return;
    setIsSavingPool(true);

    try {
      if (isInPool) {
        // Remove from pool - need to get the pool entry ID first
        const checkResponse = await fetch(`/api/talent-pool?candidate_id=${candidate.id}`);
        const checkData = await checkResponse.json();

        if (checkData.poolEntry?.id) {
          await fetch(`/api/talent-pool?id=${checkData.poolEntry.id}`, {
            method: 'DELETE'
          });
          setIsInPool(false);
        }
      } else {
        // Add to pool
        const response = await fetch('/api/talent-pool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId || 'default',
            candidate_id: candidate.id,
            original_role_id: roleId,
            folder: recommendation === 'SHORTLIST' ? 'Hot Leads' : 'Future Potential',
            tags: [],
            notes: '',
            ai_talent_notes: reason
          })
        });

        if (response.ok) {
          setIsInPool(true);
        } else if (response.status === 409) {
          // Already in pool
          setIsInPool(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle pool status:', error);
    } finally {
      setIsSavingPool(false);
    }
  };
  
  const strengths = screening?.summary?.strengths || candidate.strengths || [];
  const topStrengths = strengths.slice(0, 2);
  
  const topRisk = getTopRisk(screening);
  const overqual = screening?.overqualification;
  
  const getScoreColor = () => {
    if (recommendation === 'SHORTLIST') return 'text-green-600 bg-green-50';
    if (recommendation === 'CONSIDER') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };
  
  const getRecommendationBadge = () => {
    if (recommendation === 'SHORTLIST') return { text: '✓ Shortlisted', class: 'bg-green-100 text-green-800' };
    if (recommendation === 'CONSIDER') return { text: '◐ Consider', class: 'bg-yellow-100 text-yellow-800' };
    return { text: '✗ Rejected', class: 'bg-red-100 text-red-800' };
  };
  
  const badge = getRecommendationBadge();

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={onClick}
    >
      {/* Star Button - Save to Talent Pool */}
      <button
        onClick={handleStarClick}
        disabled={isCheckingPool || isSavingPool}
        className={`absolute top-3 right-3 p-1 transition-all ${
          isCheckingPool || isSavingPool ? 'opacity-30' : 'hover:scale-110'
        }`}
        title={isInPool ? 'Remove from Talent Pool' : 'Save to Talent Pool'}
      >
        {isSavingPool ? (
          <svg className="w-5 h-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill={isInPool ? '#F59E0B' : 'none'}
            stroke={isInPool ? '#F59E0B' : '#9CA3AF'}
            strokeWidth="2"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        )}
      </button>

      <div className="flex justify-between items-start mb-3 pr-8">
        <div>
          <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
          <p className="text-sm text-gray-500">{candidate.email}</p>
        </div>
        <div className={`text-2xl font-bold px-3 py-1 rounded ${getScoreColor()}`}>
          {score}
        </div>
      </div>
      
      <div className="mb-3">
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${badge.class}`}>
          {badge.text}
        </span>
      </div>
      
      <p className="text-sm text-gray-700 mb-3">{reason}</p>
      
      {topStrengths.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">✓ Strengths</p>
          <ul className="space-y-1">
            {topStrengths.map((strength, i) => (
              <li key={i} className="text-sm text-gray-700">
                {isStructuredStrength(strength) ? (
                  <>
                    <span className="font-medium">{strength.label}</span>
                    <span className="text-gray-500"> — "{strength.evidence}"</span>
                  </>
                ) : (
                  <span>{strength} <span className="text-gray-400 text-xs">(legacy)</span></span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {topRisk && (
        <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs font-medium text-amber-800 mb-1">
            ⚠ Top Risk ({topRisk.severity})
          </p>
          <p className="text-sm text-amber-900">{topRisk.risk}</p>
          <p className="text-xs text-amber-700 mt-1 italic">→ {topRisk.question}</p>
        </div>
      )}
      
      {overqual?.flag && (
        <div className="mb-3 p-2 bg-purple-50 rounded border border-purple-200">
          <p className="text-xs font-medium text-purple-800 mb-1">⚡ Overqualification Risk</p>
          <p className="text-sm text-purple-900">{overqual.why_it_matters}</p>
          {overqual.questions?.length > 0 && (
            <p className="text-xs text-purple-700 mt-1 italic">→ {overqual.questions[0]}</p>
          )}
        </div>
      )}
      
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
        <button className="text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
          💬 WhatsApp
        </button>
        <button className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
          📞 Call
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEmailModal(true);
          }}
          className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Email
        </button>
        {/* Save to Pool - shown for rejected candidates if not already in pool */}
        {recommendation === 'REJECT' && onSaveToPool && !isInPool && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSaveToPool(candidate.id);
            }}
            className="text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Save to talent pool for future opportunities"
          >
            Save to Pool
          </button>
        )}
        {/* In Pool indicator */}
        {isInPool && (
          <span className="text-xs px-3 py-1 bg-amber-100 text-amber-800 rounded">
            In Pool
          </span>
        )}
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        candidate={{
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          ai_recommendation: candidate.ai_recommendation,
          strengths: candidate.strengths,
        }}
        roleTitle={roleTitle}
        companyName={companyName}
      />
    </div>
  );
}