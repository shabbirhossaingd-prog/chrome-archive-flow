import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Grants the admin role to the current user when no admin exists yet
 * (first-run bootstrap). Returns whether the caller is an admin.
 */
export const ensureAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: admins, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (error) throw error;

    if ((admins ?? []).length > 0) {
      return { isAdmin: (admins ?? []).some((r) => r.user_id === context.userId) };
    }

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insertError) throw insertError;

    return { isAdmin: true };
  });

/** Reserves the next sequential product code for a category (admins only). */
export const reserveProductCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ category: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    // Role check runs as the caller (RLS allows reading only their own roles).
    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (roleError) throw roleError;
    if (!roles || roles.length === 0) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: code, error } = await supabaseAdmin.rpc("next_product_code", {
      _category: data.category,
    });
    if (error) throw error;
    return { code: code as string };
  });
/** Records an admin action in the audit log (admins only). */
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
    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (roleError) throw roleError;
    if (!roles || roles.length === 0) throw new Error("Forbidden");

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
