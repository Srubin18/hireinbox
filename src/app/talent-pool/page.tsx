'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================
// Talent Pool - Full-Featured Candidate Database
// Features: Tags, Folders, Search, Bulk Actions, Insights
// ============================================

interface TalentCandidate {
  id: string;
  candidate_id: string;
  ai_recommended_roles: string[];
  ai_talent_notes: string;
  talent_category: string;
  seniority_level: string;
  share_with_network: boolean;
  added_at: string;
  notes: string;
  tags: string[];
  folder: string;
  candidates: {
    id: string;
    name: string;
    email: string;
    phone: string;
    score: number;
    cv_summary: string;
    strengths: string[];
    experience_years: number;
    education: string;
    location: string;
  };
  roles: {
    id: string;
    title: string;
  } | null;
}

interface Insights {
  totalCandidates: number;
  averageScore: number;
  topTags: { tag: string; count: number }[];
  folderCounts: Record<string, number>;
}

// Default folders
const FOLDERS = [
  { id: 'hot-leads', name: 'Hot Leads', icon: 'fire', color: '#EF4444' },
  { id: 'future-potential', name: 'Future Potential', icon: 'clock', color: '#F59E0B' },
  { id: 'specialist-skills', name: 'Specialist Skills', icon: 'star', color: '#8B5CF6' },
  { id: 'passive-candidates', name: 'Passive Candidates', icon: 'eye', color: '#3B82F6' },
  { id: 'referrals', name: 'Referrals', icon: 'users', color: '#10B981' },
];

// Preset tags
const PRESET_TAGS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL',
  'Leadership', 'Remote OK', 'Immediate', 'Senior', 'Junior',
  'CA(SA)', 'CFA', 'MBA', 'Engineering', 'Finance',
  'Sales', 'Marketing', 'Operations', 'Tech', 'Design'
];

// Tag colors
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'JavaScript': { bg: '#FEF3C7', text: '#92400E' },
  'Python': { bg: '#DBEAFE', text: '#1E40AF' },
  'React': { bg: '#CFFAFE', text: '#0E7490' },
  'Leadership': { bg: '#FCE7F3', text: '#9D174D' },
  'Senior': { bg: '#EDE9FE', text: '#5B21B6' },
  'Junior': { bg: '#D1FAE5', text: '#065F46' },
  'Remote OK': { bg: '#F0FDF4', text: '#166534' },
  'Immediate': { bg: '#FEE2E2', text: '#991B1B' },
  'default': { bg: '#F1F5F9', text: '#475569' }
};

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || TAG_COLORS['default'];
}

