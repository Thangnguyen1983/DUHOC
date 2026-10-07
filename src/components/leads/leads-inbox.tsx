import { errorMessage } from "@/lib/errors";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  listConsultations,
  updateConsultationStatus,
  setConsultationHidden,
  deleteConsultation,
} from "@/lib/consultations.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, MoreHorizontal, EyeOff, Eye, Trash2, Search } from "lucide-react";

import type { LeadStatus } from "@/lib/leads/status";

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Tiềm năng",
  done: "Hoàn tất",
  lost: "Khách bỏ",
};

const AUTO_PROFILE_STATUSES: LeadStatus[] = ["contacted", "qualified", "done"];

type FilterKey = LeadStatus | "all" | "waiting" | "hidden";

export function LeadsInbox() {
  const fetchLeads = useServerFn(listConsultations);
  const updateStatus = useServerFn(updateConsultationStatus);
  const setHidden = useServerFn(setConsultationHidden);
  const removeLead = useServerFn(deleteConsultation);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("waiting");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<any>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-leads"], queryFn: () => fetchLeads() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-leads"] });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: LeadStatus }) => updateStatus({ data: vars }),
    onSuccess: (res) => {
      invalidate();
      if (res?.student_profile_id) {
        toast.success("Đã cập nhật – Hồ sơ học viên đã sẵn sàng", {
          action: {
            label: "Mở hồ sơ",
            onClick: () => {
              window.location.href = `/admin/students/${res.student_profile_id}`;
            },
          },
        });
      } else {
        toast.success("Đã cập nhật trạng thái");
      }
    },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  const hideMut = useMutation({
    mutationFn: (vars: { id: string; hidden: boolean }) => setHidden({ data: vars }),
    onSuccess: (_r, v) => {
      invalidate();
      toast.success(v.hidden ? "Đã ẩn khỏi danh sách" : "Đã bỏ ẩn");
    },
    onError: (e) => toast.error(errorMessage(e, "Lỗi")),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => removeLead({ data: { id } }),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      toast.success("Đã xoá khách hàng tiềm năng");
    },
    onError: (e) => toast.error(errorMessage(e, "Không xoá được")),
  });

  // Realtime: thông báo khi có lead mới
  useEffect(() => {
    const channel = supabase
      .channel("admin-leads-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "consultations" },
        (payload) => {
          const lead: any = payload.new;
          const src = lead?.source === "chatbot" ? "🤖 Chatbot" : "📝 Form";
          toast.success(`${src} – Lead mới: ${lead?.full_name ?? "?"} – ${lead?.phone ?? ""}`, {
            duration: 8000,
          });
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.05;
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 180);
          } catch { /* ignore */ }
          invalidate();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc]);

  const all: any[] = useMemo(() => data?.items ?? [], [data]);

  const isWaiting = (l: any) => !l.is_hidden && l.status === "new" && !l.claimed_at;

  const counts = useMemo(() => {
    const visible = all.filter((l) => !l.is_hidden);
    return {
      all: visible.length,
      waiting: visible.filter(isWaiting).length,
      new: visible.filter((l) => l.status === "new").length,
      contacted: visible.filter((l) => l.status === "contacted").length,
      qualified: visible.filter((l) => l.status === "qualified").length,
      done: visible.filter((l) => l.status === "done").length,
      lost: visible.filter((l) => l.status === "lost").length,
      hidden: all.filter((l) => l.is_hidden).length,
    } as Record<FilterKey, number>;
  }, [all]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = all.filter((l) => (filter === "hidden" ? l.is_hidden : !l.is_hidden));
    if (filter === "waiting") list = list.filter(isWaiting);
    else if (filter !== "all" && filter !== "hidden") list = list.filter((l) => l.status === filter);
    if (q)
      list = list.filter((l) =>
        [l.full_name, l.phone, l.email, l.market, l.program]
          .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(q)),
      );
    // Ưu tiên lead đang chờ tiếp nhận lên đầu, sau đó mới tới ngày tạo
    return [...list].sort((a, b) => {
      const wa = isWaiting(a) ? 0 : 1;
      const wb = isWaiting(b) ? 0 : 1;
      if (wa !== wb) return wa - wb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [all, filter, search]);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "waiting", label: "⏳ Chờ tiếp nhận" },
    { key: "all", label: "Tất cả" },
    { key: "new", label: STATUS_LABEL.new },
    { key: "contacted", label: STATUS_LABEL.contacted },
    { key: "qualified", label: STATUS_LABEL.qualified },
    { key: "done", label: STATUS_LABEL.done },
    { key: "lost", label: STATUS_LABEL.lost },
    { key: "hidden", label: "Đã ẩn" },
  ];

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Danh sách đăng ký tư vấn</h2>
          <p className="text-sm text-muted-foreground">
            Lead <b>đang chờ tiếp nhận</b> luôn hiển thị trước. Chuyển sang <b>Đã liên hệ</b>,{" "}
            <b>Tiềm năng</b> hoặc <b>Hoàn tất</b> sẽ tự động sinh Hồ sơ học viên.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm tên, SĐT, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">
              {counts[f.key] ?? 0}
            </span>
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">SĐT</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Chương trình</th>
              <th className="px-4 py-3">Thị trường</th>
              <th className="px-4 py-3">Nguồn</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Trạng thái & Hồ sơ HV</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((l: any) => (
              <tr key={l.id} className={isWaiting(l) ? "bg-primary/5" : undefined}>
                <td className="px-4 py-3 font-medium">
                  {l.full_name}
                  {isWaiting(l) && (
                    <Badge className="ml-2" variant="destructive">
                      Chờ tiếp nhận
                    </Badge>
                  )}
                  {l.is_hidden && (
                    <Badge className="ml-2" variant="secondary">
                      Đã ẩn
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3"><a href={`tel:${l.phone}`} className="text-primary">{l.phone}</a></td>
                <td className="px-4 py-3 text-muted-foreground">{l.email || "—"}</td>
                <td className="px-4 py-3">{l.program}</td>
                <td className="px-4 py-3">{l.market || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={l.source === "chatbot" ? "default" : "outline"}>
                    {l.source === "chatbot" ? "🤖 Bot" : "📝 Form"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={l.status === s ? "default" : "outline"}
                        onClick={() => mut.mutate({ id: l.id, status: s })}
                        disabled={mut.isPending}
                        title={
                          AUTO_PROFILE_STATUSES.includes(s) && !l.student_profile_id
                            ? "Sẽ tự động sinh hồ sơ học viên"
                            : undefined
                        }
                      >
                        {STATUS_LABEL[s]}
                      </Button>
                    ))}
                  </div>
                  {l.student_profile_id ? (
                    <Link
                      to="/admin/students/$id"
                      params={{ id: l.student_profile_id }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Mở hồ sơ học viên
                    </Link>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">Chưa có hồ sơ HV</div>
                  )}
                  {l.message && <div className="mt-2 text-xs text-muted-foreground">💬 {l.message}</div>}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {l.is_hidden ? (
                        <DropdownMenuItem
                          onClick={() => hideMut.mutate({ id: l.id, hidden: false })}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Bỏ ẩn
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => hideMut.mutate({ id: l.id, hidden: true })}>
                          <EyeOff className="mr-2 h-4 w-4" /> Ẩn khỏi danh sách
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingDelete(l)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Xoá
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  Không có dữ liệu phù hợp bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá khách hàng tiềm năng?</AlertDialogTitle>
            <AlertDialogDescription>
              Xoá vĩnh viễn “{pendingDelete?.full_name}” khỏi hệ thống. Nếu lead đã sinh hồ sơ học
              viên, hãy dùng chức năng Ẩn thay vì xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && delMut.mutate(pendingDelete.id)}
              disabled={delMut.isPending}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
