import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

const GROUPS: { label: string; items: string[] }[] = [
  {
    label: "Học tập",
    items: ["📚", "🎓", "📝", "🖊️", "🧠", "💡", "🏫", "👩‍🏫", "📖", "🗂️", "🧑‍💻", "🔎"],
  },
  {
    label: "Quốc gia",
    items: ["🇯🇵", "🇰🇷", "🇹🇼", "🇩🇪", "🇭🇺", "🇵🇱", "🇷🇴", "🇸🇰", "🇱🇻", "🇧🇬", "🇻🇳", "🌏"],
  },
  {
    label: "Đánh dấu",
    items: ["✅", "⚠️", "📌", "⭐", "🔥", "❗", "➡️", "🔔", "🎯", "🏆", "💯", "🕒"],
  },
  {
    label: "Liên hệ",
    items: ["📞", "📧", "💬", "📍", "🌐", "🤝", "🧾", "💰", "🛂", "✈️", "🏢", "📅"],
  },
];

export function IconPicker({ onPick }: { onPick: (icon: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" title="Chèn icon">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="start">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="mb-1 text-xs font-semibold text-muted-foreground">{g.label}</div>
            <div className="grid grid-cols-6 gap-1">
              {g.items.map((it) => (
                <button
                  key={it}
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-md text-lg hover:bg-muted"
                  onClick={() => {
                    onPick(it);
                    setOpen(false);
                  }}
                >
                  {it}
                </button>
              ))}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
