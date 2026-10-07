import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
})

/**
 * Trang hủy đăng ký cũ. Việc hủy nhận email hiện được xử lý qua liên kết
 * "Hủy đăng ký" ở cuối mỗi email mới; trang này chỉ còn để hướng dẫn cho các
 * liên kết cũ đã gửi trước đó.
 */
function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border rounded-2xl p-8 shadow-sm text-center space-y-4">
        <h1 className="text-2xl font-semibold">Hủy đăng ký nhận email</h1>
        <p className="text-muted-foreground">
          Liên kết này đã hết hiệu lực. Để ngừng nhận email từ Kaizen Manpower, vui lòng dùng liên kết
          "Hủy đăng ký" ở cuối email gần nhất bạn nhận được.
        </p>
      </div>
    </div>
  )
}
