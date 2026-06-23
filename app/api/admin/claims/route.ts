import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { secureJson } from '@/lib/requestSecurity';

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('token');

    if (!token || token !== process.env.ADMIN_API_TOKEN) {
      return secureJson({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pending claims
    const { data: claims, error } = await supabase
      .from('claims')
      .select('id, entity_type, entity_id, claim_type, data, confidence, created_at, source')
      .in('claim_type', ['figure_change_request', 'figure_info_submission'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch claims:', error);
      return secureJson({ error: 'Failed to fetch claims' }, { status: 500 });
    }

    // Enrich with figure details for context
    const enriched = await Promise.all(
      (claims || []).map(async (claim: any) => {
        if (claim.entity_type === 'figure') {
          const { data: fig } = await supabase
            .from('figures')
            .select('id, name, base_buck, year, lines(name)')
            .eq('id', claim.entity_id)
            .maybeSingle();

          return { ...claim, figure: fig };
        }
        return claim;
      }),
    );

    return secureJson({ claims: enriched });
  } catch (err) {
    console.error('Error fetching claims:', err);
    return secureJson({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || (await request.json()).token;

    if (!token || token !== process.env.ADMIN_API_TOKEN) {
      return secureJson({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { claimId, action } = body;

    if (!claimId || !['approve', 'reject'].includes(action)) {
      return secureJson({ error: 'claimId and action (approve/reject) required' }, { status: 400 });
    }

    // Fetch the claim
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .maybeSingle();

    if (claimError || !claim) {
      return secureJson({ error: 'Claim not found' }, { status: 404 });
    }

    if (action === 'reject') {
      // Mark claim as rejected in metadata
      const { error: updateError } = await supabase
        .from('claims')
        .update({
          data: {
            ...claim.data,
            admin_review: {
              status: 'rejected',
              reviewed_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', claimId);

      if (updateError) {
        console.error('Failed to reject claim:', updateError);
        return secureJson({ error: 'Failed to reject claim' }, { status: 500 });
      }

      return secureJson({ success: true, message: 'Claim rejected' });
    }

    if (action === 'approve') {
      // Apply changes based on claim type
      if (claim.claim_type === 'figure_change_request') {
        const change = claim.data.change;
        const figureId = claim.entity_id;
        const field = change.field;
        const proposedValue = change.proposed_value;

        // Map field names to DB columns
        const updatePayload: Record<string, any> = {};
        if (field === 'base_buck') updatePayload.base_buck = proposedValue;
        else if (field === 'name') updatePayload.name = proposedValue;
        else if (field === 'year') updatePayload.year = proposedValue;
        // line_name requires updating line_id, not implemented here

        if (Object.keys(updatePayload).length === 0) {
          return secureJson({ error: 'Cannot apply this field change' }, { status: 400 });
        }

        // Apply change to figures table
        const { error: updateError } = await supabase
          .from('figures')
          .update(updatePayload)
          .eq('id', figureId);

        if (updateError) {
          console.error('Failed to apply figure change:', updateError);
          return secureJson({ error: 'Failed to apply change' }, { status: 500 });
        }

        // Mark claim as approved
        const { error: claimUpdateError } = await supabase
          .from('claims')
          .update({
            data: {
              ...claim.data,
              admin_review: {
                status: 'approved_and_applied',
                reviewed_at: new Date().toISOString(),
                applied_to_figure_id: figureId,
              },
            },
          })
          .eq('id', claimId);

        if (claimUpdateError) {
          console.error('Failed to mark claim as applied:', claimUpdateError);
          return secureJson({ error: 'Applied but failed to mark claim' }, { status: 500 });
        }

        return secureJson({
          success: true,
          message: `Figure change applied: ${field} = ${proposedValue}`,
        });
      }

      if (claim.claim_type === 'figure_info_submission') {
        // For figure info, we approve but may need manual review
        const { error: updateError } = await supabase
          .from('claims')
          .update({
            data: {
              ...claim.data,
              admin_review: {
                status: 'approved',
                reviewed_at: new Date().toISOString(),
              },
            },
          })
          .eq('id', claimId);

        if (updateError) {
          console.error('Failed to approve figure info:', updateError);
          return secureJson({ error: 'Failed to approve claim' }, { status: 500 });
        }

        return secureJson({ success: true, message: 'Figure info claim approved' });
      }

      return secureJson({ error: 'Unknown claim type' }, { status: 400 });
    }

    return secureJson({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Error processing claim:', err);
    return secureJson({ error: 'Internal server error' }, { status: 500 });
  }
}
