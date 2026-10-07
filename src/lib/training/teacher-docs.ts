export const TEACHER_DOC_TYPES = [
  { value: "cv", label: "CV / Sơ yếu lý lịch" },
  { value: "degree", label: "Bằng cấp" },
  { value: "certificate", label: "Chứng chỉ chuyên môn" },
  { value: "other", label: "Tài liệu khác" },
] as const;

export function teacherDocTypeLabel(v: string) {
  return TEACHER_DOC_TYPES.find((t) => t.value === v)?.label ?? v;
}
