import { NextRequest, NextResponse } from 'next/server';
import { routeEmail, assignEmailToRole } from '@/lib/email-router';
import { createClient } from '@supabase/supabase-js';

// ============================================
// EMAIL ROUTING API
// Routes incoming CVs to correct roles
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Route an email to the correct role
export async function POST(request: NextRequest) {
  try {
    const { businessId, subject, body, fromEmail, candidateId } = await request.json();

    if (!businessId || !subject) {
      return NextResponse.json(
        { error: 'businessId and subject are required' },
        { status: 400 }
      );
    }

    // Get active roles for this business
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, title, department')
      .eq('business_id', businessId)
      .eq('status', 'active');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      );
    }

    // Route the email
    const routingResult = await routeEmail(
      subject,
      body || '',
      roles?.map(r => ({
        id: r.id,
        title: r.title,
        department: r.department
      })) || []
    );

    // If we have a candidate ID, update their role assignment
    if (candidateId && routingResult.matchedRoleId) {
      await supabase
        .from('candidates')
        .update({
          role_id: routingResult.matchedRoleId,
          routing_confidence: routingResult.confidence,
          routing_reason: routingResult.reason
        })
        .eq('id', candidateId);
    }

    // If needs assignment, add to queue
    if (routingResult.needsAssignment && candidateId) {
      await supabase
        .from('candidates')
        .update({
          needs_assignment: true,
          suggested_roles: routingResult.suggestedRoles || []
        })
        .eq('id', candidateId);
    }

    return NextResponse.json({
      ...routingResult,
      rolesChecked: roles?.length || 0
    });

  } catch (error) {
    console.error('Email routing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Manually assign an email to a role
export async function PATCH(request: NextRequest) {
  try {
    const { candidateId, roleId, assignedBy } = await request.json();

    if (!candidateId || !roleId) {
      return NextResponse.json(
        { error: 'candidateId and roleId are required' },
        { status: 400 }
      );
    }

    // Update candidate
    const { error } = await supabase
      .from('candidates')
      .update({
        role_id: roleId,
        needs_assignment: false,
        routing_confidence: 'manual',
        routing_reason: `Manually assigned by ${assignedBy || 'employer'}`,
        assigned_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    if (error) {
      console.error('Assignment error:', error);
      return NextResponse.json(
        { error: 'Failed to assign candidate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Candidate assigned to role'
    });

  } catch (error) {
    console.error('Assignment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get candidates needing assignment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    // Get candidates that need assignment
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select(`
        id,
        name,
        email,
        created_at,
        suggested_roles
      `)
      .eq('needs_assignment', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch unassigned error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch candidates' },
        { status: 500 }
      );
    }

    // Get roles for context
    const { data: roles } = await supabase
      .from('roles')
      .select('id, title')
      .eq('business_id', businessId)
      .eq('status', 'active');

    return NextResponse.json({
      unassigned: candidates || [],
      roles: roles || []
    });

  } catch (error) {
    console.error('Get unassigned error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
