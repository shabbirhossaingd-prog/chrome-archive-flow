import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";
const STORAGE_PREFIX = "storage:";
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

function storagePathFromRef(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;

  if (value.startsWith(STORAGE_PREFIX)) {
    const path = value.slice(STORAGE_PREFIX.length).trim();
    return path || null;
  }

  const markerIndex = value.indexOf(PUBLIC_MARKER);
  if (markerIndex >= 0) {
    const raw = value.slice(markerIndex + PUBLIC_MARKER.length).split("?")[0];
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw || null;
    }
  }

  return null;
}

function collectRefsDeep(value: unknown, target: Set<string>) {
  const path = storagePathFromRef(value);
  if (path) {
    target.add(path);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectRefsDeep(item, target);
    return;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectRefsDeep(item, target);
    }
  }
}

async function fetchReferenceRows() {
  const tableQueries = [
    (supabase as any).from("products").select("*"),
    (supabase as any).from("categories").select("*"),
    (supabase as any).from("collections").select("*"),
    (supabase as any).from("pages").select("*"),
    (supabase as any).from("blog_posts").select("*"),
    (supabase as any).from("site_settings").select("*"),
    (supabase as any).from("commerce_bundles").select("*"),
    (supabase as any).from("commerce_shop_looks").select("*"),
  ];

  const results = await Promise.all(tableQueries);

  for (const result of results) {
    if (result.error) throw result.error;
  }

  return results.flatMap((result) => result.data ?? []);
}

export async function getReferencedMediaPaths() {
  const refs = new Set<string>();
  const rows = await fetchReferenceRows();

  for (const row of rows) collectRefsDeep(row, refs);
  return refs;
}

async function removePaths(paths: string[]) {
  const unique = Array.from(new Set(paths)).filter(Boolean);
  if (unique.length === 0) return 0;

  let removed = 0;

  for (let index = 0; index < unique.length; index += 100) {
    const batch = unique.slice(index, index + 100);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) throw error;
    removed += batch.length;
  }

  return removed;
}

/**
 * Safely remove only the supplied media refs that are no longer referenced by
 * any storefront/CMS table. Use this after a successful save/delete.
 */
export async function removeUnusedMediaRefs(refs: Array<string | null | undefined>) {
  const candidatePaths = Array.from(
    new Set(
      refs
        .map((ref) => storagePathFromRef(ref))
        .filter((path): path is string => !!path),
    ),
  );

  if (candidatePaths.length === 0) return 0;

  const referenced = await getReferencedMediaPaths();
  const unused = candidatePaths.filter((path) => !referenced.has(path));
  return removePaths(unused);
}

type ListedFile = {
  id?: string | null;
  name: string;
  created_at?: string | null;
};

async function listRootFiles() {
  const files: ListedFile[] = [];
  const limit = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit,
      offset,
      sortBy: { column: "created_at", order: "asc" },
    });

    if (error) throw error;

    const page = (data ?? []) as ListedFile[];
    files.push(...page.filter((item) => !!item.id));

    if (page.length < limit) break;
    offset += limit;
  }

  return files;
}

/**
 * Admin maintenance cleanup for abandoned uploads. Only root files that are:
 * 1) unreferenced everywhere, and
 * 2) older than the grace period
 * are deleted.
 */
export async function cleanupUnusedMedia(graceHours = 24) {
  const [referenced, files] = await Promise.all([
    getReferencedMediaPaths(),
    listRootFiles(),
  ]);

  const cutoff = Date.now() - Math.max(1, graceHours) * 60 * 60 * 1000;
  const unused: string[] = [];

  for (const file of files) {
    if (referenced.has(file.name)) continue;

    const createdAt = file.created_at ? Date.parse(file.created_at) : NaN;

    // If Storage did not return a trustworthy creation time, skip it.
    if (!Number.isFinite(createdAt)) continue;
    if (createdAt > cutoff) continue;

    unused.push(file.name);
  }

  const removed = await removePaths(unused);

  return {
    scanned: files.length,
    referenced: referenced.size,
    removed,
  };
}
