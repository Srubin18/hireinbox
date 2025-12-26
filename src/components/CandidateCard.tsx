'use client';

import React from 'react';

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
  roleId
}: {
  candidate: Candidate;
  onClick?: () => void;
  onSaveToPool?: (candidateId: string) => void;
  companyId?: string;
  roleId?: string;
}) {
  const screening = candidate.screening_result;
  const score = candidate.ai_score || 0;
  const recommendation = candidate.ai_recommendation || 'UNKNOWN';
  const reason = candidate.ai_reasoning || '';
  
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
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
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
        <button className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
          📧 Email
        </button>
        {/* Save to Pool - shown for rejected candidates */}
        {recommendation === 'REJECT' && onSaveToPool && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSaveToPool(candidate.id);
            }}
            className="text-xs px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Save to talent pool for future opportunities"
          >
            💼 Save to Pool
          </button>
        )}
      </div>
    </div>
  );
}