import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogForm } from "@/components/admin/BlogForm";
import type { BlogPost } from "@/lib/cms";

export const Route = createFileRoute("/_authenticated/admin/blog/$id")({
  component: EditBlogPost,
});

function EditBlogPost() {
  const { id } = Route.useParams();
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog", "admin", id],
    queryFn: async (): Promise<BlogPost | null> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        Loading post…
      </p>
    );
  }

  if (error || !post) {
    return (
      <div className="glass-panel rounded-[24px] p-8">
        <h1 className="font-display text-lg tracking-[0.2em] text-foreground">
          POST NOT FOUND
        </h1>
        <Link
          to="/admin/blog"
          className="mt-5 inline-block text-[9px] uppercase tracking-[0.35em] text-chrome"
        >
          Back to blog
        </Link>
      </div>
    );
  }

  return (
    <div>
      <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
        ZZ / JOURNAL
      </span>
      <h1 className="mt-4 mb-8 font-display text-xl tracking-[0.22em] text-foreground">
        EDIT POST
      </h1>
      <BlogForm post={post} />
    </div>
  );
}
