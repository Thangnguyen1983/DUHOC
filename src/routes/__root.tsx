import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/markets";
import { LanguageProvider } from "@/lib/i18n";
import { PageTranslator } from "@/lib/page-translator";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-brand">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Không tìm thấy trang</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Trang không tải được</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đã có lỗi xảy ra. Vui lòng thử lại hoặc về trang chủ.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >Thử lại</button>
          <a href="/" className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">Về trang chủ</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "KAIZEN — Du học & XKLĐ Nhật, Hàn, Đài, Châu Âu" },
      {
        name: "description",
        content:
          `KAIZEN — Tư vấn du học và xuất khẩu lao động uy tín tại Nhật Bản, Hàn Quốc, Đài Loan, CHLB Đức, Canada, Úc, Anh, Mỹ. Hotline ${COMPANY.phone}.`,
      },
      { name: "author", content: COMPANY.name },
      { property: "og:site_name", content: "KAIZEN" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "vi_VN" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "KAIZEN — Du học & Xuất khẩu lao động Nhật, Hàn, Đài Loan, Châu Âu" },
      { name: "twitter:title", content: "KAIZEN — Du học & Xuất khẩu lao động Nhật, Hàn, Đài Loan, Châu Âu" },
      { property: "og:description", content: "Đồng hành cùng học sinh, người lao động và doanh nghiệp Việt Nam trên hành trình vươn ra thế giới." },
      { name: "twitter:description", content: "Đồng hành cùng học sinh, người lao động và doanh nghiệp Việt Nam trên hành trình vươn ra thế giới." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/02d07482-e20e-4119-8c49-fd63bfa5641c/id-preview-460a0b43--d55a0e0e-033e-4778-9e2e-0898e3634a96.lovable.app-1781145094796.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/02d07482-e20e-4119-8c49-fd63bfa5641c/id-preview-460a0b43--d55a0e0e-033e-4778-9e2e-0898e3634a96.lovable.app-1781145094796.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap&subset=vietnamese",
      },

    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: COMPANY.name,
              alternateName: "KAIZEN",
              url: "https://kaizenmanpower.com",
              logo: "https://kaizenmanpower.com/logo.png",
              telephone: COMPANY.phone,
              email: COMPANY.email,
              address: { "@type": "PostalAddress", streetAddress: COMPANY.address, addressLocality: "Nghệ An", addressCountry: "VN" },
              sameAs: [COMPANY.social.facebook, COMPANY.social.tiktok, COMPANY.social.zalo].filter(Boolean),
            },
            {
              "@type": "WebSite",
              name: "Kaizen Global",
              url: "https://kaizenmanpower.com",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://kaizenmanpower.com/tin-tuc?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <PageTranslator />
        <Outlet />
        <Toaster richColors position="top-right" />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
