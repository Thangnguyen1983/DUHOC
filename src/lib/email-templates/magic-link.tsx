import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>Link đăng nhập KAIZEN</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Link đăng nhập</Heading>
        <Text style={text}>Nhấn nút bên dưới để đăng nhập vào KAIZEN. Link sẽ hết hạn sau ít phút.</Text>
        <Button style={button} href={confirmationUrl}>Đăng nhập</Button>
        <Text style={footer}>Nếu bạn không yêu cầu, hãy bỏ qua email này.</Text>
        <Text style={brand}>KAIZEN · Du học · XKLĐ · Ngoại ngữ</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 18px' }
const button = { backgroundColor: '#DC2626', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 22px', textDecoration: 'none', fontWeight: 'bold' as const }
const footer = { fontSize: '12px', color: '#6B7280', margin: '28px 0 8px' }
const brand = { fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }
