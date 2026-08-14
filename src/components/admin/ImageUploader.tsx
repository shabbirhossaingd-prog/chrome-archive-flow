import { useRef, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
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
        refs.push(await upload(file));
      }
      onChange([...value, ...refs]);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <span className={adminLabel}>
        {label} ({value.length}/{max})
      </span>
      <div className="flex flex-wrap gap-3">
        {value.map((ref) => (
          <div key={ref} className="relative">
            <SmartImage
              src={ref}
              alt="Product image"
              width={160}
              height={200}
              className="size-20 rounded-xl border border-border/60 object-cover"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange(value.filter((v) => v !== ref))}
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
          {busy ? "Uploading…" : "Add"}
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