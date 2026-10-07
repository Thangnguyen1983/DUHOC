import type { ComponentType } from 'react'
import { template as testEmailTemplate } from './test-email'
import { template as orderConfirmationTemplate } from './order-confirmation'
import { template as orderReminderTemplate } from './order-reminder'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'test-email': testEmailTemplate,
  'order-confirmation': orderConfirmationTemplate,
  'order-reminder': orderReminderTemplate,
}

/** Danh sách biến hợp lệ có thể chèn `{{var}}` trong subject/intro. Hiển thị trong UI. */
export const TEMPLATE_VARIABLES: Record<string, string[]> = {
  'order-confirmation': ['customerName', 'orderNo', 'totalVnd', 'checkoutUrl'],
  'order-reminder': ['customerName', 'orderNo', 'totalVnd', 'checkoutUrl', 'reminderIndex'],
  'test-email': ['sentAt', 'domain'],
}
