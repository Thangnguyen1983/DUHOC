import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOperationalSignatories, saveOperationalSignatories } from "@/lib/operational-signatories.functions";
import { errorMessage } from "@/lib/errors";

type Person = { id: string; full_name: string; email: string };
export function OperationalSignatories({ people }: { people: Person[] }) {
  const qc = useQueryClient();
  const get = useServerFn(getOperationalSignatories);
  const save = useServerFn(saveOperationalSignatories);
  const { data } = useQuery({ queryKey: ["operational-signatories"], queryFn: () => get() });
  const [approver, setApprover] = useState("none");
  const [signer, setSigner] = useState("none");
  useEffect(() => {
    if (!data) return;
    setApprover(data.orientation_approver_user_id ?? "none");
    setSigner(data.handover_signer_user_id ?? "none");
  }, [data]);
  const mutation = useMutation({
    mutationFn: () => save({ data: { orientation_approver_user_id: approver === "none" ? null : approver, handover_signer_user_id: signer === "none" ? null : signer } }),
    onSuccess: () => { toast.success("Đã lưu người phụ trách"); qc.invalidateQueries({ queryKey: ["operational-signatories"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return <section className="space-y-4 border-t pt-6">
    <h2 className="text-lg font-semibold">Người phụ trách nghiệp vụ</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      {([ ["Người duyệt ngoại lệ Giáo dục định hướng", approver, setApprover], ["Người ký biên bản bàn giao", signer, setSigner] ] as const).map(([label, value, change]) =>
        <div key={label} className="space-y-2 min-w-0"><Label>{label}</Label><Select value={value} onValueChange={change}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Chưa chỉ định</SelectItem>{people.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}</SelectContent></Select></div>
      )}
    </div>
    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !data}>Lưu người phụ trách</Button>
  </section>;
}