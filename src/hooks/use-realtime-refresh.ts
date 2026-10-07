import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lắng nghe thay đổi realtime trên các bảng nghiệp vụ và làm mới các query tương ứng.
 * Dùng cho các trang tổng quan / dashboard để số liệu tự cập nhật khi dữ liệu module thay đổi.
 */
export function useRealtimeRefresh(tables: string[], queryKeys: string[], channelName: string) {
  const qc = useQueryClient();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const invalidate = () => {
      if (timer) clearTimeout(timer);
      // gộp nhiều sự kiện trong 1,5s để tránh gọi lại liên tục
      timer = setTimeout(() => {
        for (const key of queryKeys) qc.invalidateQueries({ queryKey: [key] });
      }, 1500);
    };

    let channel = supabase.channel(channelName);
    for (const table of tables) {
      channel = channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table },
        invalidate,
      );
    }
    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);
}
