import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRIMARY_ADMIN_EMAIL = "designerazhaf@gmail.com";

async function assertAdmin(context: {
  userId: string;
  supabase: any;
}) {
  const { data: roles, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin");
  if (error) throw error;
  if (!roles || roles.length === 0) throw new Error("Forbidden");
}

/**
 * Secure first-run bootstrap.
 *
 * - Existing admins keep working.
 * - If no admin exists yet, ONLY designerazhaf@gmail.com may bootstrap.
 * - The actual authorization source remains the backend user_roles table.
 */
export const ensureAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ownRoles, error: ownError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (ownError) throw ownError;
    if ((ownRoles ?? []).length > 0) return { isAdmin: true };

    const email = String((context.claims as { email?: string })?.email ?? "")
      .trim()
      .toLowerCase();

    // Only the verified primary owner identity may self-bootstrap.
    if (email !== PRIMARY_ADMIN_EMAIL) return { isAdmin: false };

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    if (insertError) throw insertError;

    return { isAdmin: true };
  });

/** Preview the next code without consuming it. */
export const peekProductCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ category: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: code, error } = await supabaseAdmin.rpc("peek_product_code", {
      _category: data.category,
    });
    if (error) throw error;
    return { code: code as string };
  });

/** Reserves the next sequential product code for a category. */
export const reserveProductCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ category: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: code, error } = await supabaseAdmin.rpc("next_product_code", {
      _category: data.category,
    });
    if (error) throw error;
    return { code: code as string };
  });

/** Records an admin action in the audit log. */
export const logAdminAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        action: z.string().min(1).max(40),
        entity: z.string().min(1).max(40),
        entity_id: z.string().max(120).optional(),
        label: z.string().max(200).optional(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      actor_email: (context.claims as { email?: string })?.email ?? "",
      action: data.action,
      entity: data.entity,
      entity_id: data.entity_id ?? null,
      label: data.label ?? "",
      details: (data.details ?? {}) as never,
    });
    if (error) throw error;
    return { ok: true };
  });
