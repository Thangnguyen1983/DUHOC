# Trung tâm điều khiển

Ứng dụng độc lập: bạn ra lệnh theo skill kiểu [gstack](https://github.com/garrytan/gstack), agent thực hiện trên một thư mục dự án, còn **mọi thao tác ghi file, chạy lệnh có tác động và các quyết định quan trọng đều chờ bạn duyệt**.

## Chạy

```bash
export ANTHROPIC_API_KEY=sk-ant-...      # bắt buộc để agent thực thi
# tuỳ chọn: CC_MODEL (mặc định claude-sonnet-5-5), CC_ROOTS (thư mục được phép, cách nhau bằng ':'), PORT (4577)
node server.mjs                           # in ra đường dẫn kèm token
npm test                                  # 13 test (an toàn + luồng đầy đủ)
```

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

`data/skills/*.json`: 52 đặc tả (mục tiêu, bước, cổng duyệt, đầu ra) viết lại từ SKILL.md của gstack. 31 skill chạy được; 21 skill cần trình duyệt/thiết bị/dịch vụ riêng hiển thị mờ kèm lý do; careful/freeze/guard/unfreeze được thực thi bằng bảng An toàn và chính sách công cụ.
