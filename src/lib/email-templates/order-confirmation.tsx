import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface OrderItem {
  title: string
  price_vnd: number
  qty: number
}

interface Props {
  customerName?: string
  orderNo: string
  items: OrderItem[]
  subtotalVnd: number
  discountVnd: number
  totalVnd: number
  status: 'pending' | 'paid'
  paymentProvider?: string | null
  checkoutUrl?: string
  /** HTML rendered từ intro do admin cấu hình — thay cho lời chào mặc định. */
  overrideIntroHtml?: string
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫'

const OrderConfirmation = ({
  customerName,
  orderNo,
  items,
  subtotalVnd,
  discountVnd,
  totalVnd,
  status,
  checkoutUrl,
  overrideIntroHtml,
}: Props) => {
  const paid = status === 'paid'
  return (
    <Html lang="vi" dir="ltr">
      <Head />
      <Preview>
        {paid
          ? `Đã nhận thanh toán đơn ${orderNo} — Kaizen Manpower`
          : `Xác nhận đơn hàng ${orderNo} — vui lòng hoàn tất thanh toán`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Kaizen Manpower</Heading>
          <Section style={card}>
            {overrideIntroHtml ? (
              <div dangerouslySetInnerHTML={{ __html: overrideIntroHtml }} />
            ) : (
              <>
                <Heading as="h2" style={h2}>
                  {paid ? 'Cảm ơn bạn đã thanh toán 🎉' : 'Cảm ơn bạn đã đặt hàng'}
                </Heading>
                <Text style={text}>
                  Xin chào {customerName || 'bạn'}, chúng tôi đã ghi nhận đơn hàng{' '}
                  <strong>#{orderNo}</strong>.
                </Text>
              </>
            )}

            <Hr style={hr} />

            {items.map((it, i) => (
              <Section key={i} style={{ marginBottom: 8 }}>
                <Text style={itemLine}>
                  <strong>{it.title}</strong>
                  {it.qty > 1 ? ` × ${it.qty}` : ''} — {fmt(it.price_vnd * it.qty)}
                </Text>
              </Section>
            ))}

            <Hr style={hr} />

            <Text style={text}>Tạm tính: {fmt(subtotalVnd)}</Text>
            {discountVnd > 0 && (
              <Text style={text}>Giảm giá: -{fmt(discountVnd)}</Text>
            )}
            <Text style={total}>Tổng cộng: {fmt(totalVnd)}</Text>

            {!paid && checkoutUrl && (
              <Section style={{ textAlign: 'center', marginTop: 20 }}>
                <Button style={btn} href={checkoutUrl}>
                  Hoàn tất thanh toán
                </Button>
                <Text style={muted}>
                  Hoặc mở lại đường dẫn: {checkoutUrl}
                </Text>
              </Section>
            )}

            {paid && (
              <Text style={text}>
                Bạn có thể truy cập ngay khoá học trong khu vực học viên.
              </Text>
            )}
          </Section>
          <Text style={footer}>
            Kaizen Manpower — Nếu cần hỗ trợ, phản hồi email này hoặc gọi hotline.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderConfirmation,
  subject: (d: Record<string, any>) =>
    d.status === 'paid'
      ? `[Kaizen] Đã nhận thanh toán đơn ${d.orderNo}`
      : `[Kaizen] Xác nhận đơn hàng ${d.orderNo}`,
  displayName: 'Xác nhận đơn hàng khoá học',
  previewData: {
    customerName: 'Nguyễn Văn A',
    orderNo: 'KZDEMO123',
    items: [{ title: 'Khoá tiếng Hàn sơ cấp', price_vnd: 2500000, qty: 1 }],
    subtotalVnd: 2500000,
    discountVnd: 0,
    totalVnd: 2500000,
    status: 'pending',
    checkoutUrl: 'https://kaizenmanpower.com/thanh-toan/demo',
  },
} satisfies TemplateEntry

export default OrderConfirmation

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px', margin: '0 auto' }
const h1 = { color: '#3F7D3A', fontSize: '22px', margin: '0 0 16px' }
const h2 = { color: '#0f172a', fontSize: '18px', margin: '0 0 12px' }
const card = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
}
const text = { color: '#1f2937', fontSize: '14px', lineHeight: '22px', margin: '0 0 8px' }
const itemLine = { color: '#0f172a', fontSize: '14px', lineHeight: '22px', margin: 0 }
const total = { color: '#0f172a', fontSize: '16px', fontWeight: 700, margin: '8px 0 0' }
const muted = { color: '#64748b', fontSize: '12px', margin: '12px 0 0' }
const hr = { borderColor: '#e2e8f0', margin: '16px 0' }
const btn = {
  backgroundColor: '#3F7D3A',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 600,
}
const footer = { color: '#94a3b8', fontSize: '12px', textAlign: 'center' as const, marginTop: '24px' }
