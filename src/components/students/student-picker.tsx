import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchStudentsForArchive } from "@/lib/students/archive.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";

export type PickedStudent = {
  id: string;
  student_code: string | null;
  full_name: string | null;
  phone: string | null;
};

/**
 * Ô tìm & chọn học viên theo mã học viên (KZ…), họ tên hoặc số điện thoại.
 * Chỉ trả về id khi người dùng đã chọn đúng một học viên trong danh sách.
 */
export function StudentPicker({
  label = "Học viên",
  value,
  onChange,
  placeholder = "Gõ mã học viên (KZ…), họ tên hoặc số điện thoại…",
}: {
  label?: string;
  value?: PickedStudent | null;
  onChange: (s: PickedStudent | null) => void;
  placeholder?: string;
}) {
  const searchFn = useServerFn(searchStudentsForArchive);
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [openList, setOpenList] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const res = useQuery({
    queryKey: ["archive-student-search", term],
    queryFn: () => searchFn({ data: { q: term } }),
    enabled: openList && !value,
  });
  const items = (res.data?.items ?? []) as PickedStudent[];

  if (value) {
    return (
      <div>
        <Label>{label}</Label>
        <div className="mt-1 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <div className="min-w-0">
            <div className="font-medium truncate">{value.full_name ?? "Học viên"}</div>
            <div className="text-xs text-muted-foreground truncate">
              {value.student_code ?? "—"}
              {value.phone ? ` · ${value.phone}` : ""}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => {
              onChange(null);
              setQ("");
              setOpenList(true);
            }}
          >
            <X className="h-4 w-4 mr-1" /> Đổi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="relative mt-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          value={q}
          placeholder={placeholder}
          onFocus={() => setOpenList(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpenList(true);
          }}
        />
      </div>
      {openList && (
        <div className="mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover shadow-sm">
          {res.isLoading && (
            <div className="px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm…
            </div>
          )}
          {!res.isLoading && items.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              Không tìm thấy học viên phù hợp.
            </div>
          )}
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                onChange(s);
                setOpenList(false);
              }}
            >
              <span className="font-medium">{s.full_name ?? "—"}</span>
              <span className="text-xs text-muted-foreground">
                {" "}
                · {s.student_code ?? "—"}
                {s.phone ? ` · ${s.phone}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        Chọn học viên trong danh sách gợi ý để hệ thống gắn đúng hồ sơ.
      </p>
    </div>
  );
}
