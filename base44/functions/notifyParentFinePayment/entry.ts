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
      subject: `Fine Payment Received for ${data.student_name}`,
      body: `Dear Parent,\n\nThank you for the payment. A fine payment has been successfully processed for your child, ${data.student_name}.\n\nAmount Paid: ${data.amount}\nReason: ${data.reason}\nDate Paid: ${new Date().toLocaleDateString()}\n\nYour payment has been credited to the student's account.\n\nBest regards,\nSchool Administration`,
      from_name: 'EduTrack School'
    });

    return Response.json({ success: true, message: 'Payment confirmation email sent to parent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});