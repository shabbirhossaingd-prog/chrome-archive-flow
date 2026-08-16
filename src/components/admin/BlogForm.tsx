import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost } from "@/lib/cms";
import { slugify } from "@/lib/cms";
import { ImageUploader } from "./ImageUploader";
import { RichTextEditor } from "./RichTextEditor";
import { AdminButton, Field, Toggle, adminField } from "./AdminUI";

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  seo_title: string;
  seo_description: string;
  og_image: string;
  featured: boolean;
};

const fromPost = (post?: BlogPost): Draft => ({
  title: post?.title ?? "",
  slug: post?.slug ?? "",
  excerpt: post?.excerpt ?? "",
  content: post?.content ?? "",
  featured_image: post?.featured_image ?? "",
  seo_title: post?.seo_title ?? "",
  seo_description: post?.seo_description ?? "",
  og_image: post?.og_image ?? "",
  featured: post?.featured ?? false,
});

async function uniqueBlogSlug(base: string, currentId?: string) {
  const clean = slugify(base) || `journal-${Date.now()}`;
  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? clean : `${clean}-${i + 1}`;
    let q = supabase.from("blog_posts").select("id").eq("slug", candidate).limit(1);
    if (currentId) q = q.neq("id", currentId);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) return candidate;
  }
  return `${clean}-${crypto.randomUUID().slice(0, 8)}`;
}

export function BlogForm({ post }: { post?: BlogPost }) {
  const [d, setD] = useState<Draft>(() => fromPost(post));
  const [dirty, setDirty] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    setD((prev) => ({ ...prev, [key]: value }));
  };

  const save = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      if (!d.title.trim()) throw new Error("Blog title is required");
      if (publish && !d.excerpt.trim()) throw new Error("Add an excerpt before publishing");

      const slug = await uniqueBlogSlug(d.slug || d.title, post?.id);
      const values = {
        title: d.title.trim(),
        slug,
        excerpt: d.excerpt.trim(),
        content: d.content,
        featured_image: d.featured_image,
        seo_title: d.seo_title.trim() || d.title.trim(),
        seo_description: d.seo_description.trim() || d.excerpt.trim(),
        og_image: d.og_image || d.featured_image,
        featured: d.featured,
        status: publish ? "published" : "draft",
        published_at: publish ? post?.published_at ?? new Date().toISOString() : null,
      };

      if (post) {
        const { error } = await supabase.from("blog_posts").update(values).eq("id", post.id);
        if (error) throw error;
        return slug;
      }

      const { error } = await supabase.from("blog_posts").insert(values);
      if (error) throw error;
      return slug;
    },
    onSuccess: (_slug, vars) => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      toast.success(vars.publish ? "Post published successfully." : "Post saved as draft.");
      navigate({ to: "/admin/blog" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save post"),
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="glass-panel space-y-5 rounded-[24px] p-6">
            <Field label="Title">
              <input
                className={adminField}
                maxLength={180}
                value={d.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setDirty(true);
                  setD((prev) => ({
                    ...prev,
                    title,
                    slug: post ? prev.slug : slugify(title),
                  }));
                }}
              />
            </Field>
            <Field label="Slug">
              <input
                className={adminField}
                value={d.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
              />
            </Field>
            <Field label="Excerpt">
              <textarea
                className={adminField}
                rows={4}
                maxLength={500}
                value={d.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
              />
            </Field>
          </div>

          <div className="glass-panel space-y-4 rounded-[24px] p-6">
            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              CONTENT
            </span>
            <RichTextEditor value={d.content} onChange={(v) => set("content", v)} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-panel space-y-5 rounded-[24px] p-6">
            <ImageUploader
              label="Featured image"
              max={1}
              value={d.featured_image ? [d.featured_image] : []}
              onChange={(v) => set("featured_image", v[0] ?? "")}
            />
            <Toggle
              label="Mark as featured"
              checked={d.featured}
              onChange={(v) => set("featured", v)}
            />
          </div>

          <div className="glass-panel space-y-5 rounded-[24px] p-6">
            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              SEO & META
            </span>
            <Field label="Meta title">
              <input
                className={adminField}
                maxLength={180}
                value={d.seo_title}
                onChange={(e) => set("seo_title", e.target.value)}
              />
            </Field>
            <Field label="Meta description">
              <textarea
                className={adminField}
                rows={4}
                maxLength={320}
                value={d.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
              />
            </Field>
            <ImageUploader
              label="OG image (optional)"
              max={1}
              value={d.og_image ? [d.og_image] : []}
              onChange={(v) => set("og_image", v[0] ?? "")}
            />
          </div>

          <div className="glass-panel space-y-3 rounded-[24px] p-4">
            <AdminButton
              tone="primary"
              className="w-full"
              disabled={save.isPending}
              onClick={() => save.mutate({ publish: false })}
            >
              {save.isPending ? "Saving…" : "Save draft"}
            </AdminButton>
            <AdminButton
              tone="primary"
              className="w-full"
              disabled={save.isPending}
              onClick={() => save.mutate({ publish: true })}
            >
              {save.isPending ? "Publishing…" : "Publish"}
            </AdminButton>
            <AdminButton
              className="w-full"
              onClick={() => {
                if (!dirty || confirm("Discard unsaved blog changes?")) {
                  setDirty(false);
                  navigate({ to: "/admin/blog" });
                }
              }}
            >
              Cancel
            </AdminButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
