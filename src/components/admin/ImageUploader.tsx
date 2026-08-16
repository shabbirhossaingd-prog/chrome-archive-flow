import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SmartImage, toStorageRef } from "@/components/site/SmartImage";
import { adminLabel, AdminButton } from "./AdminUI";

async function upload(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return toStorageRef(path);
}

export function ImageUploader({
  label,
  value,
  onChange,
  max = 1,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - value.length;
    if (room <= 0) {
      toast.error(`Maximum ${max} image${max > 1 ? "s" : ""}`);
      return;
    }

    setBusy(true);
    try {
      const refs: string[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
        if (file.size > 12 * 1024 * 1024) throw new Error("Each image must be under 12MB");
        refs.push(await upload(file));
      }
      onChange([...value, ...refs]);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeOne = async (ref: string, index: number) => {
    try {
      if (ref.startsWith("storage:")) {
        const path = ref.slice("storage:".length);
        const { error } = await supabase.storage.from("product-images").remove([path]);
        if (error) throw error;
      }
      onChange(value.filter((_, i) => i !== index));
      toast.success("Image removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove image");
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      <span className={adminLabel}>
        {label} ({value.length}/{max})
      </span>
      <div className="flex flex-wrap gap-3">
        {value.map((ref, index) => (
          <div key={`${ref}-${index}`} className="relative rounded-xl border border-border/60 p-1">
            <SmartImage
              src={ref}
              alt={`${label} ${index + 1}`}
              width={160}
              height={200}
              className="size-20 rounded-lg object-cover"
            />
            {max > 1 && (
              <div className="mt-1 flex justify-center gap-1">
                <button
                  type="button"
                  aria-label="Move image left"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="grid size-6 place-items-center rounded border border-border/50 text-muted-foreground disabled:opacity-30"
                >
                  <ArrowLeft className="size-3" />
                </button>
                <button
                  type="button"
                  aria-label="Move image right"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                  className="grid size-6 place-items-center rounded border border-border/50 text-muted-foreground disabled:opacity-30"
                >
                  <ArrowRight className="size-3" />
                </button>
              </div>
            )}
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => void removeOne(ref, index)}
              className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-border/70 bg-black text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        <AdminButton
          disabled={busy || value.length >= max}
          onClick={() => inputRef.current?.click()}
          className="h-20"
        >
          {busy ? "Uploading…" : "Add image"}
        </AdminButton>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
