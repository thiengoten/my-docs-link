import { Share2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareLinkFormDialog } from "@/components/share-link-form-dialog";
import { RevokeShareLinkButton } from "@/components/revoke-share-link-button";
import { CopyShareLinkButton } from "@/components/copy-share-link-button";

export default async function ShareLinksPage() {
  const supabase = await createClient();

  const [{ data: projects }, { data: documents }, { data: shareLinks }] = await Promise.all([
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("documents").select("id, file_name, project_id").order("file_name"),
    supabase.from("share_links").select("*").order("created_at", { ascending: false }),
  ]);

  const projectOptions = (projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    documents: (documents ?? []).filter((d) => d.project_id === p.id),
  }));

  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));

  function isExpired(expiresAt: string | null) {
    return !!expiresAt && new Date(expiresAt) <= new Date();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-title font-bold text-ink">Link chia sẻ</h1>
        <ShareLinkFormDialog projects={projectOptions} />
      </div>

      {!shareLinks?.length && (
        <EmptyState
          icon={Share2}
          title="Chưa có link chia sẻ nào"
          description="Tạo link để chia sẻ dự án hoặc tài liệu cụ thể cho người xem ngoài, không cần đăng nhập."
        />
      )}

      {!!shareLinks?.length && (
        <div className="space-y-3">
          {shareLinks.map((link) => {
            const expired = isExpired(link.expires_at);
            const inactive = link.revoked || expired;
            return (
              <div
                key={link.id}
                className="flex flex-col gap-2 rounded-md border border-line bg-paper-raised p-4 shadow-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-body font-semibold text-ink">
                    {projectNameById.get(link.project_id) ?? "Dự án đã xóa"}
                  </p>
                  <p className="text-caption text-slate">
                    {link.document_ids?.length
                      ? `${link.document_ids.length} tài liệu`
                      : "Toàn bộ dự án"}
                    {link.expires_at && ` · Hết hạn ${link.expires_at.slice(0, 10)}`}
                  </p>
                  <p className="font-data text-data text-slate">
                    {link.revoked ? "Đã thu hồi" : expired ? "Đã hết hạn" : "/share/" + link.token}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!inactive && (
                    <>
                      <Link
                        href={`/share/${link.token}`}
                        target="_blank"
                        className="text-caption text-ink-soft hover:text-ink"
                      >
                        Mở link
                      </Link>
                      <CopyShareLinkButton token={link.token} />
                      <RevokeShareLinkButton linkId={link.id} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
