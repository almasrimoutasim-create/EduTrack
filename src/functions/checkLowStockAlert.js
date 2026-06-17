/* global Deno */
// This script is meant to run as a scheduled task (Cron Job).
// It checks for low stock items and sends an email alert.
// In the new architecture, you should run this using your own backend (e.g. Node.js cron or Vercel cron)
// and fetch data directly from Neon PostgreSQL using dbClient or SQL.

Deno.serve(async (req) => {
  try {
    // In a real implementation, you would fetch from your database directly:
    // const { rows } = await sql`SELECT * FROM store_items WHERE stock <= low_stock_threshold`;
    const lowStockItems = []; // Replaced base44 database call with empty mock array
    
    if (lowStockItems.length === 0) {
      return Response.json({ checked: true, itemsAlert: [] });
    }

    // Get the current user's email for notification (if running from request)
    let recipientEmail = 'admin@example.com';
    
    // Send email alert via a standard API like SendGrid, Resend, or your own SMTP server
    const subject = `⚠️ Low Stock Alert - ${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''}`;
    const itemsList = lowStockItems
      .map((item) => `• ${item.name}: ${item.stock} units (threshold: ${item.low_stock_threshold})`)
      .join('\n');

    const body = `Low Stock Alert\n\nThe following items have fallen below their stock threshold:\n\n${itemsList}\n\nPlease reorder stock as needed.`;

    // Example replacement for base44 email sender:
    // await fetch('https://api.resend.com/emails', { ... });
    console.log(`Sending email to ${recipientEmail}: ${subject}`);

    return Response.json({
      checked: true,
      itemsAlert: lowStockItems.map((i) => ({ id: i.id, name: i.name, stock: i.stock, threshold: i.low_stock_threshold })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});