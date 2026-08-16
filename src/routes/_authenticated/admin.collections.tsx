import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCollections, slugify, type Collection } from "@/lib/cms";
import { useAdminProducts } from "@/lib/products";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AdminButton, Field, Toggle, adminField } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/collections")({
  component: AdminCollections,
});

type Draft = {
  id?: string;
  collection_code: string;
  drop_number: string;
  name: string;
  slug: string;
  year: string;
  label: string;
  heading: string;
  tagline: string;
  description: string;
  hero_image: string;
  campaign_images: string[];
  editorial_images: string[];
  marquee_text: string;
  button_label: string;
  button_href: string;
  is_current: boolean;
  archived: boolean;
  published: boolean;
  sort_order: string;
};

const emptyDraft = (): Draft => ({
  collection_code: "",
  drop_number: "1",
  name: "",
  slug: "",
  year: String(new Date().getFullYear()),
  label: "",
  heading: "",
  tagline: "",
  description: "",
  hero_image: "",
  campaign_images: [],
  editorial_images: [],
  marquee_text: "",
  button_label: "ENTER THE SHOP",
  button_href: "/shop",
  is_current: false,
  archived: false,
  published: false,
  sort_order: "0",
});

function fromCollection(c: Collection): Draft {
  return {
    id: c.id,
    collection_code: c.collection_code,
    drop_number: String(c.drop_number),
    name: c.name,
    slug: c.slug,
    year: c.year,
    label: c.label,
    heading: c.heading,
    tagline: c.tagline,
    description: c.description,
    hero_image: c.hero_image,
    campaign_images: c.campaign_images,
    editorial_images: c.editorial_images,
    marquee_text: c.marquee_text,
    button_label: c.button_label,
    button_href: c.button_href,
    is_current: c.is_current,
    archived: c.archived,
    published: c.published,
    sort_order: String(c.sort_order),
  };
}

