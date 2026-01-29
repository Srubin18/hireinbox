'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';

// ============================================
// useProfile Hook
// Fetches and manages user profile + business data
// ============================================

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  userType: 'employer' | 'candidate' | 'recruiter' | 'admin';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  companySize: string | null;
  location: string | null;
  inboxEmail: string | null;
  plan: string;
  isActive: boolean;
  userRole: 'owner' | 'admin' | 'member' | 'viewer';
}

export interface UseProfileReturn {
  profile: Profile | null;
  businesses: Business[];
  currentBusiness: Business | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  createBusiness: (data: { name: string; industry?: string; companySize?: string; location?: string }) => Promise<{ business: Business | null; error: string | null }>;
  setCurrentBusiness: (businessId: string) => void;
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile and businesses
  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setBusinesses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch profile
      const profileRes = await fetch(`/api/profile?userId=${user.id}`);
      const profileData = await profileRes.json();

      if (profileData.profile) {
        setProfile({
          id: profileData.profile.id,
          email: profileData.profile.email,
          fullName: profileData.profile.full_name,
          avatarUrl: profileData.profile.avatar_url,
          userType: profileData.profile.user_type,
          createdAt: profileData.profile.created_at,
          updatedAt: profileData.profile.updated_at,
          isActive: profileData.profile.is_active
        });
      } else {
        // Create profile if doesn't exist
        const createRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || '',
            userType: user.user_metadata?.user_type || 'candidate'
          })
        });
        const createData = await createRes.json();
        if (createData.profile) {
          setProfile({
            id: createData.profile.id,
            email: createData.profile.email,
            fullName: createData.profile.full_name,
            avatarUrl: createData.profile.avatar_url,
            userType: createData.profile.user_type,
            createdAt: createData.profile.created_at,
            updatedAt: createData.profile.updated_at,
            isActive: createData.profile.is_active
          });
        }
      }

      // Fetch businesses if employer
      const bizRes = await fetch(`/api/business?userId=${user.id}`);
      const bizData = await bizRes.json();

      if (bizData.businesses) {
        const mappedBusinesses = bizData.businesses.map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          industry: b.industry,
          companySize: b.company_size,
          location: b.location,
          inboxEmail: b.inbox_email,
          plan: b.plan,
          isActive: b.is_active,
          userRole: b.userRole
        }));
        setBusinesses(mappedBusinesses);

        // Set first business as current if not set
        if (!currentBusinessId && mappedBusinesses.length > 0) {
          setCurrentBusinessId(mappedBusinesses[0].id);
        }
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, user?.user_metadata, currentBusinessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user?.id) return { error: 'Not authenticated' };

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...updates })
      });

      const data = await res.json();
      if (data.error) return { error: data.error };

      await fetchData();
      return { error: null };
    } catch {
      return { error: 'Failed to update profile' };
    }
  }, [user?.id, fetchData]);

  // Create business
  const createBusiness = useCallback(async (data: { name: string; industry?: string; companySize?: string; location?: string }) => {
    if (!user?.id) return { business: null, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...data })
      });

      const result = await res.json();
      if (result.error) return { business: null, error: result.error };

      await fetchData();
      return {
        business: {
          id: result.business.id,
          name: result.business.name,
          slug: result.business.slug,
          inboxEmail: result.business.inboxEmail,
          industry: null,
          companySize: null,
          location: null,
          plan: 'free',
          isActive: true,
          userRole: 'owner' as const
        },
        error: null
      };
    } catch {
      return { business: null, error: 'Failed to create business' };
    }
  }, [user?.id, fetchData]);

  // Set current business
  const setCurrentBusiness = useCallback((businessId: string) => {
    setCurrentBusinessId(businessId);
  }, []);

  // Get current business
  const currentBusiness = businesses.find(b => b.id === currentBusinessId) || null;

  return {
    profile,
    businesses,
    currentBusiness,
    loading,
    error,
    refetch: fetchData,
    updateProfile,
    createBusiness,
    setCurrentBusiness
  };
}
