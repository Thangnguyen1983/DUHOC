import * as React from 'react'
import { render as renderAsync } from '@react-email/components'
import { EmailAPIError, sendLovableEmail } from '@lovable.dev/email-js'

const SITE_NAME = 'Kaizen Manpower'
const SENDER_DOMAIN = 'cskh.kaizenmanpower.com'
const FROM_DOMAIN = 'kaizenmanpower.com'

/**
 * Server-only helper: render một template đã đăng ký (kèm override do admin
 * cấu hình) và gửi trực tiếp qua hệ thống email được quản lý của Lovable.
 * Chỉ dùng trong server functions/route handlers đã xác thực người gọi.
 * Không throw — trả về { ok } để không phá luồng chính.
 *
 * Gửi trực tiếp bằng sendLovableEmail (thay vì sendTemplateEmail) vì tiêu đề
 * và phần mở đầu HTML được ghép tại thời điểm gửi từ bản override.
 */
export async function enqueueTransactionalEmail(params: {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, any>
}): Promise<{ ok: boolean; reason?: string }> {
  const messageId = crypto.randomUUID()
  let to = params.recipientEmail
  try {
    const { TEMPLATES } = await import('@/lib/email-templates/registry')
    const template = TEMPLATES[params.templateName]
    if (!template) return { ok: false, reason: 'template_not_found' }

    to = template.to || params.recipientEmail
    if (!to) return { ok: false, reason: 'no_recipient' }

    const apiKey = process.env['LOVABLE_API_KEY']
    if (!apiKey) {
      console.error('enqueueTransactionalEmail: LOVABLE_API_KEY is not configured')
      return { ok: false, reason: 'not_configured' }
    }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    // Áp dụng override do admin cấu hình (nếu có): thay tiêu đề và inject
    // phần mở đầu HTML tuỳ biến vào prop `overrideIntroHtml`.
    const { getActiveOverride, interpolate, tinyMarkdownToHtml } = await import('./template-override.server')
    const override = await getActiveOverride(params.templateName)
    const dataForRender: Record<string, any> = { ...(params.templateData ?? {}) }
    if (override) {
      dataForRender.overrideIntroHtml = tinyMarkdownToHtml(interpolate(override.introMarkdown, dataForRender))
    }

    const el = React.createElement(template.component, dataForRender)
    const html = await renderAsync(el)
    const text = await renderAsync(el, { plainText: true })
    const baseSubject = typeof template.subject === 'function' ? template.subject(dataForRender) : template.subject
    const subject = override?.subject ? interpolate(override.subject, dataForRender) : baseSubject

    const idempotencyKey = params.idempotencyKey || messageId

    const logRow = async (status: 'sent' | 'suppressed' | 'failed', errorMessage?: string) => {
      const { error } = await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: params.templateName,
        recipient_email: to,
        status,
        error_message: errorMessage ?? null,
      })
      if (error) console.error('[email] email_send_log insert failed', { code: error.code, message: error.message })
    }

    try {
      await sendLovableEmail(
        {
          to,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject,
          html,
          text,
          purpose: 'transactional',
          label: params.templateName,
          idempotency_key: idempotencyKey,
        },
        { apiKey, sendUrl: process.env['LOVABLE_SEND_URL'] },
      )
    } catch (err) {
      if (err instanceof EmailAPIError && err.code === 'recipient_suppressed') {
        await logRow('suppressed', 'recipient suppressed')
        return { ok: false, reason: 'suppressed' }
      }
      const message = err instanceof Error ? err.message : String(err)
      console.error('enqueueTransactionalEmail send failed', message)
      await logRow('failed', message.slice(0, 500))
      return { ok: false, reason: 'send_failed' }
    }

    await logRow('sent')
    return { ok: true }
  } catch (e) {
    console.error('enqueueTransactionalEmail exception', e)
    return { ok: false, reason: 'exception' }
  }
}
