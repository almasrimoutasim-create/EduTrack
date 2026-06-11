async function test() {
  try {
    const response = await fetch('http://localhost:3000/neon-db/entities/StaffMember', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: "Test Staff",
        employee_id: "STF-TEST",
        role: "bus_supervisor",
        email: "test@example.com",
        phone: "123456",
        status: "active",
        notes: "Test notes"
      }),
    });
    console.log('Status:', response.status);
    console.log('Body:', await response.text());
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
