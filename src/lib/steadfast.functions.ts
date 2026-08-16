import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adminSchema = z.object({
  orderId: z.string().uuid(),
  accessToken: z.string().min(20),
});

const publicSchema = z.object({
  orderNumber: z.string().min(6).max(80),
  phone: z.string().min(7).max(40),
});

type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  delivery_address: string;
  customer_note: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  selected_size: string | null;
  selected_finish: string | null;
  total_price: number | string;
  payment_method: "cod" | "bkash" | "nagad";
  payment_status: string;
  steadfast_state: "not_sent" | "creating" | "connected" | "error" | null;
  steadfast_consignment_id: number | null;
  steadfast_tracking_code: string | null;
  steadfast_status: string | null;
};

function env() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";
  const apiKey = process.env.STEADFAST_API_KEY || "";
  const secretKey = process.env.STEADFAST_SECRET_KEY || "";
  const baseUrl =
    process.env.STEADFAST_API_BASE_URL ||
    "https://portal.packzy.com/api/v1";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase server environment variables are missing.");
  }
  if (!apiKey || !secretKey) {
    throw new Error(
      "Steadfast API credentials are missing from Vercel Environment Variables.",
    );
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    supabaseKey,
    apiKey,
    secretKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
  };
}

function normalizeBdPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("8801")) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

function mapSteadfastToPublic(raw: string | null | undefined): OrderStatus | null {
  switch ((raw || "").toLowerCase()) {
    case "in_review":
      return "confirmed";
    case "pending":
    case "hold":
    case "unknown":
    case "unknown_approval_pending":
      return "processing";
    case "delivered_approval_pending":
    case "partial_delivered_approval_pending":
      return "shipped";
    case "delivered":
    case "partial_delivered":
      return "delivered";
    case "cancelled":
    case "cancelled_approval_pending":
      return "cancelled";
    default:
      return null;
  }
}

function advanceStatus(current: OrderStatus, mapped: OrderStatus | null) {
  if (!mapped) return current;
  if (current === "cancelled" || current === "delivered") return current;
  if (mapped === "cancelled" || mapped === "delivered") return mapped;

  const rank: Record<OrderStatus, number> = {
    new: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: 5,
  };

  return rank[mapped] > rank[current] ? mapped : current;
}

async function readBody(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function steadfastRequest(
  path: string,
  init: RequestInit = {},
  allowFailure = false,
) {
  const { apiKey, secretKey, baseUrl } = env();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });

  const body = await readBody(response);

  if (!response.ok && !allowFailure) {
    throw new Error(
      body?.message ||
        body?.error ||
        `Steadfast request failed (${response.status}).`,
    );
  }

  return { ok: response.ok, status: response.status, body };
}

async function getAdminOrder(orderId: string, accessToken: string) {
  const { supabaseUrl, supabaseKey } = env();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Could not verify administrator access.");
  }

  const rows = (await response.json()) as OrderRow[];
  const order = rows?.[0];

  if (!order) {
    throw new Error("Order not found or administrator access is required.");
  }

  return order;
}

async function patchAdminOrder(
  orderId: string,
  accessToken: string,
  patch: Record<string, unknown>,
) {
  const { supabaseUrl, supabaseKey } = env();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    },
  );

  const body = await readBody(response);
  if (!response.ok) {
    throw new Error(
      body?.message || body?.details || "Could not update the order.",
    );
  }

  return Array.isArray(body) ? body[0] : body;
}

async function lookupInvoice(invoice: string) {
  return steadfastRequest(
    `/status_by_invoice/${encodeURIComponent(invoice)}`,
    { method: "GET" },
    true,
  );
}

