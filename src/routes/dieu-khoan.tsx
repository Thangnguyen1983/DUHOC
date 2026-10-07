import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageHero } from "@/components/page-hero";

export const Route = createFileRoute("/dieu-khoan")({
  head: () => ({
    meta: [
      { title: "Điều khoản sử dụng — KAIZEN" },
      {
        name: "description",
        content:
          "Điều khoản sử dụng website và dịch vụ tư vấn của KAIZEN — quyền và trách nhiệm của khách hàng.",
      },
      { property: "og:title", content: "Điều khoản sử dụng — KAIZEN" },
      {
        property: "og:description",
        content: "Quyền và trách nhiệm khi sử dụng dịch vụ Kaizen.",
      },
    ],
    links: [{ rel: "canonical", href: "/dieu-khoan" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Pháp lý"
        title="Điều khoản sử dụng"
        description="Vui lòng đọc kỹ trước khi sử dụng website và dịch vụ của Kaizen."
      />
      <article className="container mx-auto max-w-3xl px-4 py-16 space-y-4 text-foreground/85 leading-relaxed">
        <h2 className="mt-8 text-xl font-bold text-foreground">1. Phạm vi áp dụng</h2>
        <p className="text-[15px]">
          Điều khoản này áp dụng cho mọi người truy cập website kaizenmanpower.com
          và sử dụng dịch vụ tư vấn du học, xuất khẩu lao động, ngoại ngữ của
          Kaizen.
        </p>
        <h2 className="mt-8 text-xl font-bold text-foreground">2. Quyền sở hữu trí tuệ</h2>
        <p className="text-[15px]">
          Toàn bộ nội dung, hình ảnh, logo trên website thuộc bản quyền của
          Kaizen. Vui lòng không sao chép vì mục đích thương mại khi chưa có sự
          đồng ý.
        </p>
        <h2 className="mt-8 text-xl font-bold text-foreground">3. Trách nhiệm của khách hàng</h2>
        <p className="text-[15px]">
          Khách hàng cam kết cung cấp thông tin chính xác và chịu trách nhiệm về
          hồ sơ cá nhân khi đăng ký tư vấn.
        </p>
        <h2 className="mt-8 text-xl font-bold text-foreground">4. Giới hạn trách nhiệm</h2>
        <p className="text-[15px]">
          Kaizen nỗ lực đảm bảo thông tin chính xác nhưng không chịu trách nhiệm
          cho thay đổi chính sách từ phía cơ quan quản lý nước ngoài nằm ngoài
          tầm kiểm soát.
        </p>
        <p className="text-sm text-muted-foreground">
          Cập nhật lần cuối: {new Date().getFullYear()}.
        </p>
      </article>
    </PublicLayout>
  );
}
