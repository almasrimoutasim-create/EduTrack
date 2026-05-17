import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const fine = payload.data;
    if (!fine) return Response.json({ skipped: true, reason: "no fine data" });

    // Only notify for missing_item category
    if (fine.category !== "missing_item") {
      return Response.json({ skipped: true, reason: "not a missing_item fine" });
    }

    // Get the student record to find parent email
    const students = await base44.asServiceRole.entities.Student.filter({ id: fine.student_id });
    const student = students[0];

    const notifications = [];

    // Notify parent via email if they have an email
    if (student?.parent_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: student.parent_email,
        subject: `Fine Issued: Missing Item — ${student.full_name}`,
        body: `Dear ${student.parent_name || "Parent"},\n\nA fine has been issued to ${student.full_name} for a missing item.\n\nDetails:\n- Reason: ${fine.reason}\n- Amount: $${(fine.amount || 0).toFixed(2)}\n- Date: ${fine.date}\n- Issued by: ${fine.issued_by || "School Administration"}\n\nPlease contact the school administration if you have any questions.\n\nRegards,\nEduTrack School Management`,
      });
      notifications.push("parent_email");
    }

    // Create an in-app notification for the student
    if (fine.student_id) {
      await base44.asServiceRole.entities.PortalNotification.create({
        recipient_id: fine.student_id,
        message: `A fine of $${(fine.amount || 0).toFixed(2)} was issued for: ${fine.reason}`,
        type: "message",
        ref_id: fine.student_id,
        is_read: false,
      });
      notifications.push("student_portal_notification");
    }

    // Mark fine as notified
    if (fine.id) {
      await base44.asServiceRole.entities.Fine.update(fine.id, { notification_sent: true });
    }

    return Response.json({ success: true, notifications_sent: notifications });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});