function AdminCollections() {
  const { data: collections = [], isLoading } = useAdminCollections();
  const { data: products = [] } = useAdminProducts();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDirty(true);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (!p.collection_id) continue;
      map.set(p.collection_id, (map.get(p.collection_id) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.name.trim()) throw new Error("Collection name is required");
      const dropNumber = Math.max(1, Number(draft.drop_number || 1));
      const slug = draft.slug.trim() || slugify(`drop-${dropNumber}-${draft.name}`);
      const values = {
        collection_code:
          draft.collection_code.trim() || `DROP${String(dropNumber).padStart(3, "0")}`,
        drop_number: dropNumber,
        name: draft.name.trim().toUpperCase(),
        slug,
        year: draft.year,
        label: draft.label,
        heading: draft.heading || draft.name.trim().toUpperCase(),
        tagline: draft.tagline,
        description: draft.description,
        hero_image: draft.hero_image,
        campaign_images: draft.campaign_images,
        editorial_images: draft.editorial_images,
        marquee_text: draft.marquee_text,
        button_label: draft.button_label,
        button_href: draft.button_href,
        is_current: draft.is_current,
        archived: draft.archived,
        published: draft.published,
        sort_order: Number(draft.sort_order || 0),
      };

      if (draft.is_current) {
        const { error } = await supabase
          .from("collections")
          .update({ is_current: false })
          .neq("id", draft.id ?? "00000000-0000-0000-0000-000000000000");
        if (error) throw error;
      }

      let collectionId = draft.id ?? "";
      if (draft.id) {
        const { error } = await supabase.from("collections").update(values).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("collections")
          .insert(values)
          .select("id")
          .single();
        if (error) throw error;
        collectionId = data.id;
      }

      const currentIds = products
        .filter((p) => p.collection_id === collectionId)
        .map((p) => p.id);
      const toRemove = currentIds.filter((id) => !assignedIds.includes(id));
      if (toRemove.length) {
        const { error } = await supabase
          .from("products")
          .update({ collection_id: null, collection_name: "" })
          .in("id", toRemove);
        if (error) throw error;
      }

      if (assignedIds.length) {
        const collectionLabel = `DROP ${String(dropNumber).padStart(3, "0")} — ${draft.name.trim().toUpperCase()}`;
        const { error } = await supabase
          .from("products")
          .update({ collection_id: collectionId, collection_name: collectionLabel })
          .in("id", assignedIds);
        if (error) throw error;
      }

      return collectionId;
    },
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection updated successfully.");
      setDraft(emptyDraft());
      setAssignedIds([]);
      setEditing(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save collection"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
            DROPS / CAMPAIGNS
          </span>
          <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground">
            COLLECTIONS
          </h1>
        </div>
        <AdminButton
          tone="primary"
          onClick={() => {
            setDraft(emptyDraft());
            setAssignedIds([]);
            setEditing(true);
            setDirty(false);
          }}
        >
          + New collection
        </AdminButton>
      </div>

      {isLoading && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading collections…
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {collections.map((c) => (
          <div key={c.id} className="glass-panel rounded-[22px] p-5">
            <span className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
              DROP {String(c.drop_number).padStart(3, "0")} · {c.year}
            </span>
            <h2 className="mt-3 font-display text-lg tracking-[0.2em] text-foreground">
              {c.name}
            </h2>
            <p className="mt-2 text-[9px] uppercase tracking-[0.3em] text-chrome">
              {c.is_current ? "CURRENT · " : ""}
              {c.archived ? "ARCHIVED · " : ""}
              {c.published ? "PUBLISHED" : "DRAFT"} · {counts.get(c.id) ?? 0} OBJECTS
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <AdminButton
                onClick={() => {
                  setDraft(fromCollection(c));
                  setAssignedIds(products.filter((p) => p.collection_id === c.id).map((p) => p.id));
                  setEditing(true);
                  setDirty(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Edit
              </AdminButton>
              <AdminButton
                tone="danger"
                onClick={() => {
                  if (confirm(`Delete collection "${c.name}"? Products will not be deleted.`)) {
                    remove.mutate(c.id);
                  }
                }}
              >
                Delete
              </AdminButton>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="space-y-6">
          <div className="glass-panel space-y-6 rounded-[24px] p-6">
            <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
              {draft.id ? "EDIT COLLECTION" : "NEW COLLECTION"}
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Drop number">
                <input
                  className={adminField}
                  type="number"
                  min={1}
                  value={draft.drop_number}
                  onChange={(e) => set("drop_number", e.target.value)}
                />
              </Field>
              <Field label="Collection code">
                <input
                  className={adminField}
                  value={draft.collection_code}
                  onChange={(e) => set("collection_code", e.target.value)}
                  placeholder="DROP002"
                />
              </Field>
              <Field label="Name">
                <input
                  className={adminField}
                  value={draft.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDirty(true);
                    setDraft((prev) => ({
                      ...prev,
                      name,
                      slug: prev.id ? prev.slug : slugify(`drop-${prev.drop_number}-${name}`),
                    }));
                  }}
                />
              </Field>
              <Field label="Slug">
                <input
                  className={adminField}
                  value={draft.slug}
                  onChange={(e) => set("slug", slugify(e.target.value))}
                />
              </Field>
              <Field label="Year">
                <input
                  className={adminField}
                  value={draft.year}
                  onChange={(e) => set("year", e.target.value)}
                />
              </Field>
              <Field label="Small label">
                <input
                  className={adminField}
                  value={draft.label}
                  onChange={(e) => set("label", e.target.value)}
                />
              </Field>
              <Field label="Heading">
                <input
                  className={adminField}
                  value={draft.heading}
                  onChange={(e) => set("heading", e.target.value)}
                />
              </Field>
              <Field label="Tagline">
                <input
                  className={adminField}
                  value={draft.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className={adminField}
                rows={5}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Marquee text">
                <input
                  className={adminField}
                  value={draft.marquee_text}
                  onChange={(e) => set("marquee_text", e.target.value)}
                />
              </Field>
              <Field label="Button label">
                <input
                  className={adminField}
                  value={draft.button_label}
                  onChange={(e) => set("button_label", e.target.value)}
                />
              </Field>
              <Field label="Button destination">
                <input
                  className={adminField}
                  value={draft.button_href}
                  onChange={(e) => set("button_href", e.target.value)}
                />
              </Field>
              <Field label="Sort order">
                <input
                  className={adminField}
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => set("sort_order", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="glass-panel space-y-7 rounded-[24px] p-6">
            <ImageUploader
              label="Hero image"
              max={1}
              value={draft.hero_image ? [draft.hero_image] : []}
              onChange={(v) => set("hero_image", v[0] ?? "")}
            />
            <ImageUploader
              label="Campaign images"
              max={5}
              value={draft.campaign_images}
              onChange={(v) => set("campaign_images", v)}
            />
            <ImageUploader
              label="Editorial images"
              max={5}
              value={draft.editorial_images}
              onChange={(v) => set("editorial_images", v)}
            />
          </div>

          <div className="glass-panel space-y-5 rounded-[24px] p-6">
            <div>
              <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                COLLECTION OBJECTS
              </span>
              <p className="mt-2 text-[9px] leading-relaxed tracking-[0.18em] text-muted-foreground">
                Select the objects that belong to this drop. You can also change a product's collection from the Product Editor.
              </p>
            </div>
            {products.length === 0 ? (
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                No objects found
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {products.map((p) => {
                  const selected = assignedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setDirty(true);
                        setAssignedIds((prev) =>
                          prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                        );
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        selected
                          ? "border-chrome/70 bg-white/[0.05]"
                          : "border-border/50"
                      }`}
                    >
                      <span className="block text-[8px] uppercase tracking-[0.3em] text-muted-foreground">
                        {p.product_code}
                      </span>
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-foreground">
                        {selected ? "✓ " : ""}{p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-[24px] p-6">
            <div className="flex flex-wrap gap-3">
              <Toggle
                label="Current collection"
                checked={draft.is_current}
                onChange={(v) => set("is_current", v)}
              />
              <Toggle
                label="Archived"
                checked={draft.archived}
                onChange={(v) => set("archived", v)}
              />
              <Toggle
                label="Published"
                checked={draft.published}
                onChange={(v) => set("published", v)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <AdminButton tone="primary" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Saving…" : "Save collection"}
            </AdminButton>
            <AdminButton
              onClick={() => {
                if (!dirty || confirm("Discard unsaved collection changes?")) {
                  setEditing(false);
                  setDirty(false);
                }
              }}
            >
              Cancel
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
