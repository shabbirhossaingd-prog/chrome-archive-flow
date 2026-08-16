import { useEffect, useRef } from "react";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote, Heading2, Minus, Image as ImageIcon } from "lucide-react";

function command(name: string, value?: string) {
  document.execCommand(name, false, value);
}

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const sync = () => onChange(ref.current?.innerHTML ?? "");

  const run = (name: string, value?: string) => {
    ref.current?.focus();
    command(name, value);
    sync();
  };

  const addLink = () => {
    const url = window.prompt("Paste the link URL");
    if (!url) return;
    run("createLink", url);
  };

  const addImage = () => {
    const url = window.prompt("Paste a permanent image URL");
    if (!url) return;
    ref.current?.focus();
    document.execCommand(
      "insertHTML",
      false,
      `<p><img src="${url.replace(/"/g, "&quot;")}" alt="ZZERKOFF journal image" /></p>`,
    );
    sync();
  };

  const divider = () => {
    ref.current?.focus();
    document.execCommand("insertHTML", false, "<hr />");
    sync();
  };

  const tools = [
    { label: "Bold", icon: Bold, action: () => run("bold") },
    { label: "Italic", icon: Italic, action: () => run("italic") },
    { label: "Heading", icon: Heading2, action: () => run("formatBlock", "h2") },
    { label: "Bullets", icon: List, action: () => run("insertUnorderedList") },
    { label: "Numbers", icon: ListOrdered, action: () => run("insertOrderedList") },
    { label: "Quote", icon: Quote, action: () => run("formatBlock", "blockquote") },
    { label: "Link", icon: LinkIcon, action: addLink },
    { label: "Image URL", icon: ImageIcon, action: addImage },
    { label: "Divider", icon: Minus, action: divider },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-black/40">
      <div className="flex flex-wrap gap-1 border-b border-border/50 p-2">
        {tools.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={action}
            className="grid size-9 place-items-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        className="min-h-[320px] px-5 py-5 font-editorial text-base leading-relaxed text-foreground outline-none [&_a]:text-chrome [&_blockquote]:border-l [&_blockquote]:border-chrome/40 [&_blockquote]:pl-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:tracking-[0.08em] [&_img]:my-6 [&_img]:max-h-[48rem] [&_img]:w-full [&_img]:rounded-xl [&_img]:object-cover [&_hr]:my-8 [&_hr]:border-border/50 [&_li]:ml-6 [&_ol]:list-decimal [&_p]:my-3 [&_ul]:list-disc"
        data-placeholder="Write the ZZERKOFF journal entry…"
      />
    </div>
  );
}
