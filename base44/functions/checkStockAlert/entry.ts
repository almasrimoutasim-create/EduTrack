import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { item_id, item_name, stock, threshold } = payload;

    if (!item_name || stock === undefined || threshold === undefined) {
      return Response.json({ skipped: true, reason: "missing params" });
    }

    // Only notify if stock is at or below threshold
    if (stock > threshold) {
      return Response.json({ skipped: true, reason: `stock ${stock} above threshold ${threshold}` });
    }

    const base44 = createClientFromRequest(req);

    // Get all admin users
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter(u => u.role === "admin");

    // Send notification to each admin
    for (const admin of admins) {
      await base44.asServiceRole.entities.PortalNotification.create({
        recipient_id: admin.id,
        message: `⚠ Low Stock Alert: "${item_name}" has only ${stock} units left (threshold: ${threshold})`,
        type: "alert",
        ref_id: item_id,
        is_read: false,
      });
    }

    return Response.json({ success: true, notified_admins: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});