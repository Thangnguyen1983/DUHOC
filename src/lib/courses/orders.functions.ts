import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const providerEnum = z.enum(["pay2s", "momo", "zalopay", "manual"]);

/** Tạo đơn hàng từ danh sách course_id + coupon optional. Trả về order id + no. */
export const createCourseOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { courseIds: string[]; couponCode?: string | null; customerName?: string; customerEmail?: string; customerPhone?: string }) =>
    z.object({
      courseIds: z.array(z.string().uuid()).min(1).max(20),
      couponCode: z.string().max(50).optional().nullable(),
      customerName: z.string().max(200).optional(),
      customerEmail: z.string().email().max(200).optional(),
      customerPhone: z.string().max(30).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: courses, error: cErr } = await supabase
      .from("courses")
      .select("id, title, price_vnd, sale_price_vnd, is_free, is_published")
      .in("id", data.courseIds);
    if (cErr) throw new Error(cErr.message);
    if (!courses || courses.length !== data.courseIds.length) throw new Error("Khoá học không tồn tại");
    if (courses.some((c) => !c.is_published)) throw new Error("Khoá học chưa xuất bản");

    const items = courses.map((c) => ({
      course_id: c.id,
      title_snapshot: c.title,
      price_vnd: c.is_free ? 0 : (c.sale_price_vnd ?? c.price_vnd),
      qty: 1,
    }));
    const subtotal = items.reduce((s, i) => s + i.price_vnd * i.qty, 0);

    let discount = 0;
    let couponId: string | null = null;
    if (data.couponCode) {
      const { data: cp } = await supabase.from("course_coupons")
        .select("*").eq("code", data.couponCode.toUpperCase()).maybeSingle();
      if (cp && (!cp.valid_to || new Date(cp.valid_to) > new Date()) && (!cp.max_uses || cp.uses < cp.max_uses)) {
        couponId = cp.id;
        discount = cp.discount_type === "percent"
          ? Math.round(subtotal * Number(cp.value) / 100)
          : Number(cp.value);
        if (discount > subtotal) discount = subtotal;
      }
    }
    const total = Math.max(0, subtotal - discount);
    const orderNo = `KZ${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const { data: order, error: oErr } = await supabase.from("course_orders").insert({
      order_no: orderNo,
      user_id: userId,
      customer_name: data.customerName ?? null,
      customer_email: data.customerEmail ?? null,
      customer_phone: data.customerPhone ?? null,
      subtotal_vnd: subtotal,
      discount_vnd: discount,
      total_vnd: total,
      status: total === 0 ? "paid" : "pending",
      payment_provider: "manual",
      coupon_id: couponId,
    }).select("id, order_no, status, total_vnd").single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabase.from("course_order_items").insert(
      items.map((i) => ({ ...i, order_id: order.id }))
    );
    if (iErr) throw new Error(iErr.message);

    // Miễn phí → cấp enrollment ngay
    if (total === 0) {
      await supabase.from("course_enrollments").upsert(
        items.map((i) => ({ user_id: userId, course_id: i.course_id, source: "free", price_paid_vnd: 0, order_id: order.id })),
        { onConflict: "user_id,course_id" }
      );
    }

    // Gửi email xác nhận đơn hàng cho khách (không block)
    const recipient = data.customerEmail ?? (context.claims as any)?.email;
    if (recipient) {
      try {
        const { enqueueTransactionalEmail } = await import("@/lib/email/enqueue.server");
        const origin = process.env.PUBLIC_SITE_URL ?? "https://kaizen-duhoc-xkld.lovable.app";
        await enqueueTransactionalEmail({
          templateName: "order-confirmation",
          recipientEmail: recipient,
          idempotencyKey: `order-created-${order.id}`,
          templateData: {
            customerName: data.customerName,
            orderNo: order.order_no,
            items: items.map((i) => ({ title: i.title_snapshot, price_vnd: i.price_vnd, qty: i.qty })),
            subtotalVnd: subtotal,
            discountVnd: discount,
            totalVnd: total,
            status: total === 0 ? "paid" : "pending",
            checkoutUrl: total === 0 ? undefined : `${origin}/thanh-toan/${order.id}`,
          },
        });
      } catch (e) {
        console.error("[orders] send confirmation email failed:", e);
      }
    }

    return order;
  });

/** Khởi tạo checkout — gọi provider và trả redirect/qr. */
export const startCoursePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; provider: "pay2s" | "momo" | "zalopay" | "manual" }) =>
    z.object({ orderId: z.string().uuid(), provider: providerEnum }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase.from("course_orders")
      .select("id, order_no, total_vnd, status, user_id, customer_email, customer_name")
      .eq("id", data.orderId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    if (order.user_id !== userId) throw new Error("Không có quyền");
    if (order.status !== "pending") throw new Error("Đơn hàng không ở trạng thái chờ thanh toán");

    const origin = process.env.PUBLIC_SITE_URL ?? "https://kaizen-duhoc-xkld.lovable.app";
    const { createCheckout } = await import("@/lib/payments/index.server");
    const result = await createCheckout(data.provider, {
      orderId: order.id,
      orderNo: order.order_no,
      amountVnd: order.total_vnd,
      description: `Thanh toan khoa hoc ${order.order_no}`,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      returnUrl: `${origin}/api/public/payments/${data.provider}/return`,
      ipnUrl: `${origin}/api/public/payments/${data.provider}/ipn`,
    });

    await supabase.from("course_orders").update({
      payment_provider: data.provider,
      payment_ref: result.providerRef ?? null,
      payment_payload: (result.raw ?? {}) as any,
    }).eq("id", order.id);

    return { redirectUrl: result.redirectUrl ?? null, qrDataUrl: result.qrDataUrl ?? null };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("course_orders")
      .select("id, order_no, total_vnd, status, payment_provider, created_at, paid_at")
      .eq("user_id", context.userId).order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase.from("course_orders")
      .select("*, items:course_order_items(id, course_id, title_snapshot, price_vnd, qty)")
      .eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    return order;
  });

/** Admin xác nhận thanh toán thủ công (bank transfer). */
export const adminMarkOrderPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; note?: string }) => z.object({ id: z.string().uuid(), note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" as any });
    const { data: isSales } = await supabase.rpc("has_role", { _user_id: userId, _role: "sales" as any });
    if (!isAdmin && !isSales) throw new Error("Không có quyền");
    const { markOrderPaid } = await import("@/lib/courses/orders.impl.server");
    return markOrderPaid(data.id, { note: data.note, actorUserId: userId });
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("course_orders")
      .select("id, order_no, customer_name, customer_email, total_vnd, status, payment_provider, payment_ref, paid_at, created_at")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

/** Admin xem chi tiết đơn hàng + log webhook. */
export const adminGetOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" as any });
    const { data: isSales } = await supabase.rpc("has_role", { _user_id: userId, _role: "sales" as any });
    if (!isAdmin && !isSales) throw new Error("Không có quyền");
    const { data: order, error } = await supabase.from("course_orders")
      .select("*, items:course_order_items(id, course_id, title_snapshot, price_vnd, qty)")
      .eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    return order;
  });

/**
 * Đồng bộ enrollments cho học viên hiện tại — dùng cho các case:
 * - Webhook đã ghi paid nhưng enrollment miss (upsert conflict, race...)
 * - Người dùng thanh toán khi chưa login, sau đó đăng nhập bằng email khớp
 *   với order (customer_email) → gán user_id + cấp quyền học.
 */
export const syncMyEnrollments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as any)?.email as string | undefined;

    // 1) Gắn user_id cho các đơn paid mồ côi cùng email
    let claimed = 0;
    if (email) {
      const { data: orphan } = await supabase.from("course_orders")
        .select("id").is("user_id", null).eq("customer_email", email).eq("status", "paid").limit(50);
      if (orphan && orphan.length) {
        const ids = orphan.map((o) => o.id);
        const { error: upErr } = await supabase.from("course_orders")
          .update({ user_id: userId }).in("id", ids);
        if (!upErr) claimed = ids.length;
      }
    }

    // 2) Lấy toàn bộ đơn paid của user + items, upsert enrollment còn thiếu
    const { data: paidOrders } = await supabase.from("course_orders")
      .select("id, items:course_order_items(course_id, price_vnd)")
      .eq("user_id", userId).eq("status", "paid").limit(200);

    const rows: Array<{ user_id: string; course_id: string; source: string; price_paid_vnd: number; order_id: string }> = [];
    for (const o of paidOrders ?? []) {
      for (const it of (o as any).items ?? []) {
        rows.push({ user_id: userId, course_id: it.course_id, source: "purchase", price_paid_vnd: it.price_vnd, order_id: o.id });
      }
    }
    let synced = 0;
    if (rows.length) {
      const { error: enErr, count } = await supabase.from("course_enrollments")
        .upsert(rows, { onConflict: "user_id,course_id", ignoreDuplicates: true, count: "exact" });
      if (!enErr) synced = count ?? rows.length;
    }
    return { ok: true, claimed, synced };
  });

