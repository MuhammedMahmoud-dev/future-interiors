import { AdminShell } from "@/components/admin/AdminShell";
import { GalleryManager, type GalleryItem } from "@/components/admin/GalleryManager";
import { requireAdmin } from "@/lib/admin";
import { listGalleryImages } from "@/lib/adminData";
import { signMedia } from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * The works gallery, managed apart from projects.
 *
 * Unlike the project media tab this screen shows every photograph regardless of
 * is_public, because hiding one from the admin is how it gets forgotten about.
 */
export default async function AdminGalleryPage() {
  await requireAdmin();

  const rows = await listGalleryImages();
  const signed = await signMedia(rows.map((row) => row.url));

  const items: GalleryItem[] = rows.map((row) => ({
    id: row.id,
    url: row.url,
    signedUrl: signed.get(row.url) ?? null,
    caption_ar: row.caption_ar,
    is_public: row.is_public,
  }));

  return (
    <AdminShell
      title="معرض الأعمال"
      action={<span className="text-xs text-muted-ink">{items.length} صورة</span>}
    >
      <GalleryManager items={items} />
    </AdminShell>
  );
}
