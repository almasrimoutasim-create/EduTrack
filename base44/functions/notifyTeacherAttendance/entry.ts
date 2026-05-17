import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data, event } = body;

    // Only act on absent or late records
    if (!data || (data.status !== "absent" && data.status !== "late")) {
      return Response.json({ skipped: true, reason: "Not absent or late" });
    }

    const studentId = data.student_id;
    if (!studentId) return Response.json({ skipped: true, reason: "No student_id" });

    // Find teachers who teach this student's grade/subject
    const filters = {};
    if (data.subject_name) filters.subject_name = data.subject_name;

    const [students, teachers] = await Promise.all([
      base44.asServiceRole.entities.Student.filter({ id: studentId }),
      base44.asServiceRole.entities.Teacher.list(),
    ]);

    const student = students[0];
    if (!student) return Response.json({ skipped: true, reason: "Student not found" });

    // Find relevant teachers: those who have a class schedule for this grade
    const schedules = await base44.asServiceRole.entities.ClassSchedule.filter({ grade: student.grade });
    const teacherIds = [...new Set(schedules.map(s => s.teacher_id).filter(Boolean))];

    if (teacherIds.length === 0) {
      return Response.json({ skipped: true, reason: "No teachers found for this grade" });
    }

    const statusLabel = data.status === "absent" ? "absent" : "late";
    const dateStr = data.date || new Date().toISOString().split("T")[0];
    const timeStr = data.time ? ` at ${data.time}` : "";
    const subjectStr = data.subject_name ? ` for ${data.subject_name}` : "";
    const message = `⚠️ ${student.full_name} was marked ${statusLabel}${subjectStr} on ${dateStr}${timeStr}.`;

    // Create portal notifications for each relevant teacher
    await Promise.all(teacherIds.map(tid =>
      base44.asServiceRole.entities.PortalNotification.create({
        recipient_id: tid,
        message,
        type: "message",
        ref_id: studentId,
        is_read: false,
      })
    ));

    return Response.json({ success: true, notified_teachers: teacherIds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});