import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Paperclip, Upload, Trash2, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/StoreContext";

type Row = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string | null;
  created_at: string;
  uploaded_by: string | null;
};

interface Props {
  entityType: string;
  entityId: string;
  projectId: string;
  title?: string;
}

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentList({ entityType, entityId, projectId, title = "Evidence & Attachments" }: Props) {
  const { currentUser } = useStore();
  const isConsultant = currentUser?.role === "consultant";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attachments")
      .select("id, file_name, file_path, file_size, content_type, created_at, uploaded_by")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  async function upload(file: File) {
    if (!currentUser) return;
    setBusy(true);
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${projectId}/${entityType}/${entityId}/${crypto.randomUUID()}-${safe}`;
    const { error: upErr } = await supabase.storage.from("attachments").upload(path, file, {
      contentType: file.type || "application/octet-stream",
    });
    if (upErr) { toast.error(upErr.message); setBusy(false); return; }

    const { error: insErr } = await supabase.from("attachments").insert({
      entity_type: entityType,
      entity_id: entityId,
      project_id: projectId,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      content_type: file.type || null,
      uploaded_by: currentUser.id,
    });
    if (insErr) {
      await supabase.storage.from("attachments").remove([path]);
      toast.error(insErr.message);
    } else {
      toast.success("File uploaded");
      await load();
    }
    setBusy(false);
  }

  async function download(r: Row) {
    const { data, error } = await supabase.storage.from("attachments").createSignedUrl(r.file_path, 60);
    if (error || !data?.signedUrl) { toast.error(error?.message ?? "Download failed"); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function remove(r: Row) {
    if (!confirm(`Delete "${r.file_name}"?`)) return;
    await supabase.storage.from("attachments").remove([r.file_path]);
    const { error } = await supabase.from("attachments").delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    await load();
  }

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="stat-label flex items-center gap-1.5"><Paperclip className="h-3 w-3" /> {title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{rows.length} file{rows.length === 1 ? "" : "s"}</p>
        </div>
        {isConsultant && (
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              Upload
            </Button>
          </>
        )}
      </div>

      <ul className="mt-4 divide-y divide-border">
        {loading ? (
          <li className="py-4 text-center text-xs text-muted-foreground">Loading…</li>
        ) : rows.length === 0 ? (
          <li className="py-6 text-center text-xs text-muted-foreground">No attachments yet.</li>
        ) : rows.map(r => (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{r.file_name}</div>
              <div className="text-[11px] text-muted-foreground">
                {fmtSize(r.file_size)} • {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => download(r)} title="Download">
              <FileDown className="h-4 w-4" />
            </Button>
            {isConsultant && (
              <Button size="icon" variant="ghost" onClick={() => remove(r)} title="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
