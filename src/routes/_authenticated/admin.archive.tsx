import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCollections } from "@/lib/cms";
import { AdminButton } from "@/components/admin/AdminUI";
import { SmartImage } from "@/components/site/SmartImage";

export const Route = createFileRoute("/_authenticated/admin/archive")({
  component: AdminArchive,
});

function AdminArchive() {
  const { data: collections = [], isLoading } = useAdminCollections();
  const queryClient = useQueryClient();

  const patch = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: { archived?: boolean; published?: boolean; is_current?: boolean };
    }) => {
      const { error } = await supabase.from("collections").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Archive updated successfully.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Archive update failed"),
  });

  const archived = collections.filter((c) => c.archived);
  const live = collections.filter((c) => !c.archived);

  return (
    <div className="space-y-8 pb-20">
      <div>
        <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          PAST DROPS / CMS
        </span>
        <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground">ARCHIVE</h1>
      </div>

      {isLoading && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading archive…
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          ARCHIVED COLLECTIONS
        </h2>
        {archived.length === 0 && (
          <div className="glass-panel rounded-[22px] p-6 text-xs text-muted-foreground">
            No archived collections yet.
          </div>
        )}
        {archived.map((c) => (
          <div key={c.id} className="glass-panel flex flex-wrap items-center gap-5 rounded-[22px] p-4">
            <SmartImage
              src={c.hero_image || c.campaign_images[0]}
              alt={c.name}
              className="size-20 rounded-xl object-cover grayscale"
              width={160}
              height={160}
            />
            <div className="min-w-[12rem] flex-1">
              <span className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                DROP {String(c.drop_number).padStart(3, "0")} · {c.year}
              </span>
              <h2 className="mt-2 font-display text-base tracking-[0.2em] text-foreground">
                {c.name}
              </h2>
              <p className="mt-2 text-[8px] uppercase tracking-[0.3em] text-chrome">
                {c.published ? "PUBLISHED" : "HIDDEN"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminButton
                onClick={() =>
                  patch.mutate({ id: c.id, values: { published: !c.published } })
                }
              >
                {c.published ? "Hide" : "Publish"}
              </AdminButton>
              <AdminButton
                onClick={() =>
                  patch.mutate({ id: c.id, values: { archived: false } })
                }
              >
                Restore
              </AdminButton>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          ACTIVE / UNARCHIVED COLLECTIONS
        </h2>
        {live.map((c) => (
          <div key={c.id} className="glass-panel flex flex-wrap items-center gap-5 rounded-[22px] p-4">
            <div className="min-w-[12rem] flex-1">
              <span className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                DROP {String(c.drop_number).padStart(3, "0")} · {c.year}
              </span>
              <h2 className="mt-2 font-display text-base tracking-[0.2em] text-foreground">
                {c.name}
              </h2>
              <p className="mt-2 text-[8px] uppercase tracking-[0.3em] text-chrome">
                {c.is_current ? "CURRENT · " : ""}
                {c.published ? "PUBLISHED" : "DRAFT"}
              </p>
            </div>
            <AdminButton
              onClick={() => {
                if (c.is_current) {
                  toast.error("Choose another current collection before archiving this one.");
                  return;
                }
                patch.mutate({ id: c.id, values: { archived: true } });
              }}
            >
              Move to archive
            </AdminButton>
          </div>
        ))}
      </section>
    </div>
  );
}
