import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listProvinces, listWards } from "@/lib/catalog/geo.functions";
import { updateStudent } from "@/lib/students.functions";
import { errorMessage } from "@/lib/errors";

/**
 * Khối địa bàn của hồ sơ học viên: Quê quán / Thường trú / Nơi ở hiện tại.
 * Tỉnh-thành và Xã/Phường chọn từ Danh mục hệ thống → Địa danh (mô hình 2 cấp).
 */

export type AddressValue = {
  province_code: string;
  province_name: string;
  ward_code: string;
  ward_name: string;
  detail: string;
};

const EMPTY: AddressValue = {
  province_code: "",
  province_name: "",
  ward_code: "",
  ward_name: "",
  detail: "",
};

const selectCls = "h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60";

function AddressBlock({
  title,
  value,
  onChange,
  disabled,
  provinces,
}: {
  title: string;
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  disabled?: boolean;
  provinces: Array<any>;
}) {
  const wardFn = useServerFn(listWards);
  const wards = useQuery({
    queryKey: ["geo-wards", value.province_code],
    queryFn: () => wardFn({ data: { provinceCode: value.province_code } }),
    enabled: !!value.province_code,
    staleTime: 10 * 60_000,
  });

  const full = useMemo(
    () => [value.detail, value.ward_name, value.province_name].filter(Boolean).join(", "),
    [value],
  );

  return (
    <div className="rounded-lg border bg-background/50 p-4 space-y-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Tỉnh / Thành phố</Label>
          <select
            className={selectCls}
            disabled={disabled}
            value={value.province_code}
            onChange={(e) => {
              const p = provinces.find((x: any) => String(x.code) === e.target.value);
              onChange({
                ...value,
                province_code: e.target.value,
                province_name: p?.name ?? "",
                ward_code: "",
                ward_name: "",
              });
            }}
          >
            <option value="">— Chọn tỉnh / thành phố —</option>
            {provinces
              .filter((p: any) => p.is_active)
              .map((p: any) => (
                <option key={p.code} value={String(p.code)}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Xã / Phường / Đặc khu</Label>
          <select
            className={selectCls}
            disabled={disabled || !value.province_code || wards.isLoading}
            value={value.ward_code}
            onChange={(e) => {
              const w = (wards.data ?? []).find((x: any) => String(x.code) === e.target.value);
              onChange({ ...value, ward_code: e.target.value, ward_name: (w as any)?.name ?? "" });
            }}
          >
            <option value="">
              {value.province_code ? "— Chọn xã / phường —" : "Chọn tỉnh trước"}
            </option>
            {(wards.data ?? [])
              .filter((w: any) => w.is_active)
              .map((w: any) => (
                <option key={w.code} value={String(w.code)}>
                  {w.name}
                </option>
              ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-muted-foreground">
            Địa chỉ chi tiết (số nhà, tổ / thôn / xóm, đường)
          </Label>
          <Input
            disabled={disabled}
            value={value.detail}
            placeholder="VD: Số 12, ngõ 5, thôn Đông, đường Lê Lợi"
            onChange={(e) => onChange({ ...value, detail: e.target.value })}
          />
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Địa chỉ đầy đủ: <span className="font-medium text-foreground">{full || "—"}</span>
      </div>
    </div>
  );
}

export type AddressSet = { origin: AddressValue; residence: AddressValue; current: AddressValue };

export const EMPTY_ADDRESS_SET: AddressSet = { origin: EMPTY, residence: EMPTY, current: EMPTY };

/** Chuyển bộ 3 địa chỉ thành các trường phẳng để gửi lên máy chủ (dùng cho tạo/sửa hồ sơ). */
export function addressSetToFields(set: AddressSet): Record<string, string> {
  const out: Record<string, string> = {};
  (["origin", "residence", "current"] as const).forEach((prefix) => {
    const v = set[prefix];
    out[`${prefix}_province_code`] = v.province_code;
    out[`${prefix}_province_name`] = v.province_name;
    out[`${prefix}_ward_code`] = v.ward_code;
    out[`${prefix}_ward_name`] = v.ward_name;
    out[`${prefix}_address_detail`] = v.detail;
  });
  return out;
}

/**
 * Nhóm 3 khối địa chỉ dạng controlled (không tự lưu) — nhúng vào form tạo hồ sơ.
 */
export function AddressFields({
  value,
  onChange,
  disabled,
  compact,
}: {
  value: AddressSet;
  onChange: (v: AddressSet) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const provFn = useServerFn(listProvinces);
  const provinces = useQuery({
    queryKey: ["geo-provinces"],
    queryFn: () => provFn(),
    staleTime: 10 * 60_000,
  });
  const list = (provinces.data ?? []) as Array<any>;
  return (
    <div className="space-y-3">
      {!disabled && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...value, current: value.residence })}
          >
            <Copy className="mr-1 h-4 w-4" /> Nơi ở hiện tại = Thường trú
          </Button>
        </div>
      )}
      <div className={compact ? "grid gap-3" : "grid gap-4 xl:grid-cols-3"}>
        <AddressBlock title="Quê quán" value={value.origin} disabled={disabled} provinces={list}
          onChange={(origin) => onChange({ ...value, origin })} />
        <AddressBlock title="Thường trú" value={value.residence} disabled={disabled} provinces={list}
          onChange={(residence) => onChange({ ...value, residence })} />
        <AddressBlock title="Nơi ở hiện tại" value={value.current} disabled={disabled} provinces={list}
          onChange={(current) => onChange({ ...value, current })} />
      </div>
    </div>
  );
}

/** Địa chỉ đầy đủ dạng chữ từ 3 trường đã lưu trong hồ sơ. */
export function fullAddressOf(profile: any, prefix: "origin" | "residence" | "current") {
  return [
    profile?.[`${prefix}_address_detail`],
    profile?.[`${prefix}_ward_name`],
    profile?.[`${prefix}_province_name`],
  ]
    .filter(Boolean)
    .join(", ");
}

export function AddressPanel({
  studentId,
  profile,
  canEdit = true,
}: {
  studentId: string;
  profile: any;
  canEdit?: boolean;
}) {
  const provFn = useServerFn(listProvinces);
  const updateFn = useServerFn(updateStudent);
  const qc = useQueryClient();

  const provinces = useQuery({
    queryKey: ["geo-provinces"],
    queryFn: () => provFn(),
    staleTime: 10 * 60_000,
  });

  const pick = (prefix: "origin" | "residence" | "current"): AddressValue => ({
    province_code: profile?.[`${prefix}_province_code`] ?? "",
    province_name: profile?.[`${prefix}_province_name`] ?? "",
    ward_code: profile?.[`${prefix}_ward_code`] ?? "",
    ward_name: profile?.[`${prefix}_ward_name`] ?? "",
    detail: profile?.[`${prefix}_address_detail`] ?? "",
  });

  const [origin, setOrigin] = useState<AddressValue>(() => pick("origin"));
  const [residence, setResidence] = useState<AddressValue>(() => pick("residence"));
  const [current, setCurrent] = useState<AddressValue>(() => pick("current"));

  const toPatch = (prefix: string, v: AddressValue) => ({
    [`${prefix}_province_code`]: v.province_code || null,
    [`${prefix}_province_name`]: v.province_name || null,
    [`${prefix}_ward_code`]: v.ward_code || null,
    [`${prefix}_ward_name`]: v.ward_name || null,
    [`${prefix}_address_detail`]: v.detail || null,
  });

  const compose = (v: AddressValue) =>
    [v.detail, v.ward_name, v.province_name].filter(Boolean).join(", ") || null;

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: studentId,
          patch: {
            ...toPatch("origin", origin),
            ...toPatch("residence", residence),
            ...toPatch("current", current),
            place_of_origin: compose(origin) ?? profile?.place_of_origin ?? null,
            place_of_residence: compose(residence) ?? profile?.place_of_residence ?? null,
          } as any,
        },
      }),
    onSuccess: () => {
      toast.success("Đã lưu thông tin địa bàn");
      void qc.invalidateQueries({ queryKey: ["admin-student", studentId] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Không lưu được thông tin địa bàn")),
  });

  const list = (provinces.data ?? []) as Array<any>;

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold">Nơi ở & địa bàn</h2>
          <p className="text-xs text-muted-foreground">
            Chọn tỉnh/thành và xã/phường từ danh mục địa giới hành chính hiện hành (2 cấp).
          </p>
        </div>
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrent(residence)}
            title="Sao chép từ Thường trú sang Nơi ở hiện tại"
          >
            <Copy className="mr-1 h-4 w-4" /> Nơi ở hiện tại = Thường trú
          </Button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AddressBlock
          title="Quê quán"
          value={origin}
          onChange={setOrigin}
          disabled={!canEdit}
          provinces={list}
        />
        <AddressBlock
          title="Thường trú"
          value={residence}
          onChange={setResidence}
          disabled={!canEdit}
          provinces={list}
        />
        <AddressBlock
          title="Nơi ở hiện tại"
          value={current}
          onChange={setCurrent}
          disabled={!canEdit}
          provinces={list}
        />
      </div>

      {canEdit && (
        <Button type="button" onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-1 h-4 w-4" />
          {save.isPending ? "Đang lưu..." : "Lưu địa bàn"}
        </Button>
      )}

      {(profile?.place_of_origin || profile?.place_of_residence) && (
        <div className="text-xs text-muted-foreground">
          Dữ liệu cũ dạng chữ — Quê quán: {profile?.place_of_origin || "—"} · Thường trú:{" "}
          {profile?.place_of_residence || "—"}
        </div>
      )}
    </div>
  );
}

export { EMPTY as EMPTY_ADDRESS };
