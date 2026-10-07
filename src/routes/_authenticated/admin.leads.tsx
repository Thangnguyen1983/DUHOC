import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsInbox } from "@/components/leads/leads-inbox";
import { LeadsQueue } from "@/components/leads/leads-queue";

type LeadsSearch = { tab?: "inbox" | "queue" };

export const Route = createFileRoute("/_authenticated/admin/leads")({
  validateSearch: (search: Record<string, unknown>): LeadsSearch => ({
    tab: search.tab === "queue" ? "queue" : "inbox",
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Khách hàng tiềm năng (Lead)</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý đăng ký tư vấn và phân phối lead cho đội telesales trong cùng một module.
        </p>
      </div>

      <Tabs
        value={tab ?? "inbox"}
        onValueChange={(v) =>
          navigate({ to: "/admin/leads", search: { tab: v as LeadsSearch["tab"] }, replace: true })
        }
      >
        <TabsList>
          <TabsTrigger value="inbox">Danh sách đăng ký</TabsTrigger>
          <TabsTrigger value="queue">Phân phối &amp; Sales</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-4">
          <LeadsInbox />
        </TabsContent>
        <TabsContent value="queue" className="mt-4">
          <LeadsQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
}
