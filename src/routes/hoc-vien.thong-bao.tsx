import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check } from "lucide-react";

export const Route = createFileRoute("/hoc-vien/thong-bao")({ component: PortalNotifications });

function PortalNotifications() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
  }

  async function markAllRead() {
    const unread = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!unread.length) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" /> Thông báo của tôi
        </h1>
        <button onClick={markAllRead} className="text-sm text-primary">
          Đánh dấu đã đọc tất cả
        </button>
      </div>
      <div className="rounded-xl border bg-card divide-y">
        {loading && <div className="p-6 text-center text-muted-foreground">Đang tải...</div>}
        {!loading && items.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Chưa có thông báo nào.</div>
        )}
        {items.map((n) => (
          <div
            key={n.id}
            className={`p-4 flex items-start gap-3 ${!n.read_at ? "bg-primary/5" : ""}`}
          >
            <div
              className={`mt-1 h-2 w-2 rounded-full ${!n.read_at ? "bg-primary" : "bg-muted-foreground/30"}`}
            />
            <div className="flex-1">
              <div className="font-medium">{n.title}</div>
              {n.body && <div className="text-sm text-muted-foreground mt-1">{n.body}</div>}
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(n.created_at).toLocaleString("vi-VN")}
              </div>
            </div>
            {!n.read_at && (
              <button
                onClick={() => markRead(n.id)}
                className="text-xs text-primary inline-flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Đã đọc
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
