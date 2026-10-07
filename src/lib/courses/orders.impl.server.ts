// Server-only: đánh dấu đơn hàng đã thanh toán/thất bại + cấp enrollment.
// Dùng dynamic import để không lộ service-role client ra bundle client.

type MarkPaidOpts = {
  note?: string;
  actorUserId?: string;
  providerRef?: string;
  provider?: "pay2s" | "momo" | "zalopay" | "manual";
  amountVnd?: number;
  rawPayload?: Record<string, unknown>;
};

export async function markOrderPaid(orderId: string, opts?: MarkPaidOpts) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin
    .from("course_orders")
    .select("id, order_no, user_id, customer_email, customer_name, total_vnd, subtotal_vnd, discount_vnd, status, payment_provider, payment_payload, items:course_order_items(course_id, title_snapshot, price_vnd, qty)")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found");
  if (order.status === "paid") {
    console.log(`[payments] order ${orderId} already paid — skip`);
    return { ok: true, alreadyPaid: true };
  }

  // Chống gian lận: số tiền webhook phải khớp tổng đơn hàng.
  if (typeof opts?.amountVnd === "number" && opts.amountVnd > 0 && opts.amountVnd !== order.total_vnd) {
    console.error(`[payments] amount mismatch order=${orderId} expected=${order.total_vnd} got=${opts.amountVnd}`);
    await appendWebhookLog(supabaseAdmin, order.id, order.payment_payload, {
      type: "amount_mismatch",
      expected: order.total_vnd,
      received: opts.amountVnd,
      provider: opts.provider,
      raw: opts.rawPayload,
      at: new Date().toISOString(),
    });
    throw new Error(`Amount mismatch: expected ${order.total_vnd}, got ${opts.amountVnd}`);
  }

  const newPayload = appendLogPayload(order.payment_payload, {
    type: "paid",
    provider: opts?.provider,
    providerRef: opts?.providerRef,
    amountVnd: opts?.amountVnd,
    note: opts?.note,
    actorUserId: opts?.actorUserId,
    raw: opts?.rawPayload,
    at: new Date().toISOString(),
  });

  const update: Record<string, unknown> = {
    status: "paid",
    paid_at: new Date().toISOString(),
    payment_payload: newPayload,
  };
  if (opts?.providerRef) update.payment_ref = opts.providerRef;
  if (opts?.provider) update.payment_provider = opts.provider;

  const { error: updErr } = await supabaseAdmin.from("course_orders").update(update as any).eq("id", order.id);
  if (updErr) throw new Error(updErr.message);

  // Cấp enrollment — mở quyền học ngay lập tức.
  if (order.user_id) {
    const rows = (order.items ?? []).map((i: any) => ({
      user_id: order.user_id!,
      course_id: i.course_id,
      source: "purchase",
      price_paid_vnd: i.price_vnd,
      order_id: order.id,
    }));
    if (rows.length) {
      const { error: enErr } = await supabaseAdmin
        .from("course_enrollments")
        .upsert(rows, { onConflict: "user_id,course_id" });
      if (enErr) console.error(`[payments] enrollment upsert failed order=${orderId}:`, enErr.message);
      else console.log(`[payments] order ${orderId} paid — granted ${rows.length} enrollment(s)`);
    }
  } else {
    console.warn(`[payments] order ${orderId} paid but has no user_id — enrollment skipped`);
  }

  // Gửi email xác nhận đã thanh toán cho khách (không block luồng chính)
  if (order.customer_email) {
    try {
      const { enqueueTransactionalEmail } = await import("@/lib/email/enqueue.server");
      await enqueueTransactionalEmail({
        templateName: "order-confirmation",
        recipientEmail: order.customer_email,
        idempotencyKey: `order-paid-${order.id}`,
        templateData: {
          customerName: order.customer_name ?? undefined,
          orderNo: order.order_no,
          items: (order.items ?? []).map((i: any) => ({ title: i.title_snapshot, price_vnd: i.price_vnd, qty: i.qty })),
          subtotalVnd: order.subtotal_vnd,
          discountVnd: order.discount_vnd,
          totalVnd: order.total_vnd,
          status: "paid",
          paymentProvider: opts?.provider ?? order.payment_provider,
        },
      });
    } catch (e) {
      console.error("[payments] send paid email failed:", e);
    }
  }

  return { ok: true };
}

/** Ghi nhận đơn hàng thất bại/huỷ từ webhook. */
export async function markOrderFailed(
  orderId: string,
  opts?: { provider?: string; providerRef?: string; rawPayload?: Record<string, unknown>; reason?: string },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("course_orders")
    .select("id, status, payment_payload")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status === "paid") return { ok: true };

  const newPayload = appendLogPayload(order.payment_payload, {
    type: "failed",
    provider: opts?.provider,
    providerRef: opts?.providerRef,
    reason: opts?.reason,
    raw: opts?.rawPayload,
    at: new Date().toISOString(),
  });

  await supabaseAdmin
    .from("course_orders")
    .update({ status: "failed", payment_payload: newPayload as any })
    .eq("id", orderId);
  console.log(`[payments] order ${orderId} marked failed: ${opts?.reason ?? "unknown"}`);
  return { ok: true };
}

function appendLogPayload(current: unknown, entry: Record<string, unknown>): Record<string, unknown> {
  const base = (current && typeof current === "object" ? { ...(current as Record<string, unknown>) } : {}) as Record<string, unknown>;
  const logs = Array.isArray(base.webhook_logs) ? [...(base.webhook_logs as unknown[])] : [];
  logs.push(entry);
  base.webhook_logs = logs.slice(-20); // giữ 20 entry gần nhất
  return base;
}

async function appendWebhookLog(admin: any, orderId: string, current: unknown, entry: Record<string, unknown>) {
  try {
    await admin.from("course_orders").update({ payment_payload: appendLogPayload(current, entry) }).eq("id", orderId);
  } catch (e) {
    console.error("[payments] appendWebhookLog failed:", e);
  }
}
