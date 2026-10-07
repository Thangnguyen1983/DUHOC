import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProvinces, listWards } from "@/lib/catalog/geo.functions";
import { Input } from "@/components/ui/input";

/**
 * Bộ chọn Tỉnh/Thành phố + Xã/Phường lấy từ Danh mục hệ thống → Địa danh.
 * Vẫn cho phép gõ tay khi địa danh chưa có trong danh mục.
 */
export function GeoPicker({
  province,
  ward,
  onChange,
  disabled,
  labels = true,
}: {
  province: string | null | undefined;
  ward: string | null | undefined;
  onChange: (v: { province: string; ward: string }) => void;
  disabled?: boolean;
  labels?: boolean;
}) {
  const provFn = useServerFn(listProvinces);
  const wardFn = useServerFn(listWards);
  const [manual, setManual] = useState(false);

  const provinces = useQuery({
    queryKey: ["geo-provinces"],
    queryFn: () => provFn(),
    staleTime: 10 * 60_000,
  });

  const provinceCode = useMemo(() => {
    const p = (provinces.data ?? []).find(
      (x: any) => x.name === province || x.short_name === province,
    );
    return p?.code as string | undefined;
  }, [provinces.data, province]);

  const wards = useQuery({
    queryKey: ["geo-wards", provinceCode],
    queryFn: () => wardFn({ data: { provinceCode: provinceCode! } }),
    enabled: !!provinceCode,
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (province && provinces.data && !provinceCode) setManual(true);
  }, [province, provinces.data, provinceCode]);

  if (manual) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          {labels && <div className="mb-1 text-xs text-muted-foreground">Tỉnh / Thành phố</div>}
          <Input
            value={province ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ province: e.target.value, ward: ward ?? "" })}
          />
        </div>
        <div>
          {labels && (
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Xã / Phường</span>
              <button type="button" className="underline" onClick={() => setManual(false)}>
                Chọn từ danh mục
              </button>
            </div>
          )}
          <Input
            value={ward ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ province: province ?? "", ward: e.target.value })}
          />
        </div>
      </div>
    );
  }

  const selectCls =
    "h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        {labels && <div className="mb-1 text-xs text-muted-foreground">Tỉnh / Thành phố</div>}
        <select
          className={selectCls}
          disabled={disabled || provinces.isLoading}
          value={province ?? ""}
          onChange={(e) => onChange({ province: e.target.value, ward: "" })}
        >
          <option value="">— Chọn tỉnh / thành phố —</option>
          {(provinces.data ?? [])
            .filter((p: any) => p.is_active)
            .map((p: any) => (
              <option key={p.code} value={p.name}>
                {p.name}
              </option>
            ))}
        </select>
      </div>
      <div>
        {labels && (
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Xã / Phường</span>
            <button type="button" className="underline" onClick={() => setManual(true)}>
              Gõ tay
            </button>
          </div>
        )}
        <select
          className={selectCls}
          disabled={disabled || !provinceCode || wards.isLoading}
          value={ward ?? ""}
          onChange={(e) => onChange({ province: province ?? "", ward: e.target.value })}
        >
          <option value="">
            {provinceCode ? "— Chọn xã / phường —" : "Chọn tỉnh trước"}
          </option>
          {(wards.data ?? [])
            .filter((w: any) => w.is_active)
            .map((w: any) => (
              <option key={w.code} value={w.name}>
                {w.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
