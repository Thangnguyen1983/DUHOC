import { createEmailWebhookHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'

type SuppressReason = 'bounce' | 'complaint' | 'unsubscribe'

const STATUS: Record<SuppressReason, 'bounced' | 'complained' | 'suppressed'> = {
  bounce: 'bounced',
  complaint: 'complained',
  unsubscribe: 'suppressed',
}

const MESSAGE: Record<SuppressReason, string> = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

/**
 * Ghi nhận kết quả gửi vào các bảng theo dõi của ứng dụng (chỉ để hiển thị /
 * thống kê — việc chặn gửi đã do Lovable thực hiện phía máy chủ).
 * Idempotent theo email (upsert) nên an toàn khi được gửi lại.
 */
async function recordOutcome(
  reason: SuppressReason,
  recipient: string,
  messageId: string | null | undefined,
  eventId: string,
) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const email = recipient.toLowerCase()

  const { error: suppressError } = await supabaseAdmin
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (suppressError) {
    console.error('[email-events] suppressed_emails upsert failed', {
      code: suppressError.code,
      message: suppressError.message,
      event_id: eventId,
    })
    throw new Error('Failed to write suppression')
  }

  const { error: logError } = await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId ?? null,
    template_name: 'system',
    recipient_email: email,
    status: STATUS[reason],
    error_message: MESSAGE[reason],
    metadata: null,
  })
  if (logError) {
    console.error('[email-events] email_send_log insert failed', {
      code: logError.code,
      message: logError.message,
      event_id: eventId,
    })
    throw new Error('Failed to write send log')
  }
}

export const Route = createFileRoute("/lovable/email/events")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }
        const handler = createEmailWebhookHandler({
          apiKey,
          on: {
            'email.bounced': async (event) => {
              await recordOutcome('bounce', event.data.recipient, event.data.message_id, event.event_id)
            },
            'email.complaint': async (event) => {
              await recordOutcome('complaint', event.data.recipient, event.data.message_id, event.event_id)
            },
            'email.unsubscribed': async (event) => {
              await recordOutcome('unsubscribe', event.data.recipient, event.data.message_id, event.event_id)
            },
          },
        })
        return handler(request)
      },
    },
  },
})
