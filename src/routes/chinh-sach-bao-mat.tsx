import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageHero } from "@/components/page-hero";

export const Route = createFileRoute("/chinh-sach-bao-mat")({
  head: () => ({
    meta: [
      { title: "Chính sách bảo mật — KAIZEN" },
      {
        name: "description",
        content:
          "Chính sách bảo mật thông tin của KAIZEN — cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn.",
      },
      { property: "og:title", content: "Chính sách bảo mật — KAIZEN" },
      {
        property: "og:description",
        content: "Cam kết bảo mật dữ liệu cá nhân của khách hàng Kaizen.",
      },
    ],
    links: [{ rel: "canonical", href: "/chinh-sach-bao-mat" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Pháp lý"
        title="Chính sách bảo mật"
        description="Kaizen cam kết bảo vệ thông tin cá nhân của khách hàng theo quy định pháp luật Việt Nam."
      />
      <article className="container mx-auto max-w-3xl px-4 py-16 space-y-4 text-foreground/85 leading-relaxed">
        <h2 className="mt-8 text-xl font-bold text-foreground">1. Thông tin chúng tôi thu thập</h2>
        <p className="text-[15px]">
          Kaizen thu thập các thông tin bạn cung cấp khi đăng ký tư vấn: họ tên,
          số điện thoại, email, nhu cầu du học hoặc lao động.
        </p>
        <h2 className="mt-8 text-xl font-bold text-foreground">2. Mục đích sử dụng</h2>
        <p className="text-[15px]">
          Thông tin được sử dụng để tư vấn, gửi tài liệu, cập nhật chương trình
          phù hợp và liên lạc trong quá trình hỗ trợ hồ sơ.
        </p>
        <h2 className="mt-8 text-xl font-bold text-foreground">3. Bảo mật và chia sẻ</h2>
        <p className="text-[15px]">
          Kaizen không chia sẻ thông tin cá nhân của bạn cho bên thứ ba ngoài
          đối tác trực tiếp phục vụ hồ sơ của bạn (trường, nghiệp đoàn, đại sứ
          quán) khi có sự đồng ý.
        </p>
        <h2 className="mt-8 text-xl font-bold text-foreground">4. Quyền của khách hàng</h2>
        <p className="text-[15px]">
          Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xoá dữ liệu cá nhân bằng
          cách liên hệ hotline hoặc email được công bố trên website.
        </p>
        <p className="text-sm text-muted-foreground">
          Cập nhật lần cuối: {new Date().getFullYear()}.
        </p>
      </article>
    </PublicLayout>
  );
}
