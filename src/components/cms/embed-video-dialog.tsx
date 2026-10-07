import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";
import { toast } from "sonner";

/** Chuẩn hoá link YouTube/Vimeo về URL nhúng. */
export function toEmbedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  const yt =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return null;
}

export function EmbedVideoDialog({ onInsert }: { onInsert: (html: string) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  function submit() {
    const embed = toEmbedUrl(url);
    if (!embed) {
      toast.error("Link chưa hợp lệ — dán link YouTube hoặc Vimeo.");
      return;
    }
    const safeTitle = (title.trim() || "Video Kaizen").replace(/"/g, "'");
    onInsert(
      `\n<figure class="video-embed" style="position:relative;width:100%;aspect-ratio:16/9;margin:1.5rem 0">\n  <iframe src="${embed}" title="${safeTitle}" loading="lazy" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px"></iframe>\n</figure>\n`,
    );
    setUrl("");
    setTitle("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" title="Chèn video">
          <Video className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chèn video</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Link YouTube hoặc Vimeo</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label className="text-xs">Tiêu đề video (cho SEO)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Lễ xuất cảnh Nhật Bản 2026" />
          </div>
          <Button type="button" className="w-full" onClick={submit}>
            Chèn vào nội dung
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
