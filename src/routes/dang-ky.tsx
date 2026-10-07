import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { ConsultationForm } from "@/components/consultation-form";

export const Route = createFileRoute("/dang-ky")({
  head: () => ({
    meta: [
      { title: "Đăng ký tư vấn miễn phí — KAIZEN" },
      { name: "description", content: "Để lại thông tin, chuyên viên KAIZEN sẽ liên hệ tư vấn miễn phí trong 24h." },
      { property: "og:title", content: "Đăng ký tư vấn KAIZEN" },
      { property: "og:url", content: "/dang-ky" },
    ],
    links: [{ rel: "canonical", href: "/dang-ky" }],
  }),
  component: Register,
});

function Register() {
  return (
    <PublicLayout>
      <section className="container mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Đăng ký <span className="text-gradient-brand">tư vấn miễn phí</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Chuyên viên KAIZEN sẽ liên hệ với bạn trong 24h để tư vấn lộ trình phù hợp nhất.
          </p>
        </div>
        <div className="mt-10">
          <ConsultationForm />
        </div>
      </section>
    </PublicLayout>
  );
}
