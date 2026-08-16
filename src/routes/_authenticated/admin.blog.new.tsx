import { createFileRoute } from "@tanstack/react-router";
import { BlogForm } from "@/components/admin/BlogForm";

export const Route = createFileRoute("/_authenticated/admin/blog/new")({
  component: NewBlogPost,
});

function NewBlogPost() {
  return (
    <div>
      <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
        ZZ / JOURNAL
      </span>
      <h1 className="mt-4 mb-8 font-display text-xl tracking-[0.22em] text-foreground">
        NEW POST
      </h1>
      <BlogForm />
    </div>
  );
}
