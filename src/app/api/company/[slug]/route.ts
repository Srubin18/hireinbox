import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// COMPANY PUBLIC PROFILE API
// Fetch public company information by slug
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Company slug is required' },
        { status: 400 }
      );
    }

    // Fetch company by slug
    const { data: company, error: companyError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        slug,
        industry,
        company_size,
        location,
        website,
        description,
        logo_url,
        cover_url,
        founded,
        benefits,
        culture,
        is_active
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Fetch active roles for this company
    const { data: roles } = await supabase
      .from('roles')
      .select(`
        id,
        title,
        location,
        employment_type,
        salary_min,
        salary_max,
        created_at,
        is_active
      `)
      .eq('business_id', company.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Format response
    const formattedCompany = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      industry: company.industry,
      companySize: company.company_size,
      location: company.location,
      website: company.website,
      description: company.description,
      logoUrl: company.logo_url,
      coverUrl: company.cover_url,
      founded: company.founded,
      benefits: company.benefits || [],
      culture: company.culture
    };

    const formattedRoles = (roles || []).map(role => ({
      id: role.id,
      title: role.title,
      location: role.location,
      type: role.employment_type || 'Full-time',
      salary: role.salary_min && role.salary_max
        ? `R${(role.salary_min / 1000).toFixed(0)}k - R${(role.salary_max / 1000).toFixed(0)}k/month`
        : null,
      postedAt: new Date(role.created_at).toISOString().split('T')[0],
      isActive: role.is_active
    }));

    return NextResponse.json({
      company: formattedCompany,
      roles: formattedRoles
    });

  } catch (error) {
    console.error('Company profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