function itemDescription(order: OrderRow) {
  return [
    `${order.product_name} (${order.product_code})`,
    order.selected_size ? `Size: ${order.selected_size}` : "",
    order.selected_finish ? `Finish: ${order.selected_finish}` : "",
    `Qty: ${order.quantity}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

export const createSteadfastShipment = createServerFn({ method: "POST" })
  .validator(adminSchema)
  .handler(async ({ data }) => {
    const order = await getAdminOrder(data.orderId, data.accessToken);

    if (order.status === "new") {
      throw new Error("Confirm the order before sending it to Steadfast.");
    }
    if (order.status === "cancelled" || order.status === "delivered") {
      throw new Error("This order cannot be sent to Steadfast.");
    }

    if (
      order.steadfast_state === "connected" ||
      order.steadfast_consignment_id ||
      order.steadfast_tracking_code
    ) {
      return {
        connected: true,
        alreadyConnected: true,
        trackingCode: order.steadfast_tracking_code,
        consignmentId: order.steadfast_consignment_id,
        courierStatus: order.steadfast_status,
      };
    }

    const phone = normalizeBdPhone(order.phone);
    if (phone.length !== 11) {
      const message =
        "Steadfast requires an 11-digit Bangladesh phone number.";
      await patchAdminOrder(order.id, data.accessToken, {
        steadfast_state: "error",
        steadfast_last_error: message,
        steadfast_synced_at: new Date().toISOString(),
      });
      throw new Error(message);
    }

    let codAmount = 0;
    if (order.payment_method === "cod") {
      codAmount = Number(order.total_price);
    } else if (order.payment_status === "paid") {
      codAmount = 0;
    } else {
      const message =
        "Verify the bKash/Nagad payment before creating the Steadfast parcel.";
      await patchAdminOrder(order.id, data.accessToken, {
        steadfast_state: "error",
        steadfast_last_error: message,
        steadfast_synced_at: new Date().toISOString(),
      });
      throw new Error(message);
    }

    const existing = await lookupInvoice(order.order_number);
    if (
      existing.ok &&
      typeof existing.body?.delivery_status === "string" &&
      existing.body.delivery_status
    ) {
      await patchAdminOrder(order.id, data.accessToken, {
        steadfast_state: "connected",
        steadfast_status: existing.body.delivery_status,
        steadfast_connected_at: new Date().toISOString(),
        steadfast_synced_at: new Date().toISOString(),
        steadfast_last_error: null,
      });

      return {
        connected: true,
        alreadyConnected: true,
        trackingCode: order.steadfast_tracking_code,
        consignmentId: order.steadfast_consignment_id,
        courierStatus: existing.body.delivery_status,
      };
    }

    await patchAdminOrder(order.id, data.accessToken, {
      steadfast_state: "creating",
      steadfast_last_error: null,
    });

    try {
      const created = await steadfastRequest("/create_order", {
        method: "POST",
        body: JSON.stringify({
          invoice: order.order_number,
          recipient_name: order.customer_name.trim().slice(0, 100),
          recipient_phone: phone,
          recipient_address: order.delivery_address.trim().slice(0, 250),
          cod_amount: Math.max(0, codAmount),
          note: (order.customer_note || "").trim() || undefined,
          item_description: itemDescription(order),
          total_lot: order.quantity,
          delivery_type: 0,
        }),
      });

      const consignment = created.body?.consignment;
      if (!consignment?.tracking_code && !consignment?.consignment_id) {
        throw new Error(
          created.body?.message ||
            "Steadfast did not return a consignment identifier.",
        );
      }

      await patchAdminOrder(order.id, data.accessToken, {
        steadfast_state: "connected",
        steadfast_consignment_id: consignment.consignment_id ?? null,
        steadfast_tracking_code: consignment.tracking_code ?? null,
        steadfast_status: consignment.status ?? "in_review",
        steadfast_connected_at: new Date().toISOString(),
        steadfast_synced_at: new Date().toISOString(),
        steadfast_last_error: null,
      });

      return {
        connected: true,
        alreadyConnected: false,
        trackingCode: consignment.tracking_code ?? null,
        consignmentId: consignment.consignment_id ?? null,
        courierStatus: consignment.status ?? "in_review",
      };
    } catch (error) {
      const recovery = await lookupInvoice(order.order_number);
      if (
        recovery.ok &&
        typeof recovery.body?.delivery_status === "string" &&
        recovery.body.delivery_status
      ) {
        await patchAdminOrder(order.id, data.accessToken, {
          steadfast_state: "connected",
          steadfast_status: recovery.body.delivery_status,
          steadfast_connected_at: new Date().toISOString(),
          steadfast_synced_at: new Date().toISOString(),
          steadfast_last_error: null,
        });

        return {
          connected: true,
          alreadyConnected: true,
          trackingCode: null,
          consignmentId: null,
          courierStatus: recovery.body.delivery_status,
        };
      }

      const message =
        error instanceof Error
          ? error.message
          : "Steadfast parcel creation failed.";

      await patchAdminOrder(order.id, data.accessToken, {
        steadfast_state: "error",
        steadfast_last_error: message.slice(0, 500),
        steadfast_synced_at: new Date().toISOString(),
      });

      throw new Error(message);
    }
  });

export const syncSteadfastShipment = createServerFn({ method: "POST" })
  .validator(adminSchema)
  .handler(async ({ data }) => {
    const order = await getAdminOrder(data.orderId, data.accessToken);
    const lookup = await lookupInvoice(order.order_number);

    if (
      !lookup.ok ||
      typeof lookup.body?.delivery_status !== "string" ||
      !lookup.body.delivery_status
    ) {
      const message =
        lookup.body?.message || "No Steadfast parcel was found for this order.";
      await patchAdminOrder(order.id, data.accessToken, {
        steadfast_state: "error",
        steadfast_last_error: String(message).slice(0, 500),
        steadfast_synced_at: new Date().toISOString(),
      });
      throw new Error(String(message));
    }

    const rawStatus = lookup.body.delivery_status as string;
    const mapped = mapSteadfastToPublic(rawStatus);
    const nextStatus = advanceStatus(order.status, mapped);

    await patchAdminOrder(order.id, data.accessToken, {
      steadfast_state: "connected",
      steadfast_status: rawStatus,
      steadfast_synced_at: new Date().toISOString(),
      steadfast_last_error: null,
      ...(nextStatus !== order.status ? { status: nextStatus } : {}),
    });

    return {
      courierStatus: rawStatus,
      publicStatus: nextStatus,
    };
  });

export const getPublicSteadfastStatus = createServerFn({ method: "POST" })
  .validator(publicSchema)
  .handler(async ({ data }) => {
    const { supabaseUrl, supabaseKey } = env();

    const verify = await fetch(`${supabaseUrl}/rest/v1/rpc/track_public_order`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        p_order_number: data.orderNumber,
        p_phone: data.phone,
      }),
    });

    if (!verify.ok) return null;

    const rows = await verify.json();
    const order = Array.isArray(rows) ? rows[0] : rows;
    if (!order?.order_number) return null;

    const localStatus = order.status as OrderStatus;
    if (localStatus === "new" || localStatus === "cancelled") {
      return { publicStatus: localStatus };
    }

    const lookup = await lookupInvoice(order.order_number);
    if (
      !lookup.ok ||
      typeof lookup.body?.delivery_status !== "string" ||
      !lookup.body.delivery_status
    ) {
      return { publicStatus: localStatus };
    }

    const mapped = mapSteadfastToPublic(lookup.body.delivery_status);
    return {
      publicStatus: advanceStatus(localStatus, mapped),
    };
  });
