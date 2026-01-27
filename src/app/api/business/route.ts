import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// BUSINESS API
// Create and manage employer accounts
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Create a new business
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, industry, companySize, location, website } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .single();

    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    // Create business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({
        name,
        slug: finalSlug,
        industry,
        company_size: companySize,
        location,
        website,
        inbox_email: `${finalSlug}@hireinbox.co.za`
      })
      .select()
      .single();

    if (bizError) {
      console.error('Business creation error:', bizError);
      return NextResponse.json(
        { error: 'Failed to create business' },
        { status: 500 }
      );
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: business.id,
        user_id: userId,
        role: 'owner',
        accepted_at: new Date().toISOString()
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // Still return success but log the error
    }

    // Update user profile to employer type
    await supabase
      .from('profiles')
      .update({ user_type: 'employer' })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        inboxEmail: business.inbox_email
      }
    });

  } catch (error) {
    console.error('Business API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get businesses for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user's businesses
    const { data: memberships, error: memberError } = await supabase
      .from('business_members')
      .select(`
        role,
        business:businesses (
          id,
          name,
          slug,
          industry,
          company_size,
          location,
          inbox_email,
          plan,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (memberError) {
      console.error('Get businesses error:', memberError);
      return NextResponse.json(
        { error: 'Failed to fetch businesses' },
        { status: 500 }
      );
    }

    const businesses = memberships?.map(m => ({
      ...m.business,
      userRole: m.role
    })) || [];

    return NextResponse.json({ businesses });

  } catch (error) {
    console.error('Get businesses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
