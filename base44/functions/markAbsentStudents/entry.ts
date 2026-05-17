import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// This function is called on a schedule to mark students absent
// when a room's session has ended and they never joined.
// Since we don't have a class roster, we update the absent counter
// for students whose attendance record is "absent" status.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find all absent attendance records that haven't been processed for score update
    const absentRecords = await base44.asServiceRole.entities.Attendance.filter({
      status: "absent",
      recorded_by: "auto_absent",
    });

    let updated = 0;
    for (const record of absentRecords) {
      if (!record.student_id) continue;

      // Get the student
      const students = await base44.asServiceRole.entities.Student.filter({ id: record.student_id });
      const student = students[0];
      if (!student) continue;

      const newAbsences = (student.total_absences || 0) + 1;
      const newLates = student.total_lates || 0;
      const newScore = Math.max(0, 100 - newAbsences * 10 - newLates * 5);

      await base44.asServiceRole.entities.Student.update(student.id, {
        attendance_score: newScore,
        total_absences: newAbsences,
      });

      // Mark record as processed so we don't double-count
      await base44.asServiceRole.entities.Attendance.update(record.id, {
        recorded_by: "auto_absent_processed",
      });

      // Notify parent if email exists
      if (student.parent_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: student.parent_email,
          subject: `Absence Alert: ${student.full_name}`,
          body: `Dear ${student.parent_name || "Parent"},\n\nThis is to inform you that ${student.full_name} was marked ABSENT for a class session on ${record.date}.\n\nRoom: ${record.subject_name || "N/A"}\nNew Attendance Score: ${newScore}/100\n\nPlease contact the school if you have any questions.\n\nEduTrack System`,
        });
      }

      updated++;
    }

    return Response.json({ success: true, processed: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});