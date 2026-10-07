import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>Đặt lại mật khẩu KAIZEN</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Đặt lại mật khẩu</Heading>
        <Text style={text}>
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản KAIZEN của bạn. Nhấn nút bên dưới để tạo mật khẩu mới.
        </Text>
        <Button style={button} href={confirmationUrl}>Đặt lại mật khẩu</Button>
        <Text style={footer}>
          Link có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email — mật khẩu sẽ không thay đổi.
        </Text>
        <Text style={brand}>KAIZEN · Du học · XKLĐ · Ngoại ngữ</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 18px' }
const button = { backgroundColor: '#DC2626', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 22px', textDecoration: 'none', fontWeight: 'bold' as const }
const footer = { fontSize: '12px', color: '#6B7280', margin: '28px 0 8px' }
const brand = { fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }
