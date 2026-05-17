import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') {
      return Response.json({ status: 'skipped' });
    }

    const fine = data;

    // Create notification for the student
    await base44.asServiceRole.entities.PortalNotification.create({
      recipient_id: fine.student_id,
      type: 'fine',
      message: `You have been issued a fine of ${fine.amount} for ${fine.reason}`,
      related_entity_id: fine.id,
      related_entity_type: 'Fine',
      is_read: false
    });

    return Response.json({ status: 'notified' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});