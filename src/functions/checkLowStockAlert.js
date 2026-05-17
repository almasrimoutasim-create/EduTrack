import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/* global Deno */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get admin user (for scheduled tasks, we use service role)
    const items = await base44.asServiceRole.entities.StoreItem.list();
    const lowStockItems = items.filter(
      (item) => item.stock <= item.low_stock_threshold
    );

    if (lowStockItems.length === 0) {
      return Response.json({ checked: true, itemsAlert: [] });
    }

    // Get the current user's email for notification (if running from request)
    let recipientEmail = 'admin@example.com';
    try {
      const user = await base44.auth.me();
      if (user?.email) recipientEmail = user.email;
    } catch {
      // If no user context, use admin email
    }

    // Send email alert
    const subject = `⚠️ Low Stock Alert - ${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''}`;
    const itemsList = lowStockItems
      .map(
        (item) =>
          `• ${item.name}: ${item.stock} units (threshold: ${item.low_stock_threshold})`
      )
      .join('\n');

    const body = `Low Stock Alert\n\nThe following items have fallen below their stock threshold:\n\n${itemsList}\n\nPlease reorder stock as needed.`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject,
      body,
      from_name: 'EduTrack Store',
    });

    return Response.json({
      checked: true,
      itemsAlert: lowStockItems.map((i) => ({ id: i.id, name: i.name, stock: i.stock, threshold: i.low_stock_threshold })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});