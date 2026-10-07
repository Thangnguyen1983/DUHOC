import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "vi" | "en" | "ja" | "ko";

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
];

type Dict = Record<string, string>;

const T: Record<Lang, Dict> = {
  vi: {
    "nav.home": "Trang chủ",
    "nav.study": "Du học",
    "nav.export": "XKLĐ",
    "nav.languages": "Ngoại ngữ",
    "nav.news": "Tin tức",
    "nav.about": "Giới thiệu",
    "nav.contact": "Liên hệ",
    "nav.overview": "Tổng quan",
    "nav.studyAbroad": "Du học",
    "nav.laborExport": "Xuất khẩu lao động",
    "cta.register": "Đăng ký tư vấn",
    "company.tagline": "Nhân lực Quốc tế",
    "lang.label": "Ngôn ngữ",
    "nav.aboutKaizen": "Về Kaizen",
    "nav.manpower": "Nhân lực quốc tế",
    "nav.studyAbroadFull": "Du học quốc tế",
    "nav.languagesTraining": "Đào tạo ngoại ngữ",
    "nav.travelVisa": "Du lịch & Visa",
    "nav.outsourcing": "Outsourcing & Nhân sự",
    "nav.partners": "Đối tác toàn cầu",
    "nav.newsEvents": "Tin tức & Sự kiện",
  },
  en: {
    "nav.home": "Home",
    "nav.study": "Study Abroad",
    "nav.export": "Work Abroad",
    "nav.languages": "Languages",
    "nav.news": "News",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.overview": "Overview",
    "nav.studyAbroad": "Study Abroad",
    "nav.laborExport": "Work Abroad",
    "cta.register": "Free Consultation",
    "company.tagline": "International Manpower",
    "lang.label": "Language",
    "nav.aboutKaizen": "About Kaizen",
    "nav.manpower": "International Manpower",
    "nav.studyAbroadFull": "Study Abroad",
    "nav.languagesTraining": "Language Training",
    "nav.travelVisa": "Travel & Visa",
    "nav.outsourcing": "Outsourcing & HR Supply",
    "nav.partners": "Global Partners",
    "nav.newsEvents": "News & Events",
  },
  ja: {
    "nav.home": "ホーム",
    "nav.study": "留学",
    "nav.export": "海外就労",
    "nav.languages": "語学",
    "nav.news": "ニュース",
    "nav.about": "会社概要",
    "nav.contact": "お問い合わせ",
    "nav.overview": "概要",
    "nav.studyAbroad": "留学",
    "nav.laborExport": "海外就労",
    "cta.register": "無料相談",
    "company.tagline": "国際人材",
    "lang.label": "言語",
    "nav.aboutKaizen": "KAIZENについて",
    "nav.manpower": "国際人材",
    "nav.studyAbroadFull": "留学",
    "nav.languagesTraining": "語学研修",
    "nav.travelVisa": "旅行・ビザ",
    "nav.outsourcing": "アウトソーシング・人材派遣",
    "nav.partners": "グローバルパートナー",
    "nav.newsEvents": "ニュース・イベント",
  },
  ko: {
    "nav.home": "홈",
    "nav.study": "유학",
    "nav.export": "해외취업",
    "nav.languages": "외국어",
    "nav.news": "뉴스",
    "nav.about": "회사소개",
    "nav.contact": "연락처",
    "nav.overview": "개요",
    "nav.studyAbroad": "유학",
    "nav.laborExport": "해외취업",
    "cta.register": "무료 상담",
    "company.tagline": "국제 인력",
    "lang.label": "언어",
    "nav.aboutKaizen": "KAIZEN 소개",
    "nav.manpower": "국제 인력",
    "nav.studyAbroadFull": "유학",
    "nav.languagesTraining": "어학 연수",
    "nav.travelVisa": "여행 및 비자",
    "nav.outsourcing": "아웃소싱 및 인력 공급",
    "nav.partners": "글로벌 파트너",
    "nav.newsEvents": "뉴스 및 이벤트",
  },
};

const STORAGE_KEY = "kaizen.lang";

function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "vi";
  const langs = Array.from(navigator.languages || [navigator.language]);
  for (const l of langs) {
    const code = l.toLowerCase().split("-")[0];
    if (code === "vi") return "vi";
    if (code === "en") return "en";
    if (code === "ja" || code === "jp") return "ja";
    if (code === "ko") return "ko";
  }
  return "vi";
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };
const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && T[saved]) {
        setLangState(saved);
        document.documentElement.lang = saved;
      } else {
        const detected = detectBrowserLang();
        setLangState(detected);
        localStorage.setItem(STORAGE_KEY, detected);
        document.documentElement.lang = detected;
      }
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    try { document.documentElement.lang = l; } catch {}
  };

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: (key) => T[lang][key] ?? T.vi[key] ?? key }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) return { lang: "vi" as Lang, setLang: () => {}, t: (k: string) => T.vi[k] ?? k };
  return ctx;
}
