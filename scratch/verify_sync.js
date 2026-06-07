import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const sql = neon(url);
  try {
    const students = await sql`SELECT id FROM students LIMIT 1`;
    if (students.length === 0) {
      console.log('No students found to test sync.');
      return;
    }
    const studentId = students[0].id;
    console.log('Using student ID:', studentId);

    // 1. Create a student fee
    // Note: Since we are querying database directly, our API hooks don't run.
    // Let's test the sync logic manually by hitting the local server or simulating it.
    // Let's hit the local dev API server (which is running on port 3000 or from vite on port 5173).
    // Let's check where the dev server runs. The server runs on port 3000.
    // Let's call the API endpoints locally via fetch!
    
    console.log('Sending requests to local server API...');
    const createFeeRes = await fetch('http://localhost:5173/neon-db/entities/StudentFee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        fee_name: 'Sync Test Fee',
        amount: 500,
        due_date: '2026-07-01',
        created_by: 'admin-id'
      })
    });
    
    if (!createFeeRes.ok) {
      const errText = await createFeeRes.text();
      throw new Error(`Failed to create fee: ${errText}`);
    }
    
    const newFee = await createFeeRes.json();
    console.log('✓ Created StudentFee via API:', newFee);
    console.log('  remaining amount:', newFee.remaining); // Should default to 500

    // 2. Record a payment
    console.log('Recording a payment of 200...');
    const createPaymentRes = await fetch('http://localhost:5173/neon-db/entities/FeePayment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_fee_id: newFee.id,
        student_id: studentId,
        amount: 200,
        payment_method: 'cash',
        paid_by: 'admin-id'
      })
    });

    if (!createPaymentRes.ok) {
      const errText = await createPaymentRes.text();
      throw new Error(`Failed to create payment: ${errText}`);
    }

    const newPayment = await createPaymentRes.json();
    console.log('✓ Recorded FeePayment:', newPayment);

    // 3. Fetch StudentFee and inspect updated values
    const getFeeRes = await fetch(`http://localhost:5173/neon-db/entities/StudentFee/${newFee.id}`);
    const updatedFee = await getFeeRes.json();
    console.log('✓ Updated StudentFee values:');
    console.log('  amount_paid:', updatedFee.amount_paid); // Should be 200
    console.log('  remaining:', updatedFee.remaining);     // Should be 300
    console.log('  status:', updatedFee.status);           // Should be 'partial'

    // 4. Record another payment to fully pay it
    console.log('Recording another payment of 300...');
    await fetch('http://localhost:5173/neon-db/entities/FeePayment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_fee_id: newFee.id,
        student_id: studentId,
        amount: 300,
        payment_method: 'cash',
        paid_by: 'admin-id'
      })
    });

    // 5. Verify final status is paid
    const getFeeRes2 = await fetch(`http://localhost:5173/neon-db/entities/StudentFee/${newFee.id}`);
    const finalFee = await getFeeRes2.json();
    console.log('✓ Final StudentFee values:');
    console.log('  amount_paid:', finalFee.amount_paid); // Should be 500
    console.log('  remaining:', finalFee.remaining);     // Should be 0
    console.log('  status:', finalFee.status);           // Should be 'paid'

    // Clean up
    console.log('Cleaning up...');
    await fetch(`http://localhost:5173/neon-db/entities/StudentFee/${newFee.id}`, { method: 'DELETE' });
    console.log('✓ Cleaned up.');

  } catch (err) {
    console.error('Test Failed:', err.message);
  }
}
run();
