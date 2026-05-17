import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data, event } = body;

    // Only act on absent or late records
    if (!data || (data.status !== "absent" && data.status !== "late")) {
      return Response.json({ skipped: true, reason: "Not an absence or late record" });
    }

    const studentId = data.student_id;
    if (!studentId) {
      return Response.json({ skipped: true, reason: "No student_id" });
    }

    // Fetch student to get parent email
    const students = await base44.asServiceRole.entities.Student.filter({ id: studentId });
    const student = students[0];

    if (!student) {
      return Response.json({ skipped: true, reason: "Student not found" });
    }

    const parentEmail = student.parent_email;
    if (!parentEmail) {
      return Response.json({ skipped: true, reason: "No parent email on file" });
    }

    const dateStr = data.date || new Date().toISOString().split("T")[0];
    const timeStr = data.time ? ` at ${data.time}` : "";
    const typeLabel = {
      gate_in: "Gate Entry",
      gate_out: "Gate Exit",
      bus_in: "Bus Arrival",
      bus_out: "Bus Departure",
      class: "Class",
    }[data.type] || data.type || "School";

    const isLate = data.status === "late";
    const subject = `${isLate ? "Late Arrival" : "Absence"} Alert: ${student.full_name} — ${dateStr}`;
    const body_html = `
Dear ${student.parent_name || "Parent/Guardian"},

We would like to inform you that your child, <strong>${student.full_name}</strong>, was marked <strong>${isLate ? "late" : "absent"}</strong> for <strong>${typeLabel}</strong> on <strong>${dateStr}${timeStr}</strong>.

${data.subject_name ? `Subject: ${data.subject_name}` : ""}
${data.notes ? `Notes: ${data.notes}` : ""}

If you have any questions or this is an error, please contact the school office immediately.

Regards,
EduTrack School Management
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: parentEmail,
      subject,
      body: body_html,
    });

    return Response.json({ success: true, notified: parentEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});