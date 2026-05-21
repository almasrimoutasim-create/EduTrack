import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  // 1. Get student 0003
  const students = await sql`SELECT * FROM students WHERE student_id = '0003'`;
  if (students.length === 0) {
    console.error('Student 0003 not found');
    return;
  }
  const student = students[0];
  console.log('Student loaded:', student.full_name, 'Balance:', student.card_balance);

  // 2. Get a store item
  const items = await sql`SELECT * FROM store_items LIMIT 1`;
  if (items.length === 0) {
    console.error('No store items found');
    return;
  }
  const item = items[0];
  console.log('Store item loaded:', item.name, 'Stock:', item.stock);

  const cartTotal = parseFloat(item.price);
  
  console.log('\n--- SIMULATING CHECKOUT WALLET ---');
  
  try {
    // 1. Deduct balance
    const finalBalance = parseFloat(student.card_balance) - cartTotal;
    console.log('1. Updating student balance to', finalBalance);
    await sql`UPDATE students SET card_balance = ${finalBalance} WHERE id = ${student.id}`;
    
    // 2. Decrement stock
    const newStock = Math.max(0, parseInt(item.stock) - 1);
    console.log('2. Updating stock to', newStock);
    await sql`UPDATE store_items SET stock = ${newStock} WHERE id = ${item.id}`;

    // 3. Create purchase
    console.log('3. Creating purchase record...');
    // We try to match what is done in Store.jsx:
    // keys: student_id, student_name, item_id, item_name, quantity, total_price, payment_method
    const pResult = await sql`
      INSERT INTO purchases (student_id, student_name, item_id, item_name, quantity, total_price, payment_method)
      VALUES (${student.id}, ${student.full_name}, ${item.id}, ${item.name}, 1, ${cartTotal}, 'card')
      RETURNING *
    `;
    console.log('Purchase created:', pResult[0]);

    // 4. Create financial record
    console.log('4. Creating financial record...');
    const fResult = await sql`
      INSERT INTO financial_records (record_type, recipient_type, recipient_name, recipient_id, amount, description, payment_date, status, payment_method)
      VALUES ('income', 'student', ${student.full_name}, ${student.id}, ${cartTotal}, ${`Store Purchase: ${item.name}`}, '2026-05-21', 'paid', 'card')
      RETURNING *
    `;
    console.log('Financial record created:', fResult[0]);
    
    console.log('\nSUCCESS!');
  } catch (err) {
    console.error('\nERROR OCCURRED during simulation:', err);
  }
}

run().catch(console.error);
