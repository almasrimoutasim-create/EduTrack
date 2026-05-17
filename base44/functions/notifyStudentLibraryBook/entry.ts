import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { book } = await req.json();

    if (!book?.subject_name || !book?.grade) {
      return Response.json({ error: 'Missing subject or grade' }, { status: 400 });
    }

    // Get all students in that grade who are studying that subject
    const students = await base44.entities.Student.filter({ grade: book.grade });
    
    if (students.length === 0) {
      return Response.json({ status: 'no_students' });
    }

    // Get subjects to check which students follow this subject
    const subjects = await base44.entities.Subject.filter({ name: book.subject_name, grade: book.grade });

    if (subjects.length === 0) {
      return Response.json({ status: 'no_subject' });
    }

    const subject = subjects[0];
    const relevantStudents = students.filter(s => {
      // Students in this grade automatically follow their grade subjects
      return true;
    });

    // Send email notifications to parent emails for relevant students
    const emails = relevantStudents.map(s => s.parent_email).filter(Boolean);
    
    for (const email of emails) {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `📚 New Study Material: ${book.title}`,
        body: `A new PDF book "${book.title}" has been added to the school library for ${book.subject_name} (Grade ${book.grade}).\n\nYour child can now access it through the student portal library section.\n\nBook: ${book.title}\nSubject: ${book.subject_name}`
      });
    }

    return Response.json({ notified: emails.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});