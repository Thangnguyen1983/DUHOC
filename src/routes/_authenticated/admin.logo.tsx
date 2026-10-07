import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getSiteSettings, updateLogo } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/admin/logo")({
  component: LogoPage,
});

function LogoPage() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getSiteSettings);
  const saveLogo = useServerFn(updateLogo);
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => fetchSettings() });
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (logo_url: string | null) => saveLogo({ data: { logo_url } }),
    onSuccess: () => {
      toast.success("Đã cập nhật logo");
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi khi lưu")),
  });

  const ALLOWED = ["image/png", "image/jpeg", "image/svg+xml"] as const;
  const MAX_BYTES = 1_200_000;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    const extOk = ["png", "jpg", "jpeg", "svg"].includes(ext);
    if (!ALLOWED.includes(file.type as any) || !extOk) {
      toast.error("Định dạng không hợp lệ. Chỉ chấp nhận PNG, JPG hoặc SVG.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      const sizeMb = (file.size / 1_048_576).toFixed(2);
      toast.error(`Ảnh quá lớn (${sizeMb}MB). Tối đa 1.2MB — vui lòng nén hoặc chọn ảnh nhỏ hơn.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("Không đọc được file. Vui lòng thử lại.");
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }


  const current = data?.logo_url ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logo website</h1>
        <p className="text-sm text-muted-foreground">
          Logo sẽ hiển thị ở thanh trên cùng và footer của toàn bộ trang.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-sm font-semibold">Logo hiện tại</div>
          <div className="mt-4 flex h-40 items-center justify-center rounded-xl border bg-muted/30">
            {current ? (
              <img src={current} alt="Logo" className="max-h-32 object-contain" />
            ) : (
              <div className="text-sm text-muted-foreground">Chưa có logo — đang dùng mặc định (chữ K)</div>
            )}
          </div>
          {current && (
            <button
              onClick={() => mutation.mutate(null)}
              disabled={mutation.isPending}
              className="mt-4 text-sm text-destructive hover:underline disabled:opacity-50"
            >
              Xóa logo (về mặc định)
            </button>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <div className="text-sm font-semibold">Tải logo mới</div>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG/JPG/SVG, nền trong suốt hoặc vuông. Tối đa 1.2MB.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg"
            onChange={onFile}
            className="mt-4 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
          />
          {preview && (
            <>
              <div className="mt-4 flex h-40 items-center justify-center rounded-xl border bg-muted/30">
                <img src={preview} alt="Xem trước" className="max-h-32 object-contain" />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => mutation.mutate(preview)}
                  disabled={mutation.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {mutation.isPending ? "Đang lưu..." : "Lưu logo"}
                </button>
                <button
                  onClick={() => {
                    setPreview(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Hủy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
