import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !data.student_name || !data.parent_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await base44.integrations.Core.SendEmail({
      to: data.parent_email,
      subject: `Fine Issued for ${data.student_name}`,
      body: `Dear Parent,\n\nA fine has been issued to your child, ${data.student_name}.\n\nAmount: ${data.amount}\nReason: ${data.reason}\nStatus: ${data.status}\nDate Issued: ${new Date(data.created_date).toLocaleDateString()}\n\nPlease log into the parent portal to view details and make payment if needed.\n\nBest regards,\nSchool Administration`,
      from_name: 'EduTrack School'
    });

    return Response.json({ success: true, message: 'Email sent to parent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});