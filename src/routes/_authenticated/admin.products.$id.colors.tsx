import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminButton, adminField } from "@/components/admin/AdminUI";
import { SmartImage } from "@/components/site/SmartImage";

export const Route = createFileRoute("/_authenticated/admin/products/$id/colors")({
  component: ProductColorInventory,
});

function ProductColorInventory() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState("");

  const productQuery = useQuery({
    queryKey: ["admin-product-colors", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("id,name,product_code,primary_image,quantity_available,colors,color_stock")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const product = productQuery.data;
    if (!product) return;
    const colors = (product.colors ?? []) as string[];
    const stock = (product.color_stock ?? {}) as Record<string, number>;
    setLines(colors.map((color) => `${color}=${Number(stock[color] ?? 0)}`).join("\n"));
  }, [productQuery.data?.id]);

  const parsed = useMemo(() => {
    const rows = lines
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [rawName, rawQty = "0"] = line.split("=");
        return {
          name: rawName?.trim(),
          qty: Math.max(0, Number(rawQty.trim() || 0)),
        };
      })
      .filter((row) => row.name);

    const stock: Record<string, number> = {};
    for (const row of rows) stock[String(row.name)] = row.qty;
    return {
      colors: rows.map((row) => row.name),
      stock,
      total: rows.reduce((sum, row) => sum + row.qty, 0),
    };
  }, [lines]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("products")
        .update({
          colors: parsed.colors,
          color_stock: parsed.stock,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Color inventory saved.");
      queryClient.invalidateQueries({ queryKey: ["admin-product-colors", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save colors."),
  });

  const product = productQuery.data;

  return (
    <div className="pb-20">
      <Link
        to="/admin/products/$id"
        params={{ id }}
        className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
      >
        ← Back to object
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {product?.primary_image ? (
          <SmartImage
            src={product.primary_image}
            alt={product.name}
            width={120}
            height={120}
            className="size-16 rounded-2xl object-cover grayscale"
          />
        ) : null}
        <div>
          <span className="text-[8px] uppercase tracking-[0.34em] text-muted-foreground">
            {product?.product_code || "OBJECT"}
          </span>
          <h1 className="mt-2 font-display text-lg tracking-[0.18em] text-foreground">
            COLOR INVENTORY
          </h1>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {product?.name}
          </p>
        </div>
      </div>

      <div className="glass-panel mt-8 max-w-2xl rounded-[24px] p-6">
        <span className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
          One color per line
        </span>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          Format: CHROME=5. Color stock is used on the public product page and
          decreases when a colored order is placed.
        </p>

        <textarea
          rows={9}
          className={`${adminField} mt-5 font-mono`}
          value={lines}
          onChange={(event) => setLines(event.target.value)}
          placeholder={"CHROME=5\nBLACK=3\nGUNMETAL=2"}
        />

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-border/50 p-4">
          <div>
            <span className="text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
              Colors
            </span>
            <p className="mt-2 text-sm text-foreground">{parsed.colors.length}</p>
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
              Color stock total
            </span>
            <p className="mt-2 text-sm text-foreground">{parsed.total}</p>
          </div>
        </div>

        <p className="mt-4 text-[9px] leading-relaxed text-muted-foreground">
          Product total stock remains the main inventory count. When receiving new
          colored stock in ERP, update this color split afterward.
        </p>

        <div className="mt-5 flex gap-3">
          <AdminButton
            tone="primary"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : "Save color inventory"}
          </AdminButton>
          <Link
            to="/admin/products/$id"
            params={{ id }}
            className="rounded-xl border border-border/60 px-5 py-3 text-[9px] uppercase tracking-[0.3em] text-muted-foreground"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
