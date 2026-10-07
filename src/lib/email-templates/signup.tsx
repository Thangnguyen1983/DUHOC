import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>Xác nhận email cho {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Xác nhận email của bạn</Heading>
        <Text style={text}>
          Cảm ơn bạn đã đăng ký tài khoản tại{' '}
          <Link href={siteUrl} style={link}><strong>KAIZEN</strong></Link>.
        </Text>
        <Text style={text}>
          Vui lòng xác nhận email <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link> bằng cách nhấn nút bên dưới:
        </Text>
        <Button style={button} href={confirmationUrl}>Xác nhận email</Button>
        <Text style={footer}>Nếu bạn không tạo tài khoản này, bạn có thể bỏ qua email này.</Text>
        <Text style={brand}>KAIZEN · Du học · XKLĐ · Ngoại ngữ</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 18px' }
const link = { color: '#DC2626', textDecoration: 'underline' }
const button = { backgroundColor: '#DC2626', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 22px', textDecoration: 'none', fontWeight: 'bold' as const }
const footer = { fontSize: '12px', color: '#6B7280', margin: '28px 0 8px' }
const brand = { fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }
