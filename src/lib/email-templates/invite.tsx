import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>Kích hoạt tài khoản KAIZEN và đặt mật khẩu</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Kích hoạt tài khoản KAIZEN</Heading>
        <Text style={text}>
          Bạn vừa được cấp một tài khoản trên hệ thống{' '}
          <Link href={siteUrl} style={link}><strong>KAIZEN</strong></Link>.
          Nhấn nút bên dưới để nhập <strong>họ tên</strong> và tạo <strong>mật khẩu</strong> cho tài khoản của bạn.
        </Text>
        <Button style={button} href={confirmationUrl}>Kích hoạt & đặt mật khẩu</Button>
        <Text style={hint}>
          Link kích hoạt có hiệu lực trong 24 giờ. Nếu nút không bấm được, hãy sao chép đường dẫn sau vào trình duyệt:
        </Text>
        <Text style={urlLine}>{confirmationUrl}</Text>
        <Text style={footer}>Nếu bạn không mong đợi lời mời này, hãy bỏ qua email.</Text>
        <Text style={brand}>KAIZEN · Du học · XKLĐ · Ngoại ngữ</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 18px' }
const link = { color: '#DC2626', textDecoration: 'underline' }
const button = { backgroundColor: '#DC2626', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 22px', textDecoration: 'none', fontWeight: 'bold' as const }
const hint = { fontSize: '12px', color: '#6B7280', margin: '22px 0 4px' }
const urlLine = { fontSize: '12px', color: '#374151', wordBreak: 'break-all' as const, margin: '0 0 18px' }
const footer = { fontSize: '12px', color: '#6B7280', margin: '28px 0 8px' }
const brand = { fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }
