import type { Permission } from "@/lib/rbac/permissions";

export type GuideSection = {
  id: string;
  title: string;
  intro?: string;
  steps?: string[];
  rules?: string[];
  issues?: Array<{ problem: string; fix: string }>;
};

export type Guide = {
  slug: string;
  title: string;
  department: string;
  summary: string;
  /** Người có BẤT KỲ quyền nào trong danh sách sẽ thấy bài này ở chế độ "liên quan tới tôi". */
  permissions: Permission[];
  /** Các tiền tố đường dẫn admin liên quan — dùng cho nút trợ giúp theo trang. */
  paths: string[];
  links: Array<{ label: string; to: string }>;
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  {
    slug: "quan-tri-nhan-su",
    title: "Quản trị nhân sự, chấm công, lương & Cổng CTV",
    department: "Hành chính nhân sự / Ban Giám đốc",
    summary: "Danh sách nhân sự theo phòng ban, hợp đồng lao động, nghỉ phép, chấm công, KPI, bảng lương và cổng tự phục vụ cho nhân viên, cộng tác viên.",
    permissions: ["hr.view", "hr.manage", "leave.approve", "payroll.view", "payroll.manage", "ctv.portal", "dashboard.view"],
    paths: ["/admin/nhan-su", "/admin/ca-nhan", "/admin/ctv"],
    links: [
      { label: "Quản trị nhân sự", to: "/admin/nhan-su" },
      { label: "Nhân sự của tôi", to: "/admin/ca-nhan" },
      { label: "Cổng cộng tác viên", to: "/admin/ctv" },
    ],
    sections: [
      {
        id: "nhan-vien",
        title: "Nhân viên: chấm công & xin nghỉ",
        steps: [
          "Mở menu Nhân sự của tôi.",
          "Đầu giờ bấm Vào ca, cuối giờ bấm Ra ca (vào sau 08:15 ghi là đi muộn).",
          "Xin nghỉ: chọn loại nghỉ, ngày, số ngày, ghi lý do rồi bấm Gửi đơn. Đơn chờ trưởng phòng duyệt.",
          "Phiếu lương hiện sau khi Ban Giám đốc duyệt và khoá bảng lương tháng.",
        ],
      },
      {
        id: "nhan-su",
        title: "Phòng Nhân sự: hợp đồng, chấm công, KPI",
        steps: [
          "Quản trị nhân sự → thẻ Nhân sự: lọc theo phòng ban, bấm Hồ sơ để gán phòng ban, chức danh, phạm vi.",
          "Thẻ Hợp đồng: thêm hợp đồng (số HĐ, loại, thời hạn, lương cơ bản, phụ cấp). Hợp đồng còn ≤30 ngày được cảnh báo đỏ.",
          "Thẻ Chấm công: xem tổng công tháng, sửa ngày công (bắt buộc ghi lý do), xuất bảng công.",
          "Thẻ KPI: giao chỉ tiêu tháng; chỉ tiêu 'Tự lấy: khách đã chốt' tự đếm từ Lead.",
        ],
        rules: ["Trưởng phòng chỉ thấy nhân sự thuộc phòng mình phụ trách.", "Không tự duyệt đơn nghỉ của chính mình."],
      },
      {
        id: "luong",
        title: "Lương: tính, chỉnh, duyệt & khoá",
        steps: [
          "Thẻ Lương → chọn tháng → Tính lương tháng (lấy lương từ hợp đồng hiệu lực, công từ chấm công + nghỉ có lương, thưởng từ KPI đạt).",
          "Bảo hiểm và thuế TNCN tự tính theo thẻ Cấu hình (nếu bật). Bấm biểu tượng sửa để nhập số người phụ thuộc, thưởng khác, khấu trừ.",
          "Ban Giám đốc bấm Duyệt & khoá. Sau khi khoá không sửa được; nhân viên thấy phiếu lương của mình.",
        ],
      },
      {
        id: "cau-hinh",
        title: "Cấu hình: phép năm, giờ muộn, công chuẩn, bảo hiểm, thuế, cách chấm công",
        steps: [
          "Thẻ Cấu hình → sửa số ngày phép năm, giờ tính đi muộn, số ngày công chuẩn.",
          "Nhập tỷ lệ BHXH/BHYT/BHTN, mức trần, giảm trừ gia cảnh và biểu thuế; dùng ô Thử tính để kiểm tra.",
          "Bật cách chấm công: Định vị (thêm vị trí văn phòng + bán kính), Wifi (thêm địa chỉ mạng văn phòng), QR (mở màn hình QR ở cửa văn phòng), Hình ảnh (chụp ảnh khi chấm).",
          "Bấm Lưu cấu hình. Áp dụng ngay cho lần chấm công và lần tính lương tiếp theo.",
        ],
      },
      {
        id: "ctv",
        title: "Cộng tác viên: giới thiệu ứng viên",
        steps: [
          "CTV đăng nhập, mở Cổng cộng tác viên.",
          "Thẻ Giới thiệu: nhập họ tên, số điện thoại, chương trình, thị trường → Gửi ứng viên. Ứng viên vào hàng Lead.",
          "Thẻ Ứng viên: xem tiến độ. Thẻ Hoa hồng: xem từng khoản và trạng thái chi trả.",
        ],
        rules: ["Tài khoản CTV cần được cấp mã KZ-CTV (gắn với tài khoản trong hàng phân lead)."],
      },
    ],
  },
  {
    slug: "ho-so-can-bo-phong-ban",
    title: "Hồ sơ cán bộ & phạm vi phòng ban",
    department: "Hành chính nhân sự / Quản trị hệ thống",
    summary:
      "Khai báo thông tin cán bộ nhân viên và phân công phòng ban phụ trách theo ba mức quyền: chỉ đọc, gửi báo cáo, toàn quyền.",
    permissions: ["staff.view", "staff.manage", "users.manage"],
    paths: ["/admin/users", "/admin/danh-muc"],
    links: [
      { label: "Tài khoản & phân quyền", to: "/admin/users" },
      { label: "Danh mục phòng ban", to: "/admin/danh-muc" },
    ],
    sections: [
      {
        id: "khai-bao-can-bo",
        title: "Khai báo hồ sơ cán bộ",
        steps: [
          "Mở Tài khoản & phân quyền, tìm tài khoản cần khai báo.",
          "Bấm nút ba chấm ở cuối dòng, chọn Hồ sơ cán bộ & phòng ban.",
          "Nhập căn cước, ngày sinh, điện thoại, trình độ và chứng chỉ nghiệp vụ du học hoặc xuất khẩu lao động.",
          "Chọn phòng ban chính và chức danh, sau đó bấm Lưu hồ sơ.",
           "Mã nhân sự KZ-NV được cấp tự động khi lưu lần đầu, không có tiền tố chi nhánh; mã không thay đổi khi cập nhật hồ sơ.",
        ],
      },
      {
        id: "phan-cong-phong-ban",
        title: "Phân công phạm vi phòng ban",
        intro: "Một cán bộ có thể phụ trách nhiều phòng ban với mức quyền khác nhau.",
        rules: [
          "Chỉ đọc: chỉ xem hồ sơ và số liệu của phòng ban đó.",
          "Gửi báo cáo: được nạp danh sách và gửi báo cáo tháng của phòng ban.",
          "Toàn quyền: được duyệt, đối chiếu và khóa sổ hồ sơ của phòng ban.",
        ],
        steps: [
          "Trong cùng cửa sổ hồ sơ cán bộ, chọn phòng ban ở khung phía dưới.",
          "Chọn mức quyền tương ứng rồi bấm Thêm.",
          "Bấm biểu tượng thùng rác để gỡ một phân công không còn đúng.",
           "Ban Giám đốc xem toàn bộ; bộ phận hỗ trợ chỉ xem phòng ban được phân công. Chỉ ẩn menu không thay thế kiểm tra quyền truy cập dữ liệu.",
        ],
      },
      {
        id: "danh-muc-phong-ban",
        title: "Danh mục 17 phòng ban",
        rules: [
          "Mỗi phòng ban có loại hình nghiệp vụ: du học, xuất khẩu lao động, đào tạo hoặc hỗ trợ.",
          "Phòng ban theo thị trường cần điền mã thị trường để lọc báo cáo đúng.",
          "Sửa danh mục tại Danh mục hệ thống, thẻ Cơ cấu tổ chức.",
        ],
      },
    ],
  },

  {
    slug: "nhat-ky-trach-nhiem",
    title: "Nhật ký & trách nhiệm hồ sơ học viên",
    department: "Vận hành hồ sơ / Thanh tra nội bộ",
    summary:
      "Xem ai đã xử lý hồ sơ nào, làm gì, lúc nào — từ lúc còn là khách hàng tiềm năng đến khi kết thúc; bàn giao phụ trách có ghi vết.",
    permissions: ["students.view", "students.manage"],
    paths: ["/admin/tra-soat", "/admin/students"],
    links: [
      { label: "Tra soát trách nhiệm", to: "/admin/tra-soat" },
      { label: "Hồ sơ học viên", to: "/admin/students" },
    ],
    sections: [
      {
        id: "xem-nhat-ky",
        title: "Xem nhật ký của một học viên",
        steps: [
          "Mở Hồ sơ học viên, chọn học viên cần xem.",
          "Chọn thẻ 'Nhật ký & trách nhiệm'.",
          "Dòng thời gian hiển thị đầy đủ: tạo hồ sơ, sửa thông tin, giấy tờ, checklist, chuyển bước quy trình, ghi danh lớp, kho hồ sơ giấy, lượt xuất hồ sơ 360°.",
          "Có thể lọc theo người xử lý, loại việc và khoảng thời gian.",
        ],
        rules: [
          "Mỗi dòng ghi rõ tên và vai trò người xử lý; việc do máy tự chạy ghi là 'Hệ thống (tự động)'.",
          "Nhật ký chỉ ghi thêm, không sửa và không xoá được.",
        ],
      },
      {
        id: "ban-giao",
        title: "Bàn giao người phụ trách",
        steps: [
          "Trong thẻ 'Nhật ký & trách nhiệm', bấm 'Bàn giao phụ trách'.",
          "Chọn nhân sự nhận việc và nhập lý do bàn giao (bắt buộc).",
          "Xác nhận — người nhận sẽ được thông báo, và việc bàn giao được ghi vào nhật ký.",
        ],
      },
      {
        id: "tra-soat",
        title: "Tra soát toàn hệ thống",
        steps: [
          "Mở Vận hành & Đào tạo › Tra soát trách nhiệm.",
          "Lọc theo mã/tên học viên, loại việc, khoảng thời gian.",
          "Phần thẻ phía trên tổng hợp số thao tác theo từng nhân sự.",
        ],
        rules: [
          "Xuất hồ sơ 360° đã bao gồm mục 'Nhật ký trách nhiệm' theo thứ tự thời gian, dùng được cho thanh tra.",
        ],
      },
    ],
  },

  {
    slug: "kho-luu-tru-ho-so",
    title: "Kho lưu trữ hồ sơ vật lý",
    department: "Vận hành hồ sơ / Lưu trữ",
    summary:
      "Ghi nhận vị trí cất giữ hồ sơ giấy ngoài đời thực, tra cứu nhanh khi cần rút hồ sơ, theo dõi mượn – trả.",
    permissions: ["students.view", "students.manage"],
    paths: ["/admin/luu-tru", "/admin/students"],
    links: [
      { label: "Kho lưu trữ hồ sơ", to: "/admin/luu-tru" },
      { label: "Hồ sơ học viên", to: "/admin/students" },
    ],
    sections: [
      {
        id: "khai-bao-vi-tri",
        title: "Bước 1 — Khai báo vị trí kho",
        intro:
          "Vị trí mô tả đúng thực tế: kho · phòng · tủ · kệ · hộp. Mã vị trí nên in và dán lên hộp/ngăn tủ.",
        steps: [
          "Vào /admin/luu-tru → tab Vị trí kho → Thêm vị trí kho.",
          "Nhập Mã vị trí (VD: K1-P2-T3-KE1-H05), tên gợi nhớ và các cấp kho/phòng/tủ/kệ/hộp.",
          "Nhập sức chứa để biết hộp còn chỗ hay đã đầy (cột Đang chứa so với Sức chứa).",
        ],
      },
      {
        id: "nhap-kho",
        title: "Bước 2 — Nhập hồ sơ giấy vào kho",
        steps: [
          "Mở hồ sơ học viên → tab Kho lưu trữ → Nhập kho hồ sơ (đã tự gắn đúng học viên).",
          "Nếu nhập từ /admin/luu-tru: gõ mã học viên (KZ…), họ tên hoặc số điện thoại vào ô Học viên rồi chọn đúng người trong danh sách gợi ý.",
          "Nhập tên tài liệu, loại giấy tờ, mã phiếu/tem dán, chọn vị trí kho, số lượng, tình trạng bản gốc/bản sao.",
          "Lưu — hệ thống tự ghi nhật ký nhập kho kèm người thực hiện.",
          "Sau khi lưu, bấm biểu tượng máy in bên cạnh phiếu để xem trước tem 100 × 50 mm và bảng kiểm A4 lấy từ hồ sơ hiện có; kiểm tra mã học viên, vị trí kho, giấy tờ rồi in.",
        ],
        rules: [
          "Mã phiếu là duy nhất toàn hệ thống, nên dán trực tiếp lên bìa hồ sơ.",
          "Mỗi phiếu chỉ thuộc về một học viên; không gộp nhiều học viên vào một phiếu.",
          "Chỉ người được phép xem hồ sơ mới mở được bản in; mã QR dẫn về trang hồ sơ nội bộ và vẫn yêu cầu đăng nhập.",
          "Không gõ tay mã hồ sơ: phải chọn học viên từ danh sách gợi ý, nếu chưa chọn hệ thống sẽ nhắc “Vui lòng chọn học viên từ danh sách gợi ý”.",
          "Mọi cảnh báo lỗi trong hệ thống nay hiển thị bằng tiếng Việt dễ hiểu; nếu gặp câu “Không thực hiện được… (mã tham chiếu XXXXX)”, gửi mã đó cho quản trị để tra nhật ký.",
        ],
      },
      {
        id: "tra-cuu",
        title: "Bước 3 — Tra cứu và rút hồ sơ",
        steps: [
          "Vào /admin/luu-tru → tab Tra cứu hồ sơ.",
          "Gõ mã học viên, họ tên, số điện thoại, mã phiếu hoặc tên tài liệu rồi Enter.",
          "Xem cột Vị trí kho để tới đúng tủ/kệ/hộp lấy hồ sơ.",
          "Bấm Mượn để ghi người mượn và hạn trả; khi nhận lại bấm Trả kho.",
        ],
      },
      {
        id: "thanh-tra",
        title: "Đối chiếu khi thanh tra",
        rules: [
          "Bản Xuất hồ sơ 360° có mục 14 liệt kê toàn bộ phiếu lưu trữ vật lý và vị trí kho tương ứng.",
          "Mọi thao tác nhập kho, chuyển vị trí, mượn, trả, rút hồ sơ đều được ghi nhật ký kèm người thực hiện.",
        ],
      },
    ],
  },

  {
    slug: "bat-dau",
    title: "Bắt đầu nhanh",
    department: "Tất cả bộ phận",
    summary: "Đăng nhập, hiểu vai trò – quyền, bố cục màn hình và các quy tắc dữ liệu bắt buộc.",
    permissions: ["dashboard.view"],
    paths: ["/admin"],
    links: [
      { label: "Dashboard", to: "/admin" },
      { label: "Tài khoản & Quyền", to: "/admin/users" },
    ],
    sections: [
      {
        id: "dang-nhap",
        title: "Đăng nhập và vai trò",
        intro:
          "Mỗi người dùng chỉ nhìn thấy các mục mình được cấp quyền. Nếu thiếu mục nào trên thanh bên, nghĩa là vai trò của bạn chưa có quyền đó.",
        steps: [
          "Đăng nhập tại /auth bằng email công ty đã được cấp.",
          "Xem vai trò hiện tại ở góc dưới thanh bên (dưới email của bạn).",
          "Thiếu quyền → liên hệ quản trị viên, không tự tạo tài khoản mới.",
        ],
      },
      {
        id: "chuyen-cong",
        title: "Chuyển nhanh giữa các cổng",
        intro: "Menu tài khoản cho phép mở nhanh Cổng quản trị, Cổng giáo viên và Cổng học viên mà không cần đăng xuất.",
        steps: [
          "Mở menu tài khoản ở cuối thanh bên; trên điện thoại, bấm biểu tượng tài khoản ở góc trên.",
          "Chọn cổng có quyền thật để làm việc với dữ liệu hiện tại của tài khoản.",
          "Quản trị viên có thể chọn Xem thử vai trò Giáo viên hoặc Học viên để kiểm tra giao diện bằng dữ liệu mẫu.",
          "Trong chế độ xem thử, dùng nút Quay lại Cổng quản trị trên dải cảnh báo để kết thúc.",
        ],
        rules: [
          "Xem thử luôn ở chế độ chỉ đọc, không thay đổi dữ liệu thật và không tự cấp thêm vai trò.",
          "Dải cảnh báo màu vàng luôn xuất hiện khi đang xem dữ liệu mẫu.",
          "Nếu một cổng không hiện trong menu, tài khoản chưa có quyền thật để mở cổng đó.",
        ],
      },
      {
        id: "bo-cuc",
        title: "Bố cục màn hình",
        steps: [
          "Thanh bên trái: điều hướng theo nhóm chức năng (Nội dung, Đào tạo, E-learning, Hệ thống...).",
          "Thanh trên: chuông thông báo (việc được giao, hồ sơ đổi trạng thái) và nút Hướng dẫn.",
          "Khu vực giữa: nội dung màn hình đang làm việc.",
        ],
      },
      {
        id: "dashboard-tong-quan",
        title: "Đọc Dashboard tổng quan (/admin)",
        intro:
          "Trang /admin là tầng tổng quan toàn hệ thống. Muốn đi sâu khối vận hành – đào tạo, mở trang Vận hành & Đào tạo (/admin/van-hanh).",
        steps: [
          "6 thẻ số lớn: Đăng ký mới, Hồ sơ học viên, Đang đào tạo, Đang xử lý visa, Bài đã xuất bản, Đơn khoá học — bấm vào thẻ để sang trang chi tiết.",
          "Khối 'Việc cần xử lý': lead chưa liên hệ, hồ sơ bắt buộc quá hạn, hợp đồng hết hạn trong 90 ngày, hàng đợi cấp tài khoản Portal. Ô màu đỏ/cam là việc phải xử lý ngay.",
          "Biểu đồ 'Lead 30 ngày' xem xu hướng đăng ký; các biểu đồ tròn xem nguồn lead, chương trình, hồ sơ visa.",
          "Ba bảng danh sách: đăng ký gần đây, lớp đang mở, nội dung mới cập nhật.",
          "Lưới 'Truy cập nhanh' chỉ hiện các module bạn có quyền.",
          "Nút Làm mới tải lại toàn bộ số liệu; thời điểm cập nhật hiển thị dưới tiêu đề.",
        ],
        rules: [
          "Số liệu lấy trực tiếp từ dữ liệu thật, không nhập tay.",
          "Dashboard (/admin) và Vận hành & Đào tạo (/admin/van-hanh) tự cập nhật: khi có thay đổi ở hồ sơ học viên, lớp học, điểm danh, đơn khoá học hay bài viết, số liệu tự làm mới sau vài giây; ngoài ra tự tải lại mỗi phút và khi bạn quay lại tab.",
          "Nếu một khối hiện dấu '—' nghĩa là tài khoản của bạn chưa có quyền xem dữ liệu đó.",
        ],
      },
      {
        id: "quy-tac",
        title: "Quy tắc dữ liệu bắt buộc",
        rules: [
          "Không tạo trùng hồ sơ học viên — luôn tìm theo số điện thoại/CCCD trước khi tạo mới.",
          "Mỗi học viên chỉ gắn với đúng một tài khoản đăng nhập (khoá định danh).",
          "Không xoá dữ liệu vận hành; hãy đổi trạng thái để giữ lịch sử.",
          "Mọi liên kết quảng cáo phải gắn UTM để đo được nguồn lead.",
        ],
      },
    ],
  },

  {
    slug: "marketing-cms",
    title: "Marketing & Nội dung (CMS)",
    department: "Marketing / Nội dung / SEO",
    summary: "Viết bài chuẩn SEO, chèn ảnh – video, banner, popup, chương trình hot và chiến dịch có UTM.",
    permissions: ["cms.view", "cms.edit", "cms.publish", "cms.seo", "media.manage", "banners.manage", "journey.manage"],
    paths: [
      "/admin/cms",
      "/admin/posts",
      "/admin/posts-hub",
      "/admin/banners",
      "/admin/page-banners",
      "/admin/logo",
      "/admin/hot-programs",
      "/admin/popups",
      "/admin/hanh-trinh",
      "/admin/marketing/campaigns",
    ],
    links: [
      { label: "CMS tập trung", to: "/admin/cms" },
      { label: "Thư viện Media", to: "/admin/cms/media" },
      { label: "Banner trang chủ", to: "/admin/banners" },
      { label: "Banner các trang", to: "/admin/page-banners" },
      { label: "Chương trình hot", to: "/admin/hot-programs" },
      { label: "Popup trang chủ", to: "/admin/popups" },
      { label: "Chiến dịch marketing", to: "/admin/marketing/campaigns" },
    ],
    sections: [
      {
        id: "viet-bai",
        title: "Viết bài mới trong CMS",
        steps: [
          "Vào CMS tập trung → chọn loại nội dung (bài viết, câu chuyện học viên, trang trường...) → Tạo mới.",
          "Nhập tiêu đề. Slug tự sinh theo tiêu đề — chỉ sửa slug khi bài chưa xuất bản.",
          "Dùng Trợ lý viết bài (AI) để tạo dàn ý và nội dung nháp, sau đó biên tập lại theo dữ liệu thật của Kaizen.",
          "Chèn ảnh/video bằng thanh công cụ; ảnh lấy từ Thư viện Media để có đường dẫn ổn định.",
          "Kiểm tra khối SEO: tiêu đề dưới 60 ký tự, mô tả dưới 160 ký tự, ảnh đại diện bắt buộc.",
          "Xem trước → Lưu nháp → Gửi duyệt hoặc Xuất bản (tuỳ quyền).",
        ],
        rules: [
          "Mỗi bài chỉ có một tiêu đề H1; các mục con dùng H2/H3.",
          "Ảnh phải có chú thích và mô tả thay thế (alt) bằng tiếng Việt có dấu.",
          "Không dán chữ IN HOA cả đoạn và không dùng emoji thay dấu đầu dòng.",
        ],
        issues: [
          { problem: "Ảnh không hiện ngoài trang công khai", fix: "Chèn lại ảnh từ Thư viện Media thay vì dán link tạm từ nơi khác." },
          { problem: "Bài hiển thị dính liền một khối", fix: "Kiểm tra định dạng Markdown: mỗi đoạn cách nhau một dòng trống." },
        ],
      },
      {
        id: "banner",
        title: "Banner, popup và chương trình hot",
        steps: [
          "Banner trang chủ: quản lý slide, thứ tự, thời gian hiển thị.",
          "Banner các trang: chọn preset của từng trang (du học, XKLĐ, ngoại ngữ...). Chưa cấu hình thì trang dùng ảnh mặc định trong mã nguồn.",
          "Chương trình hot: nội dung chạy ngang trên trang chủ, đặt hạn hiển thị theo đợt tuyển sinh.",
          "Popup: đặt độ ưu tiên và lịch chạy; nhiều popup cùng lúc thì popup ưu tiên cao hơn hiển thị trước.",
        ],
        rules: ["Ảnh banner theo tỷ lệ 16:9, chữ trên ảnh phải đọc rõ trên nền sáng lẫn nền tối."],
      },
      {
        id: "chien-dich",
        title: "Chiến dịch marketing & UTM",
        steps: [
          "Tạo chiến dịch: tên, thị trường, kênh, thời gian, ngân sách.",
          "Sao chép liên kết có UTM của chiến dịch để chạy quảng cáo.",
          "Theo dõi số lead và chi phí mỗi lead trong bảng báo cáo chiến dịch.",
        ],
        rules: ["Không sửa mã UTM của chiến dịch đang chạy — sẽ mất liên kết với lead đã ghi nhận."],
      },
    ],
  },

  {
    slug: "telesales-lead",
    title: "Telesales & Lead",
    department: "Telesales / Kinh doanh",
    summary: "Nhận khách từ hàng đợi, khoá lead, chăm sóc, chốt khách và theo dõi KPI.",
    permissions: ["leads.view", "leads.manage"],
    paths: ["/admin/leads"],
    links: [
      { label: "Danh sách đăng ký", to: "/admin/leads" },
      { label: "Phân phối & Sales", to: "/admin/leads/queue" },
    ],
    sections: [
      {
        id: "luong-lead",
        title: "Lead vào hệ thống từ đâu",
        intro:
          "Lead đến từ biểu mẫu đăng ký trên website, chatbot và các liên kết quảng cáo có UTM. Tất cả tập trung ở tab Danh sách đăng ký.",
      },
      {
        id: "loc-va-thao-tac",
        title: "Lọc danh sách, ẩn và xoá lead",
        steps: [
          "Dùng dãy nút lọc phía trên bảng: Chờ tiếp nhận, Tất cả, Mới, Đã liên hệ, Tiềm năng, Hoàn tất, Đã ẩn — mỗi nút kèm số lượng.",
          "Mặc định hệ thống mở bộ lọc 'Chờ tiếp nhận'; các lead này luôn được xếp lên đầu và tô nền nhạt.",
          "Ô tìm kiếm tìm theo tên, số điện thoại, email, thị trường hoặc chương trình.",
          "Cột Thao tác: chọn 'Ẩn khỏi danh sách' để cất lead trùng/rác (xem lại ở bộ lọc Đã ẩn, có thể Bỏ ẩn), hoặc 'Xoá' để xoá vĩnh viễn.",
        ],
        rules: [
          "Lead đã sinh hồ sơ học viên không xoá được — chỉ được ẩn, để giữ nguyên dữ liệu hồ sơ.",
        ],
      },

      {
        id: "nhan-khach",
        title: "Nhận khách và xử lý",
        steps: [
          "Vào tab Phân phối & Sales để xem hàng đợi.",
          "Bấm Nhận khách — lead sẽ bị khoá cho riêng bạn, người khác không thao tác được.",
          "Gọi và cập nhật trạng thái ngay sau cuộc gọi, ghi rõ nội dung trao đổi.",
          "Không liên hệ được: đặt lịch gọi lại, không để trống trạng thái.",
          "Chốt khách: chuyển thành hồ sơ học viên, điền thị trường và chương trình mong muốn.",
        ],
        rules: [
          "Quá thời gian quy định mà không cập nhật, lead tự chuyển sang sales khác.",
          "Không tự ý gán lead của người khác cho mình — mọi thao tác đều được ghi nhật ký.",
        ],
      },
      {
        id: "kpi",
        title: "Đọc bảng KPI telesales",
        intro:
          "Tab KPI telesales hiển thị số lead nhận, số chốt, tỷ lệ chuyển đổi và thời gian phản hồi trung bình theo từng sales.",
        rules: ["Thời gian phản hồi tính từ lúc nhận khách tới lần cập nhật trạng thái đầu tiên."],
      },
       {
         id: "ma-cong-tac-vien",
         title: "Mã định danh cộng tác viên",
         steps: ["Trong tab Phân phối & Sales, người quản lý xem mã KZ-CTV ngay bên dưới tên người trong hàng đợi."],
         rules: ["Mã được cấp tự động, duy nhất khi thêm vào hàng đợi; không có tiền tố chi nhánh và không đổi khi cập nhật."],
       },
    ],
  },

  {
    slug: "tu-van-cskh",
    title: "Tư vấn & CSKH",
    department: "Tư vấn / Chăm sóc khách hàng",
    summary: "Theo dõi học viên mình phụ trách, ghi chú tương tác và xử lý thông báo tự động.",
    permissions: ["students.view", "students.manage", "leads.view"],
    paths: ["/admin/students"],
    links: [
      { label: "Hồ sơ học viên", to: "/admin/students" },
      { label: "Lead", to: "/admin/leads" },
    ],
    sections: [
      {
        id: "phu-trach",
        title: "Danh sách học viên phụ trách",
        steps: [
          "Vào Hồ sơ học viên → lọc theo người phụ trách là bạn.",
          "Mở hồ sơ để xem tiến độ học tập, hồ sơ giấy tờ và trạng thái visa.",
          "Ghi chú mỗi lần liên hệ: nội dung, cam kết của học viên, việc cần làm tiếp.",
        ],
      },
      {
        id: "thong-bao",
        title: "Thông báo tự động",
        intro:
          "Khi học viên bạn phụ trách đổi trạng thái (hồ sơ, học tập, visa, xuất cảnh), chuông thông báo trên thanh trên sẽ báo.",
        rules: ["Xử lý thông báo trong ngày; thông báo đã đọc vẫn lưu lại để đối chiếu."],
      },
    ],
  },

  {
    slug: "trung-tam-bao-cao",
    title: "Trung tâm báo cáo",
    department: "Toàn hệ thống",
    summary:
      "Nơi xem chi tiết dữ liệu thực của mọi mảng: học viên, hồ sơ, visa, xuất cảnh, lead, đào tạo, doanh thu, lưu trữ và tra soát. Có lọc thời gian, tải Excel/CSV và in.",
    permissions: ["report.view", "report.export"],
    paths: ["/admin/bao-cao"],
    links: [
      { label: "Trung tâm báo cáo", to: "/admin/bao-cao" },
      { label: "Tổng quan khối", to: "/admin/van-hanh" },
    ],
    sections: [
      {
        id: "cach-dung",
        title: "Cách sử dụng",
        steps: [
          "Vào menu Báo cáo → Trung tâm báo cáo.",
          "Chọn báo cáo ở cột trái (chỉ hiển thị báo cáo bạn được cấp quyền).",
          "Lọc theo Từ ngày / Đến ngày, chọn Hạng mục hoặc gõ từ khoá để tìm nhanh.",
          "Bấm Excel đầy đủ để tải file có 2 sheet: Tổng hợp và Chi tiết theo nhận diện Kaizen.",
          "Bấm CSV để lấy nhanh bảng đang xem, hoặc In báo cáo để in đúng phần nội dung.",
        ],
      },
      {
        id: "luu-y",
        title: "Lưu ý",
        steps: [
          "Trung tâm báo cáo chỉ đọc dữ liệu sẵn có, không tạo hay sửa hồ sơ.",
          "Bảng trên màn hình hiển thị tối đa 2.000 dòng; muốn đầy đủ hãy tải Excel.",
          "Quyền xem từng báo cáo lấy theo quyền module gốc (ví dụ báo cáo doanh thu cần quyền Đơn hàng khoá học).",
        ],
      },
    ],
  },

  {
    slug: "van-hanh-tong-quan",
    title: "Trang tổng quan Vận hành & Đào tạo",
    department: "Khối vận hành & đào tạo",
    summary: "Trang landing riêng của khối: số liệu trực quan về học viên, visa, lớp học, hồ sơ và cảnh báo cần xử lý.",
    permissions: ["students.view", "workflow.manage", "training.manage", "operations.manage"],
    paths: ["/admin/van-hanh"],
    links: [
      { label: "Tổng quan khối", to: "/admin/van-hanh" },
      { label: "Hồ sơ học viên", to: "/admin/students" },
      { label: "Chương trình", to: "/admin/training" },
      { label: "SLA & Cấp tài khoản", to: "/admin/operations" },
    ],
    sections: [
      {
        id: "cach-vao",
        title: "Cách mở trang",
        steps: [
          "Bấm trực tiếp vào tên nhóm “Vận hành & Đào tạo” trên thanh menu trái để mở trang tổng quan.",
          "Bấm mũi tên bên phải tên nhóm nếu chỉ muốn mở/đóng danh sách mục con.",
          "Trong nhóm cũng có mục “Tổng quan khối” dẫn tới cùng trang này.",
          "Menu trong nhóm được chia thành 2 nhóm con: “Quản lý học viên” (Hồ sơ học viên, Kho lưu trữ hồ sơ) và “Quản lý đào tạo” (Giáo viên, Tài liệu học tập, Chương trình, Giám sát lớp học, Bài kiểm tra, Chứng chỉ); mỗi nhóm con gập/mở riêng và tự bung khi bạn đang ở trang thuộc nhóm đó.",
        ],
      },
      {
        id: "doc-so-lieu",
        title: "Đọc số liệu",
        intro: "Số liệu lấy trực tiếp từ dữ liệu đang chạy, không nhập tay.",
        rules: [
          "Bốn ô lớn: tổng hồ sơ học viên, số đang học, số đang xử lý visa, tỷ lệ chuyên cần 30 ngày gần nhất.",
          "Ba thẻ cảnh báo: hồ sơ bắt buộc quá hạn, hợp đồng hết hạn trong 90 ngày, hàng đợi cấp tài khoản Portal — bấm vào để sang màn hình xử lý.",
          "Các biểu đồ tròn (donut) xếp 3 cột trên màn hình lớn, mỗi khung có viền đổ bóng nhẹ và một dải màu thương hiệu ở mép trên — số giữa vòng tròn là tổng, chú thích màu kèm số lượng và tỷ lệ % nằm ngay dưới mỗi biểu đồ, di chuột lên miếng biểu đồ để xem chi tiết.",
          "Mỗi biểu đồ có nút “Xem chi tiết”: bên trái là bảng tổng hợp (hạng mục, số lượng, tỷ lệ) — bấm vào một hạng mục để lọc; bên phải là danh sách dữ liệu thực (mã học viên, họ tên, điện thoại, email, trạng thái, chương trình, thị trường, nước đến, nơi làm việc, hạn hợp đồng, ngày tạo…). Với biểu đồ hồ sơ thiếu là danh sách từng tài liệu kèm hạn nộp và số ngày quá hạn; với workflow là danh sách hồ sơ theo bước đang chạy.",
          "Nút “Tải báo cáo Excel” tạo file .xlsx theo màu nhận diện Kaizen gồm 2 trang: “Tổng hợp” (hạng mục – số lượng – tỷ lệ – dòng tổng) và “Chi tiết” (toàn bộ dòng dữ liệu thực, có lọc và khoá dòng tiêu đề). Nút “Tải bảng tổng hợp (CSV)” vẫn giữ để lấy nhanh phần số liệu.",
          "Hai mục “Thống kê visa” và “Thống kê đào tạo” đã được ẩn khỏi menu trái để gọn hơn; số liệu tương ứng xem ngay tại các biểu đồ ở trang này, đường dẫn /admin/visa và /admin/training/analytics vẫn mở được và giữ nguyên phân quyền.",
        ],
      },
      {
        id: "xu-ly",
        title: "Xử lý hằng ngày",
        steps: [
          "Đầu ngày mở trang tổng quan, ưu tiên xử lý ba thẻ cảnh báo trước.",
          "Kiểm tra danh sách lớp đang mở: sĩ số so với sức chứa, ngày kết thúc sắp tới.",
          "Kiểm tra danh sách hợp đồng sắp hết hạn, liên hệ học viên còn dưới 30 ngày ngay trong tuần.",
        ],
        rules: ["Trang chỉ hiển thị lối vào các mục bạn có quyền; thiếu mục nào hãy đề nghị quản trị cấp thêm vai trò."],
      },
    ],
  },

  {
    slug: "dao-tao-trung-tam",
    title: "Đào tạo & Trung tâm",
    department: "Phòng đào tạo",
    summary: "Chương trình, lớp học, xếp lịch, phân công giáo viên, giám sát và thống kê chất lượng.",
    permissions: ["training.manage", "teachers.manage", "catalog.manage", "lessons.manage"],
    paths: ["/admin/training", "/admin/teachers", "/admin/catalog", "/admin/lessons"],
    links: [
      { label: "Chương trình", to: "/admin/training" },
      { label: "Giám sát lớp học", to: "/admin/training/oversight" },
      { label: "Lịch trung tâm (thẻ trong Giám sát lớp học)", to: "/admin/training/oversight" },
      { label: "Thống kê đào tạo", to: "/admin/training/analytics" },
      { label: "Giáo viên", to: "/admin/teachers" },
      { label: "Danh mục hệ thống", to: "/admin/catalog" },
    ],
    sections: [
      {
        id: "mo-lop",
        title: "Mở lớp mới",
        steps: [
          "Kiểm tra chương trình đào tạo đã có trong danh mục; chưa có thì tạo trước.",
          "Tạo lớp: mã lớp, ngoại ngữ, trình độ, ngày khai giảng – kết thúc, sĩ số tối đa.",
          "Phân công giáo viên chủ nhiệm và giáo viên bộ môn.",
          "Xếp lịch buổi học trong thẻ Lịch trung tâm của trang Giám sát lớp học (đường dẫn cũ /admin/training/schedule tự chuyển về thẻ này) — hệ thống cảnh báo khi trùng phòng hoặc trùng giáo viên.",
          "Ghi danh học viên vào lớp từ hồ sơ học viên.",
        ],
        rules: ["Học viên phải có hồ sơ và tài khoản trước khi ghi danh, nếu không sẽ không điểm danh QR được."],
      },
      {
        id: "quan-ly-lop-quy-mo-lon",
        title: "Quản lý lớp khi có hàng nghìn học viên",
        intro: "Trang Lớp học hiển thị dạng bảng kèm bộ lọc và số liệu tổng quan, dùng được cho hàng trăm lớp cùng lúc.",
        steps: [
          "Đầu trang là các ô số: số lớp đang lọc, lớp đang học, lớp khai giảng trong 30 ngày, tổng học viên, chỗ trống và lớp chưa có giáo viên.",
          "Ba khối phân bố cho biết học viên theo Thị trường, theo Loại chương trình (Tiếng / Nghề / Định hướng / Kỹ năng) và theo Khoá tuyển sinh; bấm vào một dòng để lọc nhanh.",
          "Bộ lọc: thị trường, khoá, loại chương trình, chương trình, giáo viên, trạng thái, khoảng ngày khai giảng và ô tìm kiếm — hệ thống tự nhớ lựa chọn cho lần sau.",
          "Chọn Nhóm theo để gom bảng theo thị trường, khoá hoặc loại chương trình, mỗi nhóm có dòng tổng số lớp và học viên.",
          "Tích chọn nhiều lớp để đổi trạng thái hoặc gán giáo viên cùng lúc; nút Excel tải đúng danh sách đang lọc.",
          "Trong từng lớp: tìm học viên đã ghi danh theo tên/SĐT/mã, và ghi danh nhiều học viên một lần bằng cách tích chọn từ kho hồ sơ.",
        ],
        rules: [
          "Loại chương trình khai báo ở trang Chương trình; khoá tuyển sinh và thị trường khai báo ngay trong biểu mẫu lớp (tự gợi ý theo ngày khai giảng và theo chương trình).",
          "Bảng tải theo trang 50 lớp một lần nên vẫn nhanh khi hệ thống có hàng nghìn học viên.",
        ],
      },
      {
        id: "giam-sat",
        title: "Giám sát chất lượng",
        steps: [
          "Trang Giám sát lớp học có 2 thẻ: Giám sát lớp (mặc định) và Lịch trung tâm; đường dẫn cũ /admin/training/schedule tự chuyển vào thẻ Lịch.",
          "Sáu ô số liệu đầu trang: lớp đang hoạt động, học viên, buổi tuần này, buổi chưa điểm danh, chuyên cần trung bình và lớp chưa có giáo viên — ô màu đỏ là điểm cần xử lý.",
          "Khối Trung tâm xử lý nhóm cảnh báo theo 3 loại: chưa điểm danh, chưa gán giáo viên, sắp kết thúc thiếu điểm — bấm tên lớp để mở ngay trang điểm danh.",
          "Bộ lọc nhanh bên phải: tìm mã/tên lớp/giáo viên, lọc theo giáo viên, chương trình và các chip trạng thái có đếm số lượng.",
          "Thẻ giáo viên hiển thị số lớp, học viên, buổi tuần này, buổi chưa điểm danh, tiến độ nhập điểm và vòng chuyên cần (xanh ≥85%, vàng ≥70%, đỏ dưới 70%); bấm Lọc lớp trên thẻ để chỉ xem lớp của giáo viên đó.",
          "Trong bảng lớp: thanh tiến độ hiển thị buổi đã dạy/tổng buổi, chuyên cần hiển thị vòng tròn màu; các thao tác Vào lớp / Điểm danh / Điểm gom trong menu “⋯” cuối hàng.",
          "Thống kê đào tạo: so sánh kết quả theo lớp, giáo viên, chương trình theo khoảng thời gian.",
          "Lớp có chuyên cần thấp hoặc chậm nhập điểm cần nhắc giáo viên ngay trong tuần.",
        ],
      },
      {
        id: "danh-muc",
        title: "Danh mục hệ thống",
        intro: "Địa danh hành chính, ngoại ngữ, chương trình đào tạo, loại hồ sơ theo thị trường đều khai báo tại Danh mục hệ thống.",
        steps: [
          "Thẻ Địa danh: danh sách hành chính 2 cấp hiện hành (Tỉnh/Thành phố → Xã/Phường/Đặc khu), gồm 34 tỉnh thành và hơn 3.300 xã phường.",
          "Chọn một tỉnh/thành ở cột trái để xem, tìm, thêm hoặc sửa xã/phường ở cột phải.",
          "Nút Cập nhật danh sách chuẩn (chỉ Quản trị viên) tải lại danh sách mới nhất mà không xoá phần chỉnh tay và ghi chú gộp.",
          "Hệ thống tự động đồng bộ danh sách chuẩn mỗi tuần (Chủ nhật 2h sáng); dòng “đồng bộ gần nhất” trong thẻ Địa danh cho biết thời điểm, số tỉnh/xã và lỗi (nếu có). Nguồn lỗi thì dữ liệu cũ vẫn giữ nguyên.",
          "Biểu mẫu Quản lý xuất cảnh chọn Tỉnh/Thành phố và Xã/Phường trực tiếp từ danh mục này; vẫn có nút Gõ tay cho trường hợp đặc biệt.",
          "Thẻ Thị trường: sửa tên, cờ, khu vực (Châu Á / Châu Âu), mô tả ngắn, mô tả, điểm nổi bật (mỗi dòng một ý), thứ tự, bật/tắt và đánh dấu Nổi bật trang chủ.",
          "Trang chủ, trang Xuất khẩu lao động và form đăng ký tư vấn lấy danh sách thị trường từ thẻ này; nếu danh mục trống thì tự dùng nội dung gốc nên trang không bao giờ trắng.",
        ],
        rules: [
          "Không xoá danh mục đang được lớp/hồ sơ sử dụng; hãy đặt trạng thái ngưng dùng.",
          "Địa danh cũ đã sáp nhập thì đặt Ẩn và ghi chú gộp, không xoá, để hồ sơ cũ vẫn tra cứu được.",
          "Không đổi Đường dẫn (slug) của thị trường đang chạy — đổi sẽ hỏng liên kết cũ và thứ hạng tìm kiếm; muốn ngừng hiển thị thì tắt thay vì xoá.",
        ],
      },
    ],
  },

  {
    slug: "phong-ban-chuc-danh",
    title: "Danh mục Phòng ban & Chức danh",
    department: "Hành chính — Nhân sự",
    summary:
      "Khai báo phòng ban và chức danh để gán cho tài khoản nhân viên. Đây là thông tin nhân sự tra cứu, hoàn toàn tách biệt với vai trò và phân quyền trong hệ thống.",
    permissions: ["catalog.view", "catalog.manage"],
    paths: ["/admin/catalog"],
    links: [
      { label: "Danh mục hệ thống", to: "/admin/catalog" },
      { label: "Tài khoản & Quyền", to: "/admin/users" },
    ],
    sections: [
      {
        id: "khai-bao",
        title: "Khai báo phòng ban và chức danh",
        steps: [
          "Vào Tài khoản & Quyền › Danh mục hệ thống › tab Phòng ban & chức danh.",
          "Thẻ Phòng ban: thêm mã, tên, mô tả, thứ tự và phòng ban cấp trên (nếu có).",
          "Thẻ Chức danh: thêm mã, tên, mô tả, thứ tự. Ví dụ: Giám đốc, Trưởng phòng, Chuyên viên, Giáo viên.",
          "Tắt trạng thái nếu không còn dùng thay vì xoá, để hồ sơ cũ vẫn giữ nguyên thông tin.",
        ],
        rules: [
          "Phòng ban và chức danh chỉ là thông tin nhân sự; không tự động sinh vai trò (role) hay quyền (permission).",
          "Việc phân quyền chức năng vẫn thực hiện ở trang Tài khoản & Quyền thông qua Vai trò × Quyền và Tài khoản × Vai trò.",
        ],
      },
      {
        id: "gan-tai-khoan",
        title: "Gán phòng ban / chức danh cho tài khoản",
        steps: [
          "Tại trang Tài khoản & Quyền, chọn chế độ Danh sách hoặc Ma trận phân quyền.",
          "Bấm Thao tác › Sửa tài khoản, chọn Phòng ban và Chức danh trong hộp thoại.",
          "Có thể lọc danh sách tài khoản theo phòng ban để kiểm tra nhanh.",
        ],
        rules: [
          "Một tài khoản chỉ thuộc tối đa một phòng ban và một chức danh tại một thời điểm.",
          "Thay đổi phòng ban/chức danh không làm thay đổi vai trò đã gán.",
        ],
      },
    ],
  },

  {
    slug: "giao-vien",
    title: "Giáo viên (Cổng giảng dạy)",
    department: "Giáo viên trung tâm",
    summary: "Điểm danh QR, quản lý buổi học, nhập điểm, nhận xét định kỳ và học liệu.",
    permissions: ["lessons.manage", "materials.manage", "materials.approve", "materials.present", "curriculum.manage", "quizzes.manage", "teachers.manage"],
    paths: ["/admin/materials", "/admin/quizzes", "/admin/lessons"],
    links: [
      { label: "Cổng giảng dạy", to: "/giang-day" },
      { label: "Lớp của tôi", to: "/giang-day/lop" },
      { label: "Lịch dạy", to: "/giang-day/lich" },
      { label: "Giám sát lớp học", to: "/giang-day/giam-sat" },
      { label: "Tài liệu học tập", to: "/giang-day/tai-lieu" },
      { label: "Trình chiếu lớp học", to: "/giang-day/trinh-chieu" },
      { label: "Bài kiểm tra", to: "/giang-day/bai-kiem-tra" },
      { label: "Chứng chỉ", to: "/giang-day/chung-chi" },
    ],
    sections: [
      {
        id: "tai-lieu-chuan",
        title: "Bộ tài liệu đạt chuẩn giảng dạy & duyệt tài liệu",
        intro: "Tài liệu chỉ được dùng cho học viên và trình chiếu khi đã đạt chuẩn và được giáo vụ duyệt.",
        steps: [
          "Tài liệu học tập → Thêm tài liệu: nhập tên, chọn Thị trường, Loại tài liệu (slide/PDF/audio/video/ảnh), Buổi số và vị trí trong Khung chương trình chuẩn.",
          "Tải file chính; nếu là PowerPoint nên đính kèm thêm bản PDF để chiếu ổn định.",
          "Lưu → bấm Gửi duyệt (biểu tượng máy bay giấy). Giáo vụ duyệt trong tab Chờ duyệt; nếu từ chối sẽ có lý do để sửa và gửi lại.",
          "Tab Khung chương trình chuẩn: xem từng buổi đã đủ loại tài liệu bắt buộc chưa (bộ mẫu Hàn TOPIK 1–2, Nhật N5–N4, Đức A1–B1).",
          "Thay file mới cho tài liệu đã duyệt → tự tăng phiên bản và phải duyệt lại.",
        ],
        rules: [
          "Tài liệu đạt chuẩn = có file + thị trường + loại + số buổi + đã duyệt (dấu khiên xanh). Bộ lọc 'Chưa đạt chuẩn' liệt kê phần còn thiếu.",
          "Học viên chỉ nhìn thấy và tải được tài liệu đã duyệt; bản nháp chỉ người tạo và giáo vụ thấy.",
          "Giáo viên chỉ sửa/xoá tài liệu do mình tạo; giáo vụ (training_staff/training_manager) tự duyệt ngay khi tải lên.",
        ],
        issues: [
          { problem: "Không gửi duyệt được", fix: "Kiểm tra đã chọn thị trường và tải file chính." },
          { problem: "Học viên không thấy tài liệu", fix: "Tài liệu chưa được duyệt hoặc chưa gắn đúng lớp/chương trình." },
        ],
      },
      {
        id: "trinh-chieu",
        title: "Trình chiếu lớp học",
        steps: [
          "Menu Trình chiếu → chọn lớp (chỉ hiện lớp thuộc thị trường mình phụ trách) → chọn buổi học để ưu tiên tài liệu của buổi đó.",
          "Bấm Bắt đầu trình chiếu hoặc Chiếu ở từng tài liệu; màn hình chiếu tối giản toàn màn hình.",
          "Phím tắt: ← → chuyển trang/tài liệu, Space trang kế, +/− phóng to, F toàn màn hình, Esc thoát, biểu tượng danh sách để nhảy nhanh.",
          "PDF và slide đã kèm PDF chiếu trực tiếp; ảnh/audio/video phát ngay; PowerPoint gốc mở qua trình xem Office trực tuyến (cần mạng).",
        ],
        rules: [
          "Mỗi lần mở trình chiếu được ghi nhật ký (lớp, buổi, tài liệu, thời lượng) để giám sát chất lượng giảng dạy.",
          "Tài liệu người khác chỉ chiếu được khi đã duyệt; bản nháp của chính mình vẫn chiếu được để thử.",
          "Đường dẫn file chỉ có hiệu lực 1 giờ; tải lại trang nếu chiếu quá lâu.",
        ],
        issues: [
          { problem: "PowerPoint không hiển thị", fix: "Mạng chặn trình xem Office hoặc file quá lớn — đính kèm bản PDF cho tài liệu đó." },
          { problem: "Không có lớp nào để chọn", fix: "Chưa được gán thị trường/lớp trong hồ sơ giáo viên." },
        ],
      },
      {
        id: "cong-giao-vien",
        title: "Đăng nhập và phạm vi dữ liệu",
        steps: [
          "Tài khoản chỉ có vai trò Giáo viên khi đăng nhập sẽ vào thẳng Cổng giảng dạy, không vào khu quản trị.",
          "Làm việc trực tiếp tại cổng: lớp, lịch, giám sát lớp, tài liệu, bài kiểm tra, chứng chỉ.",
          "Kiêm nhiệm giáo vụ/quản trị vẫn vào khu quản trị và chuyển cổng bằng menu tài khoản.",
        ],
        rules: [
          "Giáo viên chỉ thấy lớp, tài liệu, bài kiểm tra và chứng chỉ thuộc thị trường mình phụ trách; thị trường khác bị chặn kể cả khi mở đường dẫn trực tiếp.",
          "Thị trường lấy từ hồ sơ giáo viên; nếu chưa gán, hệ thống tự suy ra từ các lớp đang dạy.",
          "Chỉ giáo vụ và quản trị mới được cấp hoặc thu hồi chứng chỉ.",
        ],
        issues: [
          { problem: "Giáo viên không thấy tài liệu hoặc lớp mong đợi", fix: "Gán đúng thị trường trong hồ sơ giáo viên hoặc gán giáo viên vào lớp tương ứng." },
        ],
      },
      {
        id: "diem-danh",
        title: "Điểm danh bằng QR",
        steps: [
          "Mở lớp trong Cổng giảng dạy → chọn buổi học hôm nay → Bật mã QR.",
          "Chiếu mã lên màn hình; mã tự đổi liên tục nên học viên không chụp gửi cho nhau được.",
          "Học viên quét bằng tài khoản của mình tại Cổng học viên.",
          "Kết thúc buổi: đóng mã, chỉnh tay các trường hợp muộn/phép rồi lưu.",
        ],
        rules: ["Chỉ tài khoản đã gắn đúng hồ sơ học viên mới điểm danh được — đúng người, đúng lớp."],
        issues: [
          { problem: "Học viên báo quét không được", fix: "Kiểm tra học viên đã được ghi danh vào lớp và tài khoản đã liên kết hồ sơ." },
        ],
      },
      {
        id: "diem-nhan-xet",
        title: "Nhập điểm và nhận xét",
        steps: [
          "Vào lớp → Bảng điểm → chọn loại đánh giá (thường xuyên, giữa kỳ, cuối kỳ).",
          "Nhập điểm theo từng học viên, hệ thống tự tính điểm tổng theo trọng số.",
          "Nhận xét định kỳ: viết theo tuần/tháng/giai đoạn, nêu rõ điểm mạnh và việc cần cải thiện.",
        ],
        rules: ["Nhập điểm chậm nhất 3 ngày sau khi kiểm tra; nhận xét tháng hoàn tất trước ngày 5 tháng sau."],
      },
      {
        id: "hoc-lieu",
        title: "Học liệu và bài kiểm tra",
        steps: [
          "Tải học liệu theo bài học: video, tài liệu, bài tập.",
          "Mỗi bài học phải có tối thiểu một liên kết nguồn học miễn phí cho học viên tự luyện.",
          "Tạo bài kiểm tra, đặt số lần làm lại và thời gian mở đề.",
        ],
      },
    ],
  },

  {
    slug: "quan-ly-xuat-canh",
    title: "Quản lý xuất cảnh",
    department: "Điều phối xuất cảnh / Hồ sơ visa",
    summary:
      "Danh sách người lao động và học viên xuất cảnh, thống kê theo thời điểm, nhập từ file Excel mẫu và xuất đúng 21 cột của cơ quan quản lý.",
    permissions: ["departure.view", "departure.edit"],
    paths: ["/admin/xuat-canh"],
    links: [
      { label: "Quản lý xuất cảnh", to: "/admin/xuat-canh" },
      { label: "Hồ sơ học viên", to: "/admin/students" },
    ],
    sections: [
      {
        id: "tong-quan",
        title: "Bảng thống kê tổng quan",
        intro:
          "Đầu trang hiển thị tổng hồ sơ, số đã xuất cảnh (tháng này / năm nay), số dự kiến trong 30 ngày tới và số hoãn - huỷ; kèm biểu đồ theo nước đến, trạng thái, nguồn hồ sơ và số lượt xuất cảnh 12 tháng gần nhất.",
        rules: ["Mọi bộ lọc phía dưới đều áp dụng cho cả biểu đồ và bảng danh sách."],
      },
      {
        id: "loc-thoi-gian",
        title: "Lọc theo khoảng thời gian",
        steps: [
          "Chọn mốc thời gian: Theo ngày dự kiến hoặc Theo ngày xuất cảnh thực tế.",
          "Nhập ngày bắt đầu và ngày kết thúc, hoặc dùng ô Chọn nhanh (Tháng này, Tháng trước, Quý này, Năm nay, 30 ngày tới).",
          "Bấm Xoá lọc thời gian để quay lại toàn bộ danh sách.",
        ],
        rules: [
          "Khoảng thời gian áp dụng cho cả bảng danh sách và file Excel xuất ra theo bộ lọc.",
        ],
      },
      {
        id: "tai-file-mau",
        title: "Tải file Excel mẫu chuẩn để lưu trữ",
        steps: [
          "Bấm Tải file Excel mẫu ở đầu trang.",
          "File tải về gồm trang danh sách 21 cột đúng thứ tự (có một dòng ví dụ) và trang Hướng dẫn quy ước điền từng cột.",
          "Lưu file này làm mẫu chuẩn nội bộ, điền dữ liệu rồi dùng chức năng Nhập từ Excel để đưa vào hệ thống.",
        ],
        rules: [
          "Không đổi tên hoặc thứ tự cột trong file mẫu, nếu không hệ thống sẽ không đọc đúng dữ liệu.",
          "Giới tính 1 = Nam, 0 = Nữ; hôn nhân 1 = Đã kết hôn, 0 = Độc thân; Y/N = Có/Không; ngày dạng dd-mm-yyyy.",
        ],
      },
      {
        id: "them-nguoi",
        title: "Thêm người xuất cảnh",
        steps: [
          "Bấm Thêm người xuất cảnh.",
          "Nếu là học viên đã có hồ sơ: gõ mã học viên / họ tên / số điện thoại rồi chọn kết quả — hệ thống tự kéo căn cước, ngày sinh, nơi ở, nước đến, ngành nghề sang.",
          "Nếu là lao động ngoài hệ thống: nhập trực tiếp các trường có dấu (*).",
          "Bổ sung ngày dự kiến, chuyến bay, sân bay đi - đến rồi Lưu.",
        ],
        rules: [
          "Mỗi số căn cước chỉ tồn tại một bản ghi xuất cảnh đang hiệu lực.",
          "Hồ sơ gắn với học viên sẽ tự cập nhật ngày và trạng thái xuất cảnh sang hồ sơ học viên, đồng thời ghi vào nhật ký trách nhiệm.",
        ],
      },
      {
        id: "nhap-excel",
        title: "Nhập hàng loạt từ file Excel mẫu",
        steps: [
          "Bấm Nhập từ Excel và chọn file theo mẫu Người lao động (.xls hoặc .xlsx).",
          "Xem bảng kiểm tra: dòng hợp lệ, dòng thiếu dữ liệu bắt buộc, dòng trùng căn cước sẽ được cập nhật.",
          "Bấm Nhập vào hệ thống — chỉ các dòng hợp lệ được ghi nhận.",
        ],
        rules: [
          "Quy ước dữ liệu theo mẫu: Giới tính 1 = Nam, 0 = Nữ; Hôn nhân 1 = Đã kết hôn, 0 = Độc thân; các cột chính sách dùng Y/N; ngày dạng dd-mm-yyyy.",
        ],
      },
      {
        id: "xuat-file",
        title: "Xuất danh sách theo mẫu 21 cột",
        steps: [
          "Lọc theo trạng thái, nước đến hoặc tick chọn từng người.",
          "Bấm Xuất mẫu 21 cột để tải file Excel đúng thứ tự cột của cơ quan quản lý.",
        ],
        rules: ["Không có bản ghi nào khớp bộ lọc thì hệ thống sẽ báo lỗi thay vì xuất file rỗng."],
      },
      {
        id: "xac-nhan",
        title: "Xác nhận đã xuất cảnh",
        steps: [
          "Tick chọn một hoặc nhiều người trong bảng.",
          "Bấm Xác nhận đã xuất cảnh và nhập ngày thực tế.",
        ],
        rules: ["Thao tác này cập nhật cả hồ sơ học viên liên kết và ghi nhật ký người thực hiện."],
      },
    ],
  },

  {
    slug: "ho-so-visa",
    title: "Hồ sơ du học & Visa",
    department: "Hồ sơ / Visa / Trưởng thị trường",
    summary: "Checklist theo thị trường, % hoàn thiện hồ sơ, rà soát bằng AI và thống kê visa.",
    permissions: ["students.view", "students.manage"],
    paths: ["/admin/students", "/admin/visa"],
    links: [
      { label: "Hồ sơ học viên", to: "/admin/students" },
      { label: "Thống kê visa", to: "/admin/visa" },
    ],
    sections: [
      {
        id: "noi-o-dia-ban",
        title: "Nơi ở & địa bàn (Quê quán / Thường trú / Nơi ở hiện tại)",
        intro:
          "Trong hồ sơ học viên, thẻ Tổng quan có khối “Nơi ở & địa bàn” gồm 3 phần: Quê quán, Thường trú và Nơi ở hiện tại. Tỉnh/Thành phố và Xã/Phường chọn từ Danh mục hệ thống → Địa danh theo mô hình 2 cấp hiện hành.",
        steps: [
          "Ngay khi Tạo hồ sơ: mở mục “Nơi ở & địa bàn” (thu gọn) trong form để nhập 3 địa chỉ; có thể bỏ trống và bổ sung sau ở thẻ Tổng quan.",
          "Chọn Tỉnh / Thành phố, sau đó danh sách Xã / Phường của tỉnh đó sẽ hiện ra để chọn.",
          "Nhập Địa chỉ chi tiết: số nhà, tổ / thôn / xóm, đường.",
          "Nếu nơi ở hiện tại trùng thường trú, bấm “Nơi ở hiện tại = Thường trú” để sao chép nhanh.",
          "Bấm Lưu địa bàn; dòng “Địa chỉ đầy đủ” bên dưới mỗi phần cho biết địa chỉ sẽ hiển thị trên hồ sơ và bản xuất.",
          "Địa chỉ đầy đủ cũng được tóm tắt ở đầu trang hồ sơ để xem nhanh không cần cuộn.",
        ],
        rules: [
          "Hệ thống lưu cả mã địa danh và tên hiển thị nên có thể lọc, thống kê theo tỉnh chính xác.",
          "Máy chủ đối chiếu mã tỉnh/xã với danh mục khi lưu: mã không tồn tại hoặc xã không thuộc tỉnh đã chọn sẽ bị từ chối, không lưu dữ liệu lệch.",
          "Địa chỉ dạng chữ nhập từ trước được giữ nguyên và hiển thị bên dưới để đối chiếu, không bị ghi đè khi chưa chọn địa danh mới.",
          "Nếu thiếu địa danh, bổ sung trong Danh mục hệ thống → Địa danh (quyền quản lý danh mục), không gõ tay tại hồ sơ.",
        ],
      },
      {
        id: "checklist",
        title: "Checklist giấy tờ theo thị trường",
        steps: [
          "Mở hồ sơ học viên → thẻ Checklist giấy tờ; danh sách sinh tự động theo thị trường của học viên.",
          "Tải từng giấy tờ lên, đánh dấu trạng thái: đã có / đang xử lý / cần bổ sung.",
          "Theo dõi tỷ lệ hoàn thiện; hồ sơ dưới 100% không được đưa vào nộp.",
        ],
        rules: ["Giấy tờ bắt buộc phải có bản scan rõ nét, đúng tên tệp theo loại giấy tờ."],
      },
      {
        id: "checklist-giai-doan",
        title: "Checklist theo 5 giai đoạn hồ sơ",
        intro:
          "Checklist được chia theo hành trình: Đăng ký → Đào tạo → Visa → Xuất cảnh → Sau xuất cảnh. Mỗi giai đoạn có % hoàn thiện riêng, chỉ tính giấy tờ bắt buộc và bỏ qua mục Không áp dụng.",
        steps: [
          "Trong hồ sơ học viên, chọn đúng Loại chương trình (Du học / XKLĐ / Thực tập sinh) rồi lưu.",
          "Bấm Đồng bộ theo thị trường: hệ thống sinh giấy tờ theo cả thị trường và loại chương trình, tự xếp vào giai đoạn tương ứng.",
          "Nhập hạn nộp cho từng giấy tờ khi cần — quá hạn hiển thị đỏ, còn dưới 7 ngày hiển thị cam.",
          "Khi nhận bản giấy, tick ô Đã nhận bản giấy; khi duyệt xong, đổi trạng thái sang Đã duyệt (hệ thống ghi lại người duyệt và thời điểm).",
          "Có thể thêm giấy tờ phát sinh và chọn giai đoạn cho nó ngay ở cuối danh sách.",
        ],
        rules: [
          "Đính kèm tệp là tuỳ chọn, không ảnh hưởng % hoàn thiện — trạng thái mới là căn cứ tính tiến độ.",
          "Khai báo giai đoạn, loại chương trình và số tháng hiệu lực mặc định cho từng loại giấy tờ tại Danh mục → Loại hồ sơ.",
        ],
      },
      {
        id: "ai",
        title: "Rà soát hồ sơ bằng AI",
        steps: [
          "Bấm Rà soát AI trong hồ sơ để kiểm tra tính đầy đủ và sự thống nhất thông tin giữa các giấy tờ.",
          "Đọc danh sách cảnh báo, sửa các điểm được nêu rồi chạy lại.",
          "Tham khảo mức dự đoán khả năng đạt visa để quyết định thời điểm nộp.",
        ],
        rules: ["Kết quả AI là gợi ý — cán bộ hồ sơ vẫn là người chịu trách nhiệm cuối cùng."],
      },
      {
        id: "thong-ke",
        title: "Thống kê visa",
        intro: "Trang Thống kê visa cho biết tỷ lệ đạt/trượt theo kỳ nhập học, theo thị trường và theo cán bộ phụ trách.",
      },
      {
        id: "ocr-giay-to",
        title: "Quét giấy tờ (OCR) và lưu vào hồ sơ",
        intro:
          "Chức năng quét ảnh Hộ chiếu/CCCD/CMND nằm trong hồ sơ học viên, thẻ Tài liệu. Hệ thống đọc ảnh, đối chiếu với dữ liệu đang có rồi mới ghi — không bao giờ tự ghi đè.",
        steps: [
          "Mở hồ sơ học viên → thẻ Tài liệu → khối Quét OCR.",
          "Chọn loại giấy tờ, tải ảnh JPG/PNG/WebP dung lượng tối đa 5MB.",
          "Xem bảng đối chiếu hai cột: Giá trị đang có và Giá trị OCR đọc được; ô nào lệch sẽ được tô viền.",
          "Tick chọn từng dòng muốn ghi (mặc định chỉ tick sẵn những ô hồ sơ còn trống), có thể sửa tay giá trị OCR.",
          "Bấm Lưu vào hồ sơ — hệ thống ghi các trường đã tick và lưu lại thời điểm quét.",
        ],
        rules: [
          "Luôn đối chiếu với ảnh gốc trước khi lưu; OCR có thể đọc sai dấu tiếng Việt và số giấy tờ.",
          "Ngày tháng phải đúng dạng NĂM-THÁNG-NGÀY (2001-05-20), sai định dạng sẽ bị bỏ qua.",
          "Không dùng OCR để tạo mã học viên mới — mã KZ… do hệ thống cấp một lần và không thay đổi.",
        ],
        issues: [
          {
            problem: "Bấm Lưu nhưng báo chưa chọn trường nào",
            fix: "Cần tick ít nhất một dòng có giá trị OCR; dòng trống sẽ bị khoá tick.",
          },
          {
            problem: "Đọc sai hoặc thiếu thông tin",
            fix: "Chụp lại ảnh rõ nét, đủ 4 góc, không loá; hoặc sửa tay trực tiếp trong bảng đối chiếu rồi lưu.",
          },
        ],
      },
      {
        id: "ma-hoc-vien",
        title: "Mã học viên và tìm kiếm",
        steps: [
          "Mã học viên (KZ…) hiển thị ngay cạnh tên ở đầu trang chi tiết; bấm vào mã để sao chép.",
          "Ở danh sách hồ sơ, gõ mã học viên vào ô tìm kiếm để mở nhanh đúng hồ sơ (cũng tìm được theo số giấy tờ, tên, SĐT, email).",
        ],
        rules: ["Dùng mã học viên khi trao đổi nội bộ thay cho tên để tránh nhầm người trùng tên."],
      },
      {
        id: "canh-bao-trung-ho-so",
        title: "Cảnh báo trùng thông tin khi tạo hồ sơ",
        intro:
          "Khi tạo hồ sơ mới, hệ thống tự so khớp với hồ sơ đã có theo số điện thoại, email hoặc họ tên + ngày sinh để tránh tạo trùng người.",
        steps: [
          "Trong hộp Tạo hồ sơ, vừa gõ SĐT/email/họ tên + ngày sinh, khung vàng bên dưới hiện ngay các hồ sơ trùng (kèm mã học viên và lý do trùng).",
          "Bấm Tạo hồ sơ: nếu có trùng, hộp xác nhận mở ra với hai lựa chọn — Chỉnh sửa hồ sơ cũ (mở đúng hồ sơ đã có) hoặc Vẫn tạo hồ sơ mới (khi chắc chắn là người khác, ví dụ hai anh em dùng chung SĐT).",
          "Chọn Quay lại sửa thông tin nếu muốn kiểm tra lại trước khi quyết định.",
        ],
        rules: [
          "Ưu tiên cập nhật trên hồ sơ cũ để giữ nguyên mã học viên, lịch sử workflow và nhật ký trách nhiệm.",
          "Khi vẫn tạo mới, nhật ký sẽ ghi rõ 'đã xác nhận bỏ qua cảnh báo trùng' kèm người thao tác.",
          "So khớp SĐT bỏ qua dấu cách/dấu chấm và coi 0xxx với 84xxx là một.",
        ],
      },
      {
        id: "xoa-ho-so-hoc-vien",
        title: "Xoá hồ sơ học viên (chỉ quản trị)",
        intro:
          "Nút Xoá hồ sơ (màu đỏ) nằm ở đầu trang chi tiết và cuối mỗi dòng trong danh sách, chỉ hiện với tài khoản có quyền 'Xoá hồ sơ học viên (vĩnh viễn)' — mặc định là Quản trị viên. Cấp thêm cho vai trò khác tại Tài khoản & Quyền → Vai trò × Quyền.",
        steps: [
          "Bấm Xoá hồ sơ → đọc kỹ phạm vi dữ liệu sẽ mất.",
          "Ghi lý do xoá (bắt buộc, tối thiểu 5 ký tự) — ví dụ 'Trùng với KZ26xxxxxx'.",
          "Gõ đúng mã học viên để xác nhận rồi bấm Xoá vĩnh viễn.",
        ],
        rules: [
          "Xoá là vĩnh viễn: workflow, checklist, tài liệu, chăm sóc, ghi danh, điểm, chứng chỉ, phiếu lưu trữ và nhật ký của hồ sơ đó bị xoá theo.",
          "Lead tư vấn và bản ghi xuất cảnh liên quan được giữ lại nhưng mất liên kết tới hồ sơ.",
          "Mỗi lần xoá được ghi vào nhật ký hệ thống (người xoá, thời điểm, lý do, thông tin hồ sơ trước khi xoá) để tra soát.",
          "Với hồ sơ đã xuất cảnh hoặc đã cấp chứng chỉ, nên dùng Kho lưu trữ thay vì xoá.",
        ],
      },
      {
        id: "xuat-ho-so-360",
        title: "Xuất hồ sơ 360° (lưu trữ & thanh tra)",
        intro:
          "Nút Xuất hồ sơ 360° nằm ở góc phải đầu trang chi tiết học viên. Chức năng gom toàn bộ dữ liệu của một học viên thành file chuẩn lưu trữ: định danh, nguồn khách hàng, tiến trình trạng thái, giấy tờ, lớp học, điểm danh, điểm số, chứng chỉ, chăm sóc và kỷ luật.",
        steps: [
          "Mở hồ sơ học viên → bấm Xuất hồ sơ 360°.",
          "Chọn định dạng: PDF bản in (bảng biểu kẻ khung, tiêu đề phần nền đỏ, dòng tiêu đề cột nền xanh, có đầu trang, số trang và trang ký xác nhận — trình bày đồng bộ với bản Excel), Excel nhiều sheet (mỗi nhóm dữ liệu một sheet), hoặc Gói ZIP (PDF + Excel + ảnh giấy tờ đã tải lên kèm file MUC-LUC.txt).",
          "Chọn mục đích xuất: lưu trữ nội bộ, phục vụ thanh tra, bàn giao đối tác hoặc cung cấp cho học viên.",
          "Ghi lý do xuất (bắt buộc) rồi bấm Xuất file — file tải về theo tên chuẩn MÃHV_HỌTÊN_360_ngày.",
          "Xem lại các lần đã xuất ở khối Nhật ký xuất hồ sơ ngay dưới nút.",
        ],
        rules: [
          "Chỉ quản trị viên, quản lý đào tạo, tư vấn, cán bộ visa, điều phối xuất cảnh và CSKH được xuất.",
          "Mỗi lần xuất đều lưu người xuất, thời điểm, định dạng, lý do và mã kiểm tra tính toàn vẹn SHA-256 — dùng để đối chiếu khi thanh tra.",
          "Gói ZIP chứa bản chụp giấy tờ cá nhân: chỉ bàn giao cho đúng đơn vị có thẩm quyền, không gửi qua kênh công khai.",
          "Ngày tháng trong file thống nhất dạng ngày/tháng/năm; ô không có dữ liệu ghi dấu — thay vì để trắng.",
          "File Excel trình bày dạng bảng biểu chuẩn theo màu nhận diện Kaizen: sheet đầu là trang bìa kèm mục lục, mỗi phần một sheet có tiêu đề đỏ, dòng tiêu đề cột nền xanh được đóng băng, dòng dữ liệu kẻ viền và tô sọc xen kẽ, có nút lọc theo cột và khổ in A4 ngang.",
        ],
        issues: [
          {
            problem: "Báo Vui lòng ghi lý do xuất hồ sơ",
            fix: "Ô lý do là bắt buộc để phục vụ truy vết; ghi ngắn gọn mục đích và đơn vị nhận hồ sơ.",
          },
          {
            problem: "Gói ZIP thiếu vài ảnh giấy tờ",
            fix: "File MUC-LUC.txt sẽ ghi rõ dòng (LỖI TẢI); kiểm tra lại tệp đó trong thẻ Tài liệu và tải lên lại.",
          },
        ],
      },
      {
        id: "noi-lam-viec",
        title: "Nơi làm việc & cảnh báo hạn hợp đồng",
        intro:
          "Thẻ Nơi làm việc trong hồ sơ học viên lưu nước đến, ngành nghề, đơn vị tiếp nhận, địa chỉ, người liên hệ và thời hạn hợp đồng. Hệ thống tự nhắc khi hợp đồng còn 90, 30, 7 ngày và khi đã quá hạn.",
        steps: [
          "Mở hồ sơ học viên → thẻ Nơi làm việc → bấm Sửa.",
          "Điền nước đến, thành phố, ngành nghề, vị trí, đơn vị tiếp nhận và địa chỉ nơi làm việc.",
          "Điền người liên hệ, điện thoại, email của đơn vị tiếp nhận để CSKH liên hệ khi cần.",
          "Điền ngày xuất cảnh, ngày bắt đầu - kết thúc hợp đồng, thời hạn theo tháng và ghi chú gia hạn rồi bấm Lưu.",
          "Ở danh sách học viên, dùng bộ lọc Hạn hợp đồng để xem nhóm sắp hết hạn 7 / 30 / 90 ngày hoặc đã quá hạn.",
        ],
        rules: [
          "Chỉ quản trị viên, điều phối xuất cảnh và CSKH được sửa thông tin nơi làm việc; các bộ phận khác chỉ xem.",
          "Mỗi học viên chỉ lưu một nơi làm việc và một hợp đồng hiện hành; khi gia hạn thì cập nhật lại ngày kết thúc và ghi chú gia hạn.",
          "Khi đổi ngày kết thúc hợp đồng, các mốc nhắc đã gửi được đặt lại để hệ thống nhắc theo hạn mới.",
          "Thông báo nhắc hạn gửi cho cán bộ phụ trách hồ sơ; hồ sơ chưa có người phụ trách sẽ gửi cho quản trị viên.",
          "Thông tin nơi làm việc và hợp đồng được đưa vào file Xuất hồ sơ 360° phục vụ lưu trữ, thanh tra.",
        ],
        issues: [
          {
            problem: "Không thấy nút Sửa trong thẻ Nơi làm việc",
            fix: "Tài khoản chưa có vai trò quản trị, điều phối xuất cảnh hoặc CSKH — đề nghị quản trị viên cấp thêm vai trò tại Tài khoản và phân quyền.",
          },
          {
            problem: "Báo Ngày kết thúc hợp đồng phải sau ngày bắt đầu",
            fix: "Kiểm tra lại hai ô ngày; nếu chưa biết ngày bắt đầu thì để trống thay vì điền ngày tạm.",
          },
          {
            problem: "Không nhận được nhắc hạn hợp đồng",
            fix: "Kiểm tra hồ sơ đã điền ngày kết thúc hợp đồng và đã gán cán bộ phụ trách chưa; hệ thống quét mỗi ngày một lần.",
          },
        ],
      },
    ],
  },

  {
    slug: "workflow-xuat-canh",
    title: "Workflow & Xuất cảnh",
    department: "Vận hành / Điều phối xuất cảnh",
    summary: "18 bước vận hành, thời hạn xử lý (SLA) và cấp tài khoản cho học viên.",
    permissions: ["workflow.manage", "operations.manage"],
    paths: ["/admin/workflow", "/admin/operations"],
    links: [
      { label: "Workflow (18 bước)", to: "/admin/workflow" },
      { label: "SLA & Cấp tài khoản", to: "/admin/operations" },
    ],
    sections: [
      {
        id: "buoc",
        title: "Chạy hồ sơ theo 18 bước",
        steps: [
          "Mở Workflow, lọc theo thị trường hoặc cán bộ phụ trách.",
          "Mỗi bước hoàn tất phải đính kèm bằng chứng (tài liệu, biên nhận) rồi mới chuyển bước.",
          "Bước quá hạn được tô cảnh báo — xử lý trước, không để dồn.",
        ],
        rules: ["Không nhảy bước. Nếu buộc phải bỏ qua, ghi lý do trong ghi chú của bước."],
      },
      {
        id: "cap-tk",
        title: "Cấp tài khoản học viên",
        steps: [
          "Vào SLA & Cấp tài khoản → chọn học viên chưa có tài khoản.",
          "Cấp tài khoản theo email/số điện thoại đã xác minh, hệ thống tự gắn với đúng hồ sơ.",
          "Hướng dẫn học viên đổi mật khẩu ở lần đăng nhập đầu tiên.",
        ],
      },
    ],
  },

  {
    slug: "khoa-hoc-online",
    title: "Khoá học online (E-learning)",
    department: "Giảng viên online / Kinh doanh khoá học",
    summary: "Tạo khoá học, bài học, giá và mã giảm giá, xử lý đơn hàng và cấp chứng chỉ.",
    permissions: ["courses.manage", "courses.orders", "certificates.manage"],
    paths: ["/admin/courses", "/admin/certificates"],
    links: [
      { label: "Khoá học online", to: "/admin/courses" },
      { label: "Đơn hàng khoá học", to: "/admin/courses/orders" },
      { label: "Chứng chỉ", to: "/admin/certificates" },
      { label: "Cài đặt thanh toán", to: "/admin/settings/payments" },
    ],
    sections: [
      {
        id: "tao-khoa",
        title: "Tạo và xuất bản khoá học",
        steps: [
          "Tạo khoá: tên, ngoại ngữ, trình độ, mô tả bán hàng, ảnh bìa.",
          "Thêm chương và bài học: video, tài liệu, bài tập, bài kiểm tra cuối chương.",
          "Đặt giá bán, giá khuyến mãi và mã giảm giá (nếu có).",
          "Xem trước trang bán hàng công khai rồi mới xuất bản.",
        ],
        rules: ["Khoá đã có học viên mua thì không đổi cấu trúc chương/bài đang học; hãy thêm mới."],
      },
      {
        id: "don-hang",
        title: "Đơn hàng và thanh toán",
        steps: [
          "Theo dõi đơn ở Đơn hàng khoá học: chờ thanh toán, đã thanh toán, huỷ.",
          "Đơn chuyển khoản thủ công: đối chiếu biên lai rồi xác nhận để mở khoá học.",
          "Học viên hoàn tất khoá → cấp chứng chỉ ở mục Chứng chỉ.",
        ],
        issues: [
          { problem: "Khách báo đã chuyển tiền nhưng chưa mở khoá", fix: "Kiểm tra mã đơn trong biên lai, đối chiếu ở Đơn hàng rồi xác nhận thủ công." },
        ],
      },
    ],
  },

  {
    slug: "chatbot",
    title: "Chatbot tư vấn",
    department: "Marketing / CSKH",
    summary: "Cập nhật tri thức, chỉnh system prompt, huấn luyện và kiểm tra hội thoại.",
    permissions: ["chatbot.manage"],
    paths: ["/admin/chatbot"],
    links: [
      { label: "Tổng quan chatbot", to: "/admin/chatbot" },
      { label: "Tri thức", to: "/admin/chatbot/knowledge" },
      { label: "System prompt", to: "/admin/chatbot/prompt" },
      { label: "Huấn luyện", to: "/admin/chatbot/training" },
    ],
    sections: [
      {
        id: "tri-thuc",
        title: "Cập nhật tri thức",
        steps: [
          "Thêm mục tri thức theo chủ đề: chi phí, điều kiện, lịch khai giảng, thị trường.",
          "Viết ngắn gọn, đúng số liệu hiện hành; số liệu cũ phải gỡ ngay.",
          "Sau khi cập nhật, thử lại câu hỏi tương ứng ở khung chat trên website.",
        ],
        rules: ["Không đưa cam kết chắc chắn đậu visa hay bảo đảm lương vào tri thức chatbot."],
      },
      {
        id: "hoi-thoai",
        title: "Kiểm tra hội thoại và lead",
        intro: "Hội thoại có để lại số điện thoại sẽ tạo lead và vào hàng đợi telesales.",
      },
    ],
  },

  {
    slug: "tro-ly-ao-cai-dat-ai",
    title: "Trợ lý ảo & Cài đặt AI",
    department: "Toàn công ty",
    summary: "Dùng Trợ lý Kaizen để hỏi quy trình, tra cứu số liệu, soạn thảo; quản trị viên chọn hãng AI và khoá API.",
    permissions: ["ai.assistant"],
    paths: ["/admin/cai-dat-ai"],
    links: [{ label: "Mở Cài đặt AI", to: "/admin/cai-dat-ai" }],
    sections: [
      {
        id: "dung-tro-ly",
        title: "Dùng trợ lý",
        steps: [
          "Bấm nút “Trợ lý” ở góc dưới bên phải bất kỳ trang quản trị nào.",
          "Hỏi quy trình, ví dụ “cách lưu hồ sơ giấy”. Trợ lý trả lời kèm đường dẫn trang.",
          "Hỏi số liệu, ví dụ “có bao nhiêu hồ sơ đang chờ visa”. Trợ lý chỉ thấy dữ liệu phòng ban của anh/chị.",
          "Nhờ soạn email, tin nhắn, tóm tắt. Bấm “Sao chép” rồi tự dán và lưu. Trợ lý không tự sửa dữ liệu.",
          "Cuộc trò chuyện không được lưu khi tải lại trang.",
        ],
      },
      {
        id: "cai-dat",
        title: "Cài đặt AI (quản trị viên)",
        steps: [
          "Vào Cài đặt AI, xem hãng nào đã có khoá API.",
          "Chọn hãng cho trò chuyện và hãng tạo ảnh, sửa tên mẫu nếu cần, bấm Lưu.",
          "Bấm Kiểm tra kết nối. Báo lỗi khoá thì cần nhập lại khoá.",
        ],
      },
    ],
  },

  {
    slug: "hoa-hong-ctv",
    title: "Hoa hồng cộng tác viên",
    department: "Kinh doanh",
    summary: "Ghi nhận doanh thu và hoa hồng CTV theo đơn hàng giới thiệu, duyệt và xác nhận chi trả.",
    permissions: ["commissions.view"],
    paths: ["/admin/hoa-hong"],
    links: [{ label: "Mở trang hoa hồng", to: "/admin/hoa-hong" }],
    sections: [
      {
        id: "ghi-nhan",
        title: "Ghi nhận khi nhập hồ sơ",
        steps: [
          "Khi tạo hồ sơ học viên, nhập Mã CTV (KZ-CTV-...) ở mục “Cộng tác viên giới thiệu”.",
          "Rời ô mã, hệ thống báo tên CTV hoặc báo mã sai. Mã sai thì hồ sơ không được lưu.",
          "Nhập doanh thu đơn hàng và hoa hồng. Khoản hoa hồng tự tạo ở trạng thái Chờ duyệt.",
          "Quên nhập lúc tạo: mở hồ sơ → thẻ “CTV & Hoa hồng” → Ghi nhận hoa hồng.",
        ],
      },
      {
        id: "doi-soat",
        title: "Duyệt và chi trả",
        steps: [
          "Vào Hoa hồng cộng tác viên, lọc Chờ duyệt, bấm Duyệt.",
          "Sau khi chuyển tiền, bấm Xác nhận chi trả và nhập số chứng từ.",
          "Khoản đã thanh toán không đổi được trạng thái. Bấm Xuất bảng kê để gửi kế toán.",
        ],
      },
    ],
  },

  {
    slug: "kiem-nghiem-ban-giao",
    title: "Kiểm nghiệm & Bàn giao",
    department: "Ban Giám đốc",
    summary: "Tự kiểm nghiệm phân quyền phòng ban, mã định danh, lưu kho, giáo dục định hướng và in biên bản bàn giao.",
    permissions: ["system.diagnostics"],
    paths: ["/admin/kiem-nghiem"],
    links: [{ label: "Mở trang kiểm nghiệm", to: "/admin/kiem-nghiem" }],
    sections: [
      {
        id: "chay-kiem-nghiem",
        title: "Chạy kiểm nghiệm",
        steps: [
          "Bấm “Bắt đầu kiểm nghiệm”. Hệ thống tạo 2 hồ sơ thử (XKLĐ Nhật Bản, Du học Đức), kiểm tra rồi xóa ngay.",
          "Mục “Không đạt” phải xử lý trước khi bàn giao. Mục “Cần lưu ý” giao người phụ trách xử lý tiếp.",
          "Bấm “In biên bản bàn giao” để in A4 và ký xác nhận.",
          "Người ký biên bản bàn giao và người duyệt ngoại lệ GDĐH được chỉ định tại Tài khoản & Quyền → Người phụ trách nghiệp vụ. Việc chỉ định chưa tự động phê duyệt ngoại lệ.",
          "Tại Lưu trữ, mở tem hồ sơ để in mã vạch + QR hoặc tải bảng kiểm Word có màu và logo Kaizen. Bảng kiểm lấy từ hồ sơ hiện có.",
        ],
      },
      {
        id: "loai-ho-so",
        title: "Phân loại Du học và XKLĐ",
        steps: [
          "Khi tạo hồ sơ, bắt buộc chọn Loại hồ sơ: Du học, Xuất khẩu lao động / Kỹ sư hoặc Thực tập sinh.",
          "Trên danh sách học viên, dùng nút Tất cả / Du học / Xuất khẩu lao động để lọc nhanh.",
          "Chứng chỉ Giáo dục định hướng tự cấp số theo mẫu KZ-GDĐH-[thị trường]-[năm]-[5 số].",
        ],
      },
    ],
  },
  {
    slug: "quan-tri-he-thong",
    title: "Quản trị hệ thống",
    department: "Quản trị viên",
    summary: "Tài khoản, phân quyền, mật khẩu, cài đặt thanh toán, email và Telegram.",
    permissions: ["users.manage", "settings.manage", "notifications.manage"],
    paths: ["/admin/users", "/admin/settings", "/admin/telegram"],
    links: [
      { label: "Tài khoản & Quyền", to: "/admin/users" },
      { label: "Cài đặt thanh toán", to: "/admin/settings/payments" },
      { label: "Tuỳ chỉnh email", to: "/admin/settings/emails" },
    ],
    sections: [
      {
        id: "tai-khoan",
        title: "Tài khoản và phân quyền",
        steps: [
          "Vào Tài khoản & Quyền → mặc định hiển thị bảng ma trận: mỗi hàng là một tài khoản, mỗi cột là một vai trò.",
          "Tick hoặc bỏ tick ô giao nhau để cấp/gỡ vai trò — hệ thống lưu ngay, có thông báo xác nhận.",
          "Cuộn ngang để xem hết các nhóm vai trò; cột tài khoản luôn được ghim bên trái.",
          "Bấm 'Danh sách' nếu muốn xem chi tiết từng người và sửa nhiều vai trò trong một hộp thoại.",
          "Bấm 'Vai trò × Quyền' để mở bảng nhiệm vụ theo vai trò: mỗi hàng là một quyền (nhóm theo khối, ghi rõ Xem/Sửa), mỗi cột là một vai trò.",
          "Tick ô trong bảng Vai trò × Quyền là lưu ngay và áp dụng cho mọi tài khoản đang mang vai trò đó; người đang đăng nhập thấy thay đổi khi tải lại trang.",
          "Ô có chấm vàng nghĩa là đã khác mặc định hệ thống; dùng nút 'Đặt lại' theo vai trò hoặc 'Đặt lại toàn bộ' để quay về mặc định.",
          "Bảng Vai trò × Quyền phủ toàn bộ chức năng hệ thống: Lead (xem/xử lý/phân phối), Hồ sơ học viên (xem/sửa/nơi đến & hợp đồng/xuất 360°), Kho lưu trữ, Tra soát, Visa, Xuất cảnh, Workflow, SLA, toàn bộ khối Đào tạo (chương trình, lớp, lịch, giám sát, điểm danh, điểm số, giáo viên, bài học, tài liệu, bài kiểm tra, chứng chỉ), E-learning (xem/sửa khoá học, đơn hàng), Chatbot (xem/cấu hình), Nội dung & SEO (CMS, media, banner, popup, hành trình, chiến dịch), Báo cáo, Danh mục, Tài khoản, Cài đặt thanh toán/email, Telegram.",
          "Quyền 'Sửa' tự bao hàm quyền 'Xem' tương ứng — chỉ cần tick ô Sửa là đủ.",
          "Từ nay quyền trong bảng này quyết định cả thao tác dữ liệu (lưu, xoá, xuất file) chứ không chỉ menu và trang: bỏ tick một quyền là thao tác tương ứng bị từ chối ngay ở máy chủ, dù người dùng gõ thẳng địa chỉ.",
          "Đặt lại mật khẩu khi nhân sự quên, yêu cầu đổi lại sau khi đăng nhập.",
          "Nhân sự nghỉ việc: gỡ toàn bộ vai trò ngay trong ngày.",
        ],
        rules: [
          "Chỉ cấp vai trò Quản trị viên cho số ít người chịu trách nhiệm hệ thống — không gán kèm mọi vai trò nghiệp vụ khác cho cùng một người.",
          "Gán vai trò theo đúng trách nhiệm công việc thực tế, mỗi người chỉ giữ vai trò cần cho phần việc của mình.",
          "Không thể tự gỡ quyền Quản trị viên của chính mình.",
          "Không dùng chung một tài khoản cho nhiều nhân sự.",
        ],
      },
      {
        id: "kho-quyen",
        title: "Kho quyền theo module",
        intro:
          "Mỗi trang trong khu quản trị đều gắn với một quyền cụ thể; thiếu quyền thì gõ thẳng địa chỉ cũng bị chặn.",
        rules: [
          "Khối Vận hành & Đào tạo được tách theo cặp Xem / Sửa cho từng trang: hồ sơ học viên, kho lưu trữ, visa, workflow, SLA, chương trình, lớp học, lịch trung tâm, giám sát lớp, điểm danh, điểm số, giáo viên, bài học, tài liệu, bài kiểm tra, chứng chỉ, danh mục.",
          "Có quyền Xem là vào được trang; thiếu quyền Sửa thì trang hiện ở chế độ chỉ xem và mọi nút thao tác bị khoá.",
          "Trưởng phòng đào tạo: xem toàn khối, sửa toàn bộ nhánh đào tạo, hồ sơ học viên, danh mục, chứng chỉ.",
          "Nhân viên đào tạo: xem toàn khối; chỉ sửa lớp học, lịch, điểm danh, bài học, tài liệu.",
          "Giáo viên: xem lớp/lịch/bài học/tài liệu/bài kiểm tra; sửa điểm danh, điểm số, bài học, tài liệu, bài kiểm tra. Không xem danh sách hồ sơ học viên toàn hệ thống, không cấp chứng chỉ.",
          "Tư vấn & CSKH: xem + sửa hồ sơ học viên, xem visa, xem kho lưu trữ.",
          "Cán bộ visa và điều phối xuất cảnh: thêm quyền sửa visa và chuyển bước workflow.",
          "Trưởng thị trường: xem toàn khối, thêm tra soát nhật ký, sửa hồ sơ học viên và workflow.",
          "Các quyền tách riêng khác: Tổng quan khối vận hành, Kho lưu trữ hồ sơ vật lý, Tra soát nhật ký trách nhiệm, Chiến dịch marketing, Cấu hình cảnh báo Telegram.",
        ],

      },
      {
        id: "cai-dat",
        title: "Cài đặt thanh toán, email, Telegram",
        steps: [
          "Thanh toán: bật/tắt cổng thanh toán, kiểm tra giao dịch thử trước khi mở bán.",
          "Email: chỉnh mẫu email gửi học viên và khách hàng, gửi thử trước khi lưu.",
          "Telegram: cấu hình kênh nhận cảnh báo lead mới và lỗi hệ thống.",
        ],
      },
    ],
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Bài hướng dẫn phù hợp với đường dẫn admin đang mở (khớp tiền tố dài nhất). */
export function guideForPath(pathname: string): Guide | undefined {
  let best: { guide: Guide; len: number } | undefined;
  for (const g of GUIDES) {
    for (const p of g.paths) {
      if ((pathname === p || pathname.startsWith(p + "/")) && (!best || p.length > best.len)) {
        best = { guide: g, len: p.length };
      }
    }
  }
  return best?.guide;
}
