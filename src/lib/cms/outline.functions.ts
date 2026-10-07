import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  keyword: z.string().min(2).max(200),
  title: z.string().max(300).optional(),
  intent: z.string().max(600).optional(),
  existing: z.array(z.string().max(200)).max(30).optional(),
});

export const suggestOutline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const { suggestOutlineAi } = await import("@/lib/cms/outline-ai.server");
    return await suggestOutlineAi(data);
  });
