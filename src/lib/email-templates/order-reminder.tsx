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
  totalVnd: number
  checkoutUrl: string
  reminderIndex?: number // 1..N — dùng để tuỳ giọng văn
  overrideIntroHtml?: string
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫'

const OrderReminder = ({
  customerName,
  orderNo,
  items,
  totalVnd,
  checkoutUrl,
  reminderIndex = 1,
  overrideIntroHtml,
}: Props) => {
  const defaultHeadline =
    reminderIndex >= 3
      ? 'Đơn hàng của bạn sắp hết hạn — chỉ còn ít thời gian'
      : reminderIndex === 2
        ? 'Bạn còn quên đơn hàng khoá học?'
        : 'Nhắc nhẹ: đơn hàng đang chờ thanh toán'
  return (
    <Html lang="vi" dir="ltr">
      <Head />
      <Preview>Đơn hàng {orderNo} đang chờ thanh toán tại Kaizen Manpower</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Kaizen Manpower</Heading>
          <Section style={card}>
            {overrideIntroHtml ? (
              <div dangerouslySetInnerHTML={{ __html: overrideIntroHtml }} />
            ) : (
              <>
                <Heading as="h2" style={h2}>{defaultHeadline}</Heading>
                <Text style={text}>
                  Xin chào {customerName || 'bạn'}, đơn hàng <strong>#{orderNo}</strong> của bạn
                  vẫn chưa được thanh toán. Hoàn tất ngay để mở khoá học hôm nay.
                </Text>
              </>
            )}

            <Hr style={hr} />
            {items.map((it, i) => (
              <Text key={i} style={itemLine}>
                <strong>{it.title}</strong>
                {it.qty > 1 ? ` × ${it.qty}` : ''} — {fmt(it.price_vnd * it.qty)}
              </Text>
            ))}
            <Hr style={hr} />
            <Text style={total}>Tổng cần thanh toán: {fmt(totalVnd)}</Text>

            <Section style={{ textAlign: 'center', marginTop: 20 }}>
              <Button style={btn} href={checkoutUrl}>Thanh toán ngay</Button>
              <Text style={muted}>Hoặc mở đường dẫn: {checkoutUrl}</Text>
            </Section>
          </Section>
          <Text style={footer}>
            Kaizen Manpower — Nếu bạn đã thanh toán, vui lòng bỏ qua email này.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderReminder,
  subject: (d: Record<string, any>) =>
    `[Kaizen] Nhắc thanh toán đơn ${d.orderNo}`,
  displayName: 'Nhắc thanh toán đơn hàng',
  previewData: {
    customerName: 'Nguyễn Văn A',
    orderNo: 'KZDEMO123',
    items: [{ title: 'Khoá tiếng Hàn sơ cấp', price_vnd: 2500000, qty: 1 }],
    totalVnd: 2500000,
    checkoutUrl: 'https://kaizenmanpower.com/thanh-toan/demo',
    reminderIndex: 1,
  },
} satisfies TemplateEntry

export default OrderReminder

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px', margin: '0 auto' }
const h1 = { color: '#3F7D3A', fontSize: '22px', margin: '0 0 16px' }
const h2 = { color: '#0f172a', fontSize: '18px', margin: '0 0 12px' }
const card = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }
const text = { color: '#1f2937', fontSize: '14px', lineHeight: '22px', margin: '0 0 8px' }
const itemLine = { color: '#0f172a', fontSize: '14px', lineHeight: '22px', margin: 0 }
const total = { color: '#0f172a', fontSize: '16px', fontWeight: 700, margin: '8px 0 0' }
const muted = { color: '#64748b', fontSize: '12px', margin: '12px 0 0' }
const hr = { borderColor: '#e2e8f0', margin: '16px 0' }
const btn = {
  backgroundColor: '#c1121f', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', textDecoration: 'none', fontSize: '15px', fontWeight: 600,
}
const footer = { color: '#94a3b8', fontSize: '12px', textAlign: 'center' as const, marginTop: '24px' }
