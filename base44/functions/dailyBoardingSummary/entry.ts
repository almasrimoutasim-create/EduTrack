import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all admin users to send summary
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const admins = adminUsers.slice(0, 5); // Limit to first 5 admins
    
    // Get all students with bus registration
    const students = await base44.asServiceRole.entities.Student.filter({ bus_registered: true });
    
    // Get today's attendance records
    const today = new Date().toISOString().split('T')[0];
    const attendanceRecords = await base44.asServiceRole.entities.Attendance.filter({ 
      date: today 
    });
    
    // Group students by bus route
    const routeMap = {};
    students.forEach(student => {
      if (student.bus_route) {
        if (!routeMap[student.bus_route]) {
          routeMap[student.bus_route] = {
            total: 0,
            boarded: 0,
            notBoarded: 0,
            students: []
          };
        }
        
        routeMap[student.bus_route].total++;
        
        // Check if student boarded today
        const boarded = attendanceRecords.some(record => 
          record.student_id === student.student_id && record.type === 'bus_in'
        );
        
        if (boarded) {
          routeMap[student.bus_route].boarded++;
        } else {
          routeMap[student.bus_route].notBoarded++;
          routeMap[student.bus_route].students.push(student.full_name);
        }
      }
    });
    
    // Generate summary HTML
    let summaryHtml = `<h2>Daily Boarding Status Summary - ${new Date(today).toLocaleDateString()}</h2>`;
    
    Object.entries(routeMap).forEach(([route, data]) => {
      const percentage = ((data.boarded / data.total) * 100).toFixed(1);
      summaryHtml += `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h3>${route}</h3>
          <p><strong>Total Students:</strong> ${data.total}</p>
          <p><strong>Boarded:</strong> ${data.boarded} (${percentage}%)</p>
          <p><strong>Not Boarded:</strong> ${data.notBoarded}</p>
          ${data.notBoarded > 0 ? `<p><strong>Missing Students:</strong> ${data.students.join(', ')}</p>` : ''}
        </div>
      `;
    });
    
    // Send email to all admins
    for (const admin of admins) {
      await base44.integrations.Core.SendEmail({
        to: admin.email,
        subject: `Daily Boarding Status Summary - ${new Date(today).toLocaleDateString()}`,
        body: summaryHtml,
        from_name: 'EduTrack School'
      });
    }
    
    return Response.json({ 
      success: true, 
      message: `Summary sent to ${admins.length} admin(s)`,
      routes: Object.keys(routeMap).length,
      totalStudents: students.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});