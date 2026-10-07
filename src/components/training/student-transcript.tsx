import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getStudentTranscript } from "@/lib/training/teaching.functions";
import { Award, BookOpen, CreditCard, Link2, ShieldCheck } from "lucide-react";

/** Học bạ hợp nhất: lớp offline, chuyên cần, điểm, chứng chỉ, khoá online, đơn hàng. */
export function StudentTranscript({ studentProfileId }: { studentProfileId: string }) {
  const fetchTranscript = useServerFn(getStudentTranscript);
  const { data, isLoading, error } = useQuery({
    queryKey: ["student-transcript", studentProfileId],
    queryFn: () => fetchTranscript({ data: { student_profile_id: studentProfileId } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Đang tổng hợp học bạ...</p>;
  if (error) return <p className="text-sm text-red-600">{(error as any).message}</p>;
  if (!data) return null;

  const p: any = data.profile;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <ShieldCheck className={`h-5 w-5 ${p.user_id ? "text-emerald-600" : "text-muted-foreground"}`} />
          <div>
            <div className="font-semibold">
              {p.full_name} {p.student_code ? <span className="text-muted-foreground">· {p.student_code}</span> : null}
            </div>
            <div className="text-xs text-muted-foreground">
              {p.user_id
                ? "Đã liên kết tài khoản đăng nhập — điểm danh QR xác thực đúng danh tính."
                : "Chưa liên kết tài khoản — học viên chưa thể tự điểm danh bằng QR."}
            </div>
          </div>
        </div>
        {data.accountLinks.length > 0 && (
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            {data.accountLinks.map((l: any) => (
              <div key={l.id} className="flex items-center gap-1">
                <Link2 className="h-3 w-3" /> {l.method ?? "link"} · {new Date(l.created_at).toLocaleString("vi-VN")}
              </div>
            ))}
          </div>
        )}
      </div>

      <Block title="Lớp đào tạo trực tiếp" icon={BookOpen}>
        {data.classes.length === 0 ? (
          <Empty text="Chưa tham gia lớp nào." />
        ) : (
          <div className="space-y-3">
            {data.classes.map((c: any) => (
              <div key={c.enrollment_id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{c.cls?.name}</div>
                  <div className="text-xs text-muted-foreground">{c.cls?.training_programs?.name}</div>
                </div>
                <div className="mt-1 text-xs">
                  Chuyên cần: <strong>{c.attendance.rate == null ? "—" : `${c.attendance.rate}%`}</strong> ({c.attendance.present}/{c.attendance.total} buổi
                  {c.attendance.absent ? `, vắng ${c.attendance.absent}` : ""}) · Điểm tổng kết: <strong>{c.final_grade ?? "—"}</strong>
                </div>
                {c.grades.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                    {c.grades.map((g: any) => (
                      <span key={g.id} className="rounded-full bg-muted px-2 py-0.5">
                        {g.title || g.grade_type}: {g.score}/{g.max_score}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Block>

      <Block title="Khoá học trực tuyến" icon={BookOpen}>
        {data.courses.length === 0 ? <Empty text="Chưa có khoá online." /> : (
          <ul className="space-y-1 text-sm">
            {data.courses.map((c: any) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span>{c.courses?.title}</span>
                <span className="text-xs text-muted-foreground">{c.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Chứng chỉ" icon={Award}>
        {data.certificates.length === 0 ? <Empty text="Chưa có chứng chỉ." /> : (
          <ul className="space-y-1 text-sm">
            {data.certificates.map((c: any) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span>{c.title ?? c.certificate_no}</span>
                <span className="text-xs text-muted-foreground">{c.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Đơn hàng" icon={CreditCard}>
        {data.orders.length === 0 ? <Empty text="Chưa có đơn hàng." /> : (
          <ul className="space-y-1 text-sm">
            {data.orders.map((o: any) => (
              <li key={o.id} className="flex justify-between gap-2">
                <span>{o.order_code ?? o.id.slice(0, 8)}</span>
                <span className="text-xs text-muted-foreground">
                  {Number(o.total_amount ?? 0).toLocaleString("vi-VN")}₫ · {o.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </div>
  );
}

function Block({ title, icon: Icon, children }: any) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-2 flex items-center gap-2 font-semibold"><Icon className="h-4 w-4" />{title}</h3>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
