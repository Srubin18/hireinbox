import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List roles
export async function GET() {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ roles });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST - Create a new role
export async function POST(request: Request) {
  try {
    // Get user from auth header for billing tracking
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (e) {
        console.error('[Roles] Auth error:', e);
      }
    }

    const body = await request.json();
    const {
      title,
      description,
      department,
      location,
      experienceMin,
      experienceMax,
      seniorityLevel,
      employmentType,
      workArrangement,
      salaryMin,
      salaryMax,
      qualifications,
      mustHaveSkills,
      niceToHaveSkills,
      dealbreakers
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Build the role object
    const roleData = {
      title: title.trim(),
      status: 'active',
      context: {
        seniority: seniorityLevel || 'Mid-level',
        employment_type: employmentType || 'Full-time',
        department: department || null,
        work_arrangement: workArrangement || 'Onsite'
      },
      facts: {
        min_experience_years: experienceMin ? parseInt(experienceMin) : 0,
        max_experience_years: experienceMax ? parseInt(experienceMax) : null,
        required_skills: mustHaveSkills ? mustHaveSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        qualifications: qualifications ? qualifications.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        location: location || 'Remote',
        work_type: workArrangement || 'Onsite',
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null
      },
      preferences: {
        nice_to_have: niceToHaveSkills || ''
      },
      ai_guidance: {
        strong_fit: description || '',
        disqualifiers: dealbreakers || ''
      },
      criteria: {
        min_experience_years: experienceMin ? parseInt(experienceMin) : 0,
        required_skills: mustHaveSkills ? mustHaveSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        locations: location ? [location] : []
      }
    };

    const { data, error } = await supabase
      .from('roles')
      .insert(roleData)
      .select()
      .single();

    if (error) {
      console.error('Role creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log billing event (role created)
    if (userId && data) {
      try {
        const eventDate = new Date();
        const eventMonth = eventDate.toISOString().slice(0, 7); // YYYY-MM

        await supabase
          .from('pilot_billing_events')
          .insert({
            user_id: userId,
            event_type: 'role_created',
            event_date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD
            event_month: eventMonth,
            related_id: data.id,
            metadata: {
              role_title: title,
              location: location,
              seniority: seniorityLevel,
            }
          });

        console.log('[Roles] Logged billing event for role:', data.id);
      } catch (billingError) {
        console.error('[Roles] Failed to log billing event:', billingError);
        // Don't fail the request if billing logging fails
      }
    }

    return NextResponse.json({ role: data, success: true });
  } catch (err) {
    console.error('Role creation error:', err);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
