import { createFileRoute } from "@tanstack/react-router";
import { CertificatesManager } from "@/components/training/certificates-manager";
import { useMyAccess } from "@/lib/rbac/use-access";
import { isPortalStaff } from "@/lib/rbac/catalog";

export const Route = createFileRoute("/giang-day/chung-chi")({ component: Page });

function Page() {
  const { access } = useMyAccess();
  const staff = isPortalStaff(access?.roles ?? []);
  return <CertificatesManager canIssue={staff} />;
}
