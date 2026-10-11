# Trung tâm điều khiển

Ứng dụng độc lập: bạn ra lệnh theo skill kiểu [gstack](https://github.com/garrytan/gstack), agent thực hiện trên một thư mục dự án, còn **mọi thao tác ghi file, chạy lệnh có tác động và các quyết định quan trọng đều chờ bạn duyệt**.

## Chạy (trên máy của bạn)

Cần [Node.js 20+](https://nodejs.org). Clone repo, rồi:

- **Mac/Linux:** `./start.sh`  ·  **Windows:** nhấp đôi `start.bat`  ·  hoặc `node server.mjs`
- Máy chủ in ra **đường link** dạng `http://127.0.0.1:4577/?token=…` và tự mở trình duyệt. Link **cố định** (token lưu ở `data/token`), lưu làm dấu trang được. Link chỉ mở được trên chính máy đang chạy, đó là chủ ý: ứng dụng có thể chạy lệnh trên máy bạn nên không nên công khai ra Internet.
- **Nhập khoá API:** bấm nút **Khoá API** ở góc phải giao diện, hoặc mở tệp `command-center/.env.local` và điền `ANTHROPIC_API_KEY=sk-ant-...`. Khoá nằm trong tệp đó (quyền 600, đã loại khỏi git), không bao giờ được gửi lại cho trình duyệt hay ghi vào nhật ký.
- Tuỳ chọn: `CC_MODEL` (mặc định claude-sonnet-5-5), `CC_ROOTS` (thư mục được phép, cách nhau bằng `:`), `PORT` (4577).
- `npm test`: 22 test (an toàn, luồng, trình duyệt, Nhà máy, khoá API).

Không cần cài thư viện (Node ≥ 20). Mặc định chỉ cho làm việc trong thư mục cha của `command-center/`.

## Cách dùng

1. Mở đường dẫn in ra khi khởi động. Chọn workspace và chế độ sửa file.
2. Gõ `/review ...` (hoặc chọn skill bên trái). Gõ câu tự do thì hệ thống chỉ **gợi ý** skill, bạn bấm mới chạy.
3. Theo dõi dòng thời gian. Thẻ **Cần duyệt** hiện diff file hoặc lệnh; bấm Duyệt/Từ chối. Thẻ **Cần quyết định** là câu hỏi agent không được tự trả lời.
4. Xong lượt, các nút **Bước tiếp** (ví dụ review → ship) chỉ chạy khi bạn bấm; báo cáo bước trước được đưa vào như dữ liệu.
5. **Quy trình** dựng sẵn: Sprint đầy đủ, Review rồi ship, Sửa lỗi, Rà soát bảo mật. **Freeze** khoá việc sửa file trong một thư mục.

## Nguyên tắc an toàn (rút từ gstack, xem `docs/`)

- Người dùng quyết định, AI đề xuất: ghi file và lệnh không-chỉ-đọc luôn qua duyệt (chế độ "tự sửa" chỉ bỏ duyệt file thường, không bỏ duyệt lệnh; skill ship/deploy luôn hỏi).
- Lệnh chỉ-đọc (`git status`, `ls`, `grep`…) chạy ngay; `rm -rf /`, force-push nhánh chính… bị chặn cứng; `git push`, cài gói, `curl`, `reset --hard`… luôn hỏi. Không có skill nào tự push/merge.
- File `.env`, khoá riêng không đọc/ghi được; đường dẫn ngoài workspace (kể cả qua symlink) bị từ chối; bí mật trong kết quả bị che trước khi hiển thị/ghi nhật ký.
- Nội dung repo và kết quả lệnh được bọc `<untrusted_data>`; skill chỉ-đọc (cso, health, test-audit…) không có công cụ ghi.
- Chỉ nghe `127.0.0.1`, cần token (cookie HttpOnly), kiểm Host/Origin. Nhật ký kiểm toán: `data/audit.jsonl`.
- Rào chắn này chống nhầm lẫn, không phải sandbox: hãy chạy trên workspace bạn chấp nhận rủi ro.

## Skill

`data/skills/*.json`: 52 đặc tả (mục tiêu, bước, cổng duyệt, đầu ra) viết lại từ SKILL.md của gstack. 38 skill chạy được; 10 skill cần thiết bị/dịch vụ riêng (iOS-không có, GBrain, cookie, ghép agent, tạo ảnh…) hiển thị mờ kèm lý do; careful/freeze/guard/unfreeze được thực thi bằng bảng An toàn và chính sách công cụ.

## Trình duyệt (qa, qa-only, design-review, devex-review, canary, browse, scrape)

Cần Playwright (`playwright-core` hoặc `CC_PLAYWRIGHT=/đường/dẫn`) và Chromium (`CC_CHROMIUM` nếu không dùng bản mặc định). Mỗi lượt chạy dùng ngữ cảnh trống (không cookie, không đăng nhập), đóng khi kết thúc.
- `localhost` mở ngay; **mỗi trang ngoài phải được bạn duyệt theo origin**, và mọi thao tác bấm/điền trên trang ngoài đều hỏi lại.
- Chặn `file:`, `javascript:`, mạng nội bộ và địa chỉ metadata (kể cả yêu cầu do trang tự gọi). Không nhập cookie, không chạy JS tuỳ ý.
- Nội dung trang là dữ liệu không tin cậy. Ảnh chụp gửi cho mô hình và hiện trong dòng thời gian.

## Nhà máy ứng dụng (tab "Nhà máy ứng dụng")

Nghiên cứu thị trường → kế hoạch → **bạn duyệt** → tự sản xuất → review + bảo mật → sẵn sàng giao.

1. **Nghiên cứu** (`/market-research`, chỉ đọc, dùng công cụ tìm kiếm web của API): trả về cơ hội kèm nguồn. Cơ hội dưới 2 nguồn độc lập bị gắn "chưa kiểm chứng" và bị hạ điểm nhu cầu xuống tối đa 4; URL không phải http(s) bị loại. Có thể bật **lịch tự nghiên cứu** (chỉ đọc, có trần số lần/ngày, chỉ chạy khi máy chủ mở).
2. **Kế hoạch** (`/app-plan`): phạm vi MVP, kiến trúc, tiêu chí nghiệm thu đo được, tác vụ. Bạn có thể **từ chối kèm phản hồi** để lập lại.
3. **Duyệt**: nút Duyệt gửi hash của kế hoạch đang hiển thị; hash lệch (kế hoạch đã đổi) thì bị từ chối. Chỉ sau đó mới có thư mục dự án (`data/factory/projects/<id>`, git cục bộ).
4. **Sản xuất tự động** (`factory-build` → `review` → `cso`), chạy trong thư mục dự án: ghi file tự động; tự chạy `npm ci/install --ignore-scripts`, `npm test`, `npm run build|lint|test`, `node ...`, `git add/commit` cục bộ. Mọi lệnh khác (kể cả `git push`, `npm publish`, `curl`, `npx`) vẫn **chờ bạn duyệt**. Bước nào BLOCKED thì chuỗi dừng.
5. **Giao ra ngoài** (push, PR, deploy) không thuộc chuỗi tự động: bạn tự quyết sau khi xem kết quả.

Ngân sách: `CC_FACTORY_TOKEN_CAP` (mặc định 2.000.000 token cho toàn Nhà máy), `CC_BUILD_TOKEN_CAP` (600.000/lượt build), `CC_RUN_TOKEN_CAP` (150.000/lượt khác). Hết ngân sách thì không bắt đầu việc mới.

Giới hạn trung thực: "nhu cầu cao" là suy luận từ tín hiệu web công khai, không phải bảo đảm thương mại; hãy tự kiểm tra các nguồn trước khi duyệt. Cài gói npm chạy trong máy bạn (đã tắt script cài đặt nhưng vẫn là mã của bên thứ ba); chỉ dùng trên máy/ môi trường bạn chấp nhận rủi ro.
