import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  sentAt?: string
  domain?: string
}

const TestEmail = ({ sentAt, domain }: Props) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>Kiểm tra hệ thống email Kaizen Manpower</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Kaizen Manpower</Heading>
        <Section style={card}>
          <Heading as="h2" style={h2}>
            Email kiểm tra hệ thống ✅
          </Heading>
          <Text style={text}>
            Đây là email kiểm tra hệ thống gửi từ domain{' '}
            <strong>{domain ?? 'cskh.kaizenmanpower.com'}</strong>.
          </Text>
          <Text style={text}>
            Nếu bạn nhận được email này, hệ thống email của Kaizen đã hoạt động
            bình thường và sẵn sàng dùng để gửi thông báo lead mới cho admin.
          </Text>
          <Text style={muted}>Thời gian gửi: {sentAt ?? new Date().toISOString()}</Text>
        </Section>
        <Text style={footer}>Kaizen Manpower — Hệ thống thông báo nội bộ</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TestEmail,
  subject: '[Kaizen] Email kiểm tra hệ thống',
  displayName: 'Test Email',
  previewData: { sentAt: new Date().toISOString(), domain: 'cskh.kaizenmanpower.com' },
} satisfies TemplateEntry

export default TestEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { color: '#0f172a', fontSize: '22px', margin: '0 0 16px' }
const h2 = { color: '#0f172a', fontSize: '18px', margin: '0 0 12px' }
const card = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
}
const text = { color: '#1f2937', fontSize: '14px', lineHeight: '22px', margin: '0 0 12px' }
const muted = { color: '#64748b', fontSize: '12px', margin: '12px 0 0' }
const footer = { color: '#94a3b8', fontSize: '12px', textAlign: 'center' as const, marginTop: '24px' }
