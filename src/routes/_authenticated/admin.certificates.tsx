import { createFileRoute } from "@tanstack/react-router";
import { CertificatesManager } from "@/components/training/certificates-manager";

export const Route = createFileRoute("/_authenticated/admin/certificates")({ component: () => <CertificatesManager /> });
