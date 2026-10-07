import { createFileRoute } from "@tanstack/react-router";
import { MaterialsManager } from "@/components/training/materials-manager";

export const Route = createFileRoute("/_authenticated/admin/materials")({ component: () => <MaterialsManager /> });
