import { ShieldCheck, Award, Users, Plane, MessagesSquare } from "lucide-react";

type Pillar = {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
  // TODO: thay imageUrl bằng ảnh thật khi có (giấy phép, đào tạo, xuất cảnh…)
  imageUrl?: string;
};

const PILLARS: Pillar[] = [
  {
    icon: ShieldCheck,
    title: "Giấy phép hoạt động",
    desc: "Đầy đủ giấy phép Bộ LĐ-TB&XH và Sở GD&ĐT, hoạt động minh bạch theo pháp luật Việt Nam.",
  },
  {
    icon: Award,
    title: "Đối tác trong & ngoài nước",
    desc: "Hợp tác trực tiếp với hơn 500 trường, tập đoàn và nghiệp đoàn tại Nhật, Hàn, Đài Loan, Đức, Úc…",
  },
  {
    icon: Users,
    title: "Hình ảnh đào tạo",
    desc: "Cơ sở đào tạo ngoại ngữ và định hướng nghề nghiệp bài bản, đội ngũ giảng viên chuẩn quốc tế.",
  },
  {
    icon: Plane,
    title: "Học viên & lao động xuất cảnh",
    desc: "Hàng nghìn học viên, người lao động đã xuất cảnh thành công — vững vàng nơi đất khách.",
  },
  {
    icon: MessagesSquare,
    title: "Phản hồi thực tế",
    desc: "Những chia sẻ chân thật từ học viên và gia đình sau hành trình cùng Kaizen.",
  },
];

export function TrustFoundationSection() {
  return (
    <section className="bg-[oklch(0.99_0.005_240)] py-20 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
            Uy tín & Bền vững
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            NỀN TẢNG UY TÍN{" "}
            <span className="text-gradient-brand">— ĐỒNG HÀNH BỀN VỮNG</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Mọi cam kết của Kaizen được xây dựng trên hồ sơ pháp lý minh bạch,
            mạng lưới đối tác quốc tế và hành trình thực tế của hàng nghìn học
            viên, người lao động.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <article
              key={p.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-soft transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-brand"
            >
              <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-white to-[#3F7D3A]/5">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <>
                    <p.icon
                      className="h-14 w-14 text-primary/35"
                      aria-hidden
                    />
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                      Đang cập nhật hình ảnh
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="text-[17px] font-bold tracking-tight text-foreground">
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