export default function TalentPoolPage() {
  const [talent, setTalent] = useState<TalentCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insights | null>(null);

  // Filters
  const [activeFolder, setActiveFolder] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [includeNetwork, setIncludeNetwork] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Modal states
  const [selectedTalent, setSelectedTalent] = useState<TalentCandidate | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');

  // Fetch talent pool
  const fetchTalentPool = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFolder) params.set('folder', activeFolder);
      if (searchQuery) params.set('search', searchQuery);
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (scoreRange[0] > 0) params.set('min_score', scoreRange[0].toString());
      if (scoreRange[1] < 100) params.set('max_score', scoreRange[1].toString());
      if (includeNetwork) params.set('include_network', 'true');
      params.set('insights', 'true');

      const response = await fetch(`/api/talent-pool?${params}`);
      const data = await response.json();

      if (data.success) {
        setTalent(data.talent);
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch talent pool:', error);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, searchQuery, selectedTags, scoreRange, includeNetwork]);

  useEffect(() => {
    fetchTalentPool();
  }, [fetchTalentPool]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === talent.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(talent.map(t => t.id)));
    }
    setSelectAll(!selectAll);
  };

  // Bulk actions
  const handleBulkMove = async (folder: string) => {
    if (selectedIds.size === 0) return;

    try {
      await fetch('/api/talent-pool', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_move',
          ids: Array.from(selectedIds),
          folder
        })
      });
      setShowMoveModal(false);
      setSelectedIds(new Set());
      fetchTalentPool();
    } catch (error) {
      console.error('Failed to move candidates:', error);
    }
  };

  const handleBulkAddTag = async (tag: string) => {
    if (selectedIds.size === 0) return;

    try {
      await fetch('/api/talent-pool', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_add_tag',
          ids: Array.from(selectedIds),
          tag
        })
      });
      setShowAddTagModal(false);
      setNewTag('');
      setSelectedIds(new Set());
      fetchTalentPool();
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleBulkEmail = async () => {
    if (selectedIds.size === 0) return;

    try {
      const response = await fetch('/api/talent-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_email',
          talent_pool_ids: Array.from(selectedIds)
        })
      });
      const data = await response.json();
      if (data.mailto) {
        window.location.href = data.mailto;
      }
    } catch (error) {
      console.error('Failed to generate email:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const body: { action: string; talent_pool_ids?: string[]; folder?: string } = { action: 'export_csv' };
      if (selectedIds.size > 0) {
        body.talent_pool_ids = Array.from(selectedIds);
      } else if (activeFolder) {
        body.folder = activeFolder;
      }

      const response = await fetch('/api/talent-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (data.csv) {
        const blob = new Blob([data.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  // Update single candidate
  const updateCandidate = async (id: string, updates: Partial<TalentCandidate>) => {
    try {
      await fetch('/api/talent-pool', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      fetchTalentPool();
    } catch (error) {
      console.error('Failed to update candidate:', error);
    }
  };

  const addTagToCandidate = async (id: string, tag: string) => {
    const candidate = talent.find(t => t.id === id);
    if (!candidate) return;

    const currentTags = candidate.tags || [];
    if (!currentTags.includes(tag)) {
      await updateCandidate(id, { tags: [...currentTags, tag] } as Partial<TalentCandidate>);
    }
  };

  const removeTagFromCandidate = async (id: string, tag: string) => {
    const candidate = talent.find(t => t.id === id);
    if (!candidate) return;

    const currentTags = (candidate.tags || []).filter(t => t !== tag);
    await updateCandidate(id, { tags: currentTags } as Partial<TalentCandidate>);
  };

  const saveNotes = async () => {
    if (!selectedTalent) return;
    await updateCandidate(selectedTalent.id, { notes: tempNotes } as Partial<TalentCandidate>);
    setEditingNotes(false);
  };

  const removeFromPool = async (id: string) => {
    if (!confirm('Remove this candidate from your talent pool?')) return;

    try {
      const response = await fetch(`/api/talent-pool?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTalentPool();
        setSelectedTalent(null);
      }
    } catch (error) {
      console.error('Failed to remove from pool:', error);
    }
  };

  const toggleSharing = async (id: string, currentValue: boolean) => {
    await updateCandidate(id, { share_with_network: !currentValue } as Partial<TalentCandidate>);
  };

  // Get folder icon
  const getFolderIcon = (iconName: string) => {
    switch (iconName) {
      case 'fire':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 23a7.5 7.5 0 0 1-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 5-2.47.27.773.5 1.604.5 2.47A7.5 7.5 0 0 1 12 23z"/>
          </svg>
        );
      case 'clock':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        );
      case 'star':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        );
      case 'eye':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        );
      case 'users':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#4F46E5"/>
              <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
              <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
              <span style={{ color: '#0f172a' }}>Hire</span>
              <span style={{ color: '#4F46E5' }}>Inbox</span>
            </span>
          </a>
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>/ Talent Pool</span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#64748B',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <a
            href="/"
            style={{
              padding: '8px 16px',
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            Back to Dashboard
          </a>
        </div>
      </header>

      <div style={{ display: 'flex', maxWidth: 1600, margin: '0 auto' }}>
        {/* Sidebar - Folders */}
        <aside style={{
          width: 260,
          backgroundColor: 'white',
          borderRight: '1px solid #E2E8F0',
          minHeight: 'calc(100vh - 65px)',
          padding: '20px 0',
          flexShrink: 0
        }}>
          {/* Insights Summary */}
          {insights && (
            <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pool Insights
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4F46E5' }}>
                    {insights.totalCandidates}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Candidates</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>
                    {insights.averageScore}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Avg Score</div>
                </div>
              </div>

              {/* Top Tags */}
              {insights.topTags.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: 8 }}>Top Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {insights.topTags.slice(0, 5).map(({ tag, count }) => (
                      <span
                        key={tag}
                        style={{
                          ...getTagColor(tag),
                          backgroundColor: getTagColor(tag).bg,
                          color: getTagColor(tag).text,
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: 4
                        }}
                      >
                        {tag} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Folders */}
          <div style={{ padding: '20px 16px' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Folders
            </h3>

            {/* All Candidates */}
            <button
              onClick={() => setActiveFolder('')}
              style={{
                width: '100%',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                backgroundColor: activeFolder === '' ? '#EEF2FF' : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 4,
                textAlign: 'left'
              }}
            >
              <span style={{ color: activeFolder === '' ? '#4F46E5' : '#64748B' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: activeFolder === '' ? '#4F46E5' : '#0F172A' }}>
                All Candidates
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94A3B8' }}>
                {insights?.totalCandidates || 0}
              </span>
            </button>

            {FOLDERS.map(folder => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.name)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: activeFolder === folder.name ? '#EEF2FF' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginBottom: 4,
                  textAlign: 'left'
                }}
              >
                <span style={{ color: activeFolder === folder.name ? '#4F46E5' : folder.color }}>
                  {getFolderIcon(folder.icon)}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: activeFolder === folder.name ? '#4F46E5' : '#0F172A' }}>
                  {folder.name}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94A3B8' }}>
                  {insights?.folderCounts?.[folder.name] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Tag Filter */}
          <div style={{ padding: '0 16px 20px', borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filter by Tags
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_TAGS.slice(0, 12).map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: 4,
                    border: selectedTags.includes(tag) ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                    backgroundColor: selectedTags.includes(tag) ? getTagColor(tag).bg : 'white',
                    color: selectedTags.includes(tag) ? getTagColor(tag).text : '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                style={{
                  marginTop: 8,
                  fontSize: '0.75rem',
                  color: '#4F46E5',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: 24 }}>
          {/* Search & Filters Bar */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              >
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 42px',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Score Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Score:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={scoreRange[0]}
                onChange={(e) => setScoreRange([parseInt(e.target.value) || 0, scoreRange[1]])}
                style={{
                  width: 60,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #E2E8F0',
                  fontSize: '0.8125rem',
                  textAlign: 'center'
                }}
              />
              <span style={{ color: '#94A3B8' }}>-</span>
              <input
                type="number"
                min="0"
                max="100"
                value={scoreRange[1]}
                onChange={(e) => setScoreRange([scoreRange[0], parseInt(e.target.value) || 100])}
                style={{
                  width: 60,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #E2E8F0',
                  fontSize: '0.8125rem',
                  textAlign: 'center'
                }}
              />
            </div>

            {/* Network Toggle */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8125rem',
              color: '#64748B',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={includeNetwork}
                onChange={(e) => setIncludeNetwork(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Include Network
            </label>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div style={{
              backgroundColor: '#4F46E5',
              borderRadius: 12,
              padding: '12px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              color: 'white'
            }}>
              <span style={{ fontWeight: 600 }}>{selectedIds.size} selected</span>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button
                  onClick={() => setShowMoveModal(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  Move to Folder
                </button>
                <button
                  onClick={() => setShowAddTagModal(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  Add Tag
                </button>
                <button
                  onClick={handleBulkEmail}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Email
                </button>
                <button
                  onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Table Header */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px 12px 0 0',
            padding: '12px 20px',
            display: 'grid',
            gridTemplateColumns: '40px 1fr 120px 150px 200px 100px',
            gap: 16,
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                style={{ width: 16, height: 16 }}
              />
            </div>
            <div>Candidate</div>
            <div>Score</div>
            <div>Folder</div>
            <div>Tags</div>
            <div>Added</div>
          </div>

          {/* Talent List */}
          {loading ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0 0 12px 12px',
              padding: 60,
              textAlign: 'center',
              color: '#64748B'
            }}>
              Loading talent pool...
            </div>
          ) : talent.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0 0 12px 12px',
              padding: 60,
              textAlign: 'center'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
                No candidates found
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.9375rem' }}>
                {searchQuery || selectedTags.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Save promising candidates from your screening to build your talent pool.'}
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '0 0 12px 12px' }}>
              {talent.map((t, index) => (
                <div
                  key={t.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 120px 150px 200px 100px',
                    gap: 16,
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: index < talent.length - 1 ? '1px solid #F1F5F9' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    backgroundColor: selectedIds.has(t.id) ? '#F8FAFC' : 'white'
                  }}
                  onClick={() => setSelectedTalent(t)}
                  onMouseEnter={(e) => {
                    if (!selectedIds.has(t.id)) {
                      e.currentTarget.style.backgroundColor = '#FAFAFA';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedIds.has(t.id)) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      style={{ width: 16, height: 16 }}
                    />
                  </div>

                  {/* Candidate Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      color: '#4F46E5',
                      fontSize: '0.875rem',
                      flexShrink: 0
                    }}>
                      {t.candidates?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9375rem' }}>
                        {t.candidates?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                        {t.candidates?.email}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      backgroundColor: t.candidates?.score >= 80 ? '#DCFCE7' : t.candidates?.score >= 60 ? '#FEF3C7' : '#FEE2E2',
                      color: t.candidates?.score >= 80 ? '#166534' : t.candidates?.score >= 60 ? '#92400E' : '#991B1B'
                    }}>
                      {t.candidates?.score || 0}
                    </span>
                  </div>

                  {/* Folder */}
                  <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                    {t.folder || 'Uncategorized'}
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(t.tags || []).slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        style={{
                          backgroundColor: getTagColor(tag).bg,
                          color: getTagColor(tag).text,
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          padding: '2px 6px',
                          borderRadius: 4
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {(t.tags || []).length > 3 && (
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                        +{t.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Added Date */}
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                    {new Date(t.added_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      {selectedTalent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setSelectedTalent(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 700,
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: 24,
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#4F46E5',
                  fontSize: '1.25rem'
                }}>
                  {selectedTalent.candidates?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                    {selectedTalent.candidates?.name || 'Unknown'}
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
                    {selectedTalent.candidates?.email}
                  </p>
                  {selectedTalent.candidates?.phone && (
                    <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: '4px 0 0' }}>
                      {selectedTalent.candidates.phone}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTalent(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              {/* Stats Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 24
              }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: selectedTalent.candidates?.score >= 80 ? '#059669' : selectedTalent.candidates?.score >= 60 ? '#D97706' : '#DC2626'
                  }}>
                    {selectedTalent.candidates?.score || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>CV Score</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>
                    {selectedTalent.candidates?.experience_years || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Years Exp</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                    {selectedTalent.seniority_level || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Level</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                    {selectedTalent.folder || 'None'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Folder</div>
                </div>
              </div>

              {/* Tags Section */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Tags</h3>
                  <button
                    onClick={() => setShowTagModal(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#F1F5F9',
                      color: '#4F46E5',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    + Add Tag
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(selectedTalent.tags || []).map(tag => (
                    <span
                      key={tag}
                      style={{
                        backgroundColor: getTagColor(tag).bg,
                        color: getTagColor(tag).text,
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        padding: '6px 12px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTagFromCandidate(selectedTalent.id, tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          color: 'inherit',
                          opacity: 0.6
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </span>
                  ))}
                  {(!selectedTalent.tags || selectedTalent.tags.length === 0) && (
                    <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>No tags yet</span>
                  )}
                </div>
              </div>

              {/* AI Notes */}
              {selectedTalent.ai_talent_notes && (
                <div style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  borderLeft: '4px solid #10B981'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', marginBottom: 8 }}>
                    AI TALENT ASSESSMENT
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#064E3B', lineHeight: 1.6, margin: 0 }}>
                    {selectedTalent.ai_talent_notes}
                  </p>
                </div>
              )}

              {/* Recommended Roles */}
              {selectedTalent.ai_recommended_roles && selectedTalent.ai_recommended_roles.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 8 }}>
                    RECOMMENDED ROLES
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedTalent.ai_recommended_roles.map((role, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: '#EEF2FF',
                          color: '#4F46E5',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          padding: '8px 12px',
                          borderRadius: 8
                        }}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Notes</h3>
                  {!editingNotes && (
                    <button
                      onClick={() => {
                        setTempNotes(selectedTalent.notes || '');
                        setEditingNotes(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#F1F5F9',
                        color: '#64748B',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div>
                    <textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Add notes about this candidate..."
                      style={{
                        width: '100%',
                        minHeight: 100,
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid #E2E8F0',
                        fontSize: '0.875rem',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={saveNotes}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4F46E5',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotes(false)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#F1F5F9',
                          color: '#64748B',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    color: selectedTalent.notes ? '#0F172A' : '#94A3B8',
                    lineHeight: 1.6
                  }}>
                    {selectedTalent.notes || 'No notes yet. Click Edit to add notes.'}
                  </div>
                )}
              </div>

              {/* Share Toggle */}
              <div style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                    Share with HireInbox Network
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Allow other companies to view this candidate
                  </div>
                </div>
                <button
                  onClick={() => toggleSharing(selectedTalent.id, selectedTalent.share_with_network)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedTalent.share_with_network ? '#4F46E5' : '#E2E8F0',
                    color: selectedTalent.share_with_network ? 'white' : '#64748B',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {selectedTalent.share_with_network ? 'Sharing' : 'Share'}
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => window.location.href = `mailto:${selectedTalent.candidates?.email}`}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Contact Candidate
                </button>
                <button
                  onClick={() => removeFromPool(selectedTalent.id)}
                  style={{
                    padding: '14px 20px',
                    backgroundColor: 'white',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    borderRadius: 10,
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      {showTagModal && selectedTalent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
          onClick={() => setShowTagModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 400
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
              Add Tag to {selectedTalent.candidates?.name}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    addTagToCandidate(selectedTalent.id, tag);
                    setShowTagModal(false);
                  }}
                  disabled={(selectedTalent.tags || []).includes(tag)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: (selectedTalent.tags || []).includes(tag) ? '#E2E8F0' : getTagColor(tag).bg,
                    color: (selectedTalent.tags || []).includes(tag) ? '#94A3B8' : getTagColor(tag).text,
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: (selectedTalent.tags || []).includes(tag) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Or add custom tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={() => {
                  if (newTag.trim()) {
                    addTagToCandidate(selectedTalent.id, newTag.trim());
                    setNewTag('');
                    setShowTagModal(false);
                  }
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Modal (Bulk) */}
      {showMoveModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
          onClick={() => setShowMoveModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 360
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
              Move {selectedIds.size} candidate{selectedIds.size !== 1 ? 's' : ''} to folder
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FOLDERS.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleBulkMove(folder.name)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ color: folder.color }}>{getFolderIcon(folder.icon)}</span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#0F172A' }}>
                    {folder.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Tag Modal (Bulk) */}
      {showAddTagModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
          onClick={() => setShowAddTagModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 400
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
              Add tag to {selectedIds.size} candidate{selectedIds.size !== 1 ? 's' : ''}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleBulkAddTag(tag)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: getTagColor(tag).bg,
                    color: getTagColor(tag).text,
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Or add custom tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={() => {
                  if (newTag.trim()) {
                    handleBulkAddTag(newTag.trim());
                  }
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
