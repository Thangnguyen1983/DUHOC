import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>Mã xác thực KAIZEN</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Mã xác thực lại</Heading>
        <Text style={text}>Sử dụng mã bên dưới để xác nhận danh tính:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>Mã hết hạn sau ít phút. Nếu bạn không yêu cầu, hãy bỏ qua email.</Text>
        <Text style={brand}>KAIZEN · Du học · XKLĐ · Ngoại ngữ</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 18px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '26px', fontWeight: 'bold' as const, color: '#DC2626', letterSpacing: '4px', margin: '0 0 28px' }
const footer = { fontSize: '12px', color: '#6B7280', margin: '28px 0 8px' }
const brand = { fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }
