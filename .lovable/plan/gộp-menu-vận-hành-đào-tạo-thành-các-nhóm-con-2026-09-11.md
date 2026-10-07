# Gộp menu "Vận hành & Đào tạo" thành các nhóm con

## Mục tiêu
Tổ chức lại menu trong nhóm **Vận hành & Đào tạo** (sidebar admin) thành các nhóm con rõ ràng theo đúng yêu cầu, giúp người quản trị dễ định vị chức năng hơn.

## Cấu trúc menu mới

```text
Vận hành & Đào tạo
├── Tổng quan khối                    (/admin/van-hanh)
│
├── Quản lý học viên                  (nhóm con, gập/mở)
│   ├── Hồ sơ học viên                (/admin/students)
│   └── Kho lưu trữ hồ sơ             (/admin/luu-tru)
│
├── Quản lý đào tạo                   (nhóm con, gập/mở)
│   ├── Giáo viên                     (/admin/teachers)
│   ├── Tài liệu học tập              (/admin/materials)
│   ├── Chương trình                  (/admin/training)
│   ├── Giám sát lớp học              (/admin/training/oversight)
│   ├── Bài kiểm tra                  (/admin/quizzes)
│   └── Chứng chỉ                     (/admin/certificates)
│
├── Tra soát trách nhiệm              (/admin/tra-soat)
├── Quản lý xuất cảnh                 (/admin/xuat-canh)
├── Danh mục hệ thống                 (/admin/catalog)
└── SLA & Cấp tài khoản               (/admin/operations)
```

## Nguyên tắc giữ nguyên
- **Không đổi đường dẫn**: mọi route, quyền (permission key), phân quyền vai trò, luồng dữ liệu đều giữ nguyên 100% — chỉ thay đổi cách hiển thị trong sidebar.
- Các mục đang ẩn khỏi menu (Thống kê visa, Thống kê đào tạo, Workflow 18 bước, Bài học) vẫn ẩn như hiện tại.
- Điều kiện hiển thị theo quyền (`can(...)` / `canAny(...)`) giữ nguyên cho từng mục; nhóm con chỉ hiện khi có ít nhất 1 mục con được cấp quyền.
- Trạng thái gập/mở của từng nhóm con lưu localStorage như cơ chế NavGroup hiện có; nhóm chứa trang đang mở tự bung.
- Giữ nguyên icon màu 3D, tone màu hiện tại của từng mục.

## Các mục chưa được bạn nêu trong 2 nhóm — đề xuất vị trí
| Mục | Đề xuất | Lý do |
|---|---|---|
| Tổng quan khối | Đặt đầu nhóm lớn (ngoài nhóm con) | Là trang landing tổng quan, nên thấy ngay |
| Tra soát trách nhiệm | Mục riêng dưới 2 nhóm | Thuộc kiểm soát/audit, không thuần học viên hay đào tạo |
| Quản lý xuất cảnh | Mục riêng | Bạn từng yêu cầu nó là danh mục độc lập trên menu chính |
| Danh mục hệ thống | Mục riêng cuối nhóm | Công cụ cấu hình dùng chung |
| SLA & Cấp tài khoản | Mục riêng cuối nhóm | Công cụ vận hành hệ thống |

Nếu bạn muốn xếp khác (ví dụ đưa Xuất cảnh vào nhóm Quản lý học viên), ghi chú khi duyệt.

## Thay đổi kỹ thuật
- **`src/routes/_authenticated/route.tsx`**: trong `NavTree`, bọc các `NavItem` tương ứng bằng 2 `NavGroup` lồng bên trong `NavGroup` "Vận hành & Đào tạo". NavGroup hiện đã hỗ trợ lồng nhau (children là ReactNode); kiểm tra hiển thị thụt lề/màu nhóm con rõ ràng, tinh chỉnh CSS nhỏ nếu cần (chỉ thụt lề, không đổi token màu).
- **`src/lib/help/guides.ts`**: bổ sung 1 dòng trong hướng dẫn Vận hành/Đào tạo mô tả cấu trúc menu mới (theo quy ước: mọi thay đổi module đều cập nhật hướng dẫn).

## Kiểm chứng
- `bunx tsgo --noEmit` + test RBAC route coverage + build.
- Playwright: mở sidebar ở desktop và mobile (Sheet), kiểm tra 2 nhóm con bung/gập đúng, điều hướng tới từng route hoạt động, không tràn ngang ở 390px.
