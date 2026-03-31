import { ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageContext";

export type ThemeType = "default" | "cyberpunk" | "matrix" | "ocean";

const themes = {
  default: {
    bg: "from-indigo-900/20 via-slate-950 to-slate-950",
    text: "from-cyan-400 to-purple-500",
    selection: "selection:bg-cyan-500/30",
  },
  cyberpunk: {
    bg: "from-fuchsia-900/20 via-slate-950 to-slate-950",
    text: "from-pink-500 to-yellow-500",
    selection: "selection:bg-pink-500/30",
  },
  matrix: {
    bg: "from-emerald-900/20 via-slate-950 to-slate-950",
    text: "from-emerald-400 to-teal-500",
    selection: "selection:bg-emerald-500/30",
  },
  ocean: {
    bg: "from-blue-900/20 via-slate-950 to-slate-950",
    text: "from-blue-400 to-cyan-500",
    selection: "selection:bg-blue-500/30",
  }
};

export function Layout({ children, theme = "default" }: { children: ReactNode, theme?: ThemeType }) {
  const { lang, setLang } = useLanguage();
  const currentTheme = themes[theme] || themes.default;

  const getThemeOverlay = () => {
    switch(theme) {
      case "cyberpunk": return "bg-grid-pattern opacity-30 mix-blend-overlay";
      case "matrix": return "bg-dot-pattern opacity-20 mix-blend-overlay";
      case "ocean": return "bg-waves opacity-50 mix-blend-screen";
      default: return "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-50";
    }
  };

  const getThemeFont = () => {
    if (theme === "matrix") return "font-mono";
    return "font-sans";
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-50 ${getThemeFont()} ${currentTheme.selection} relative overflow-hidden`}>
      {/* Base Gradient */}
      <div className={`fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${currentTheme.bg} -z-20 transition-colors duration-1000`}></div>
      
      {/* Theme Specific Overlay Pattern */}
      <div className={`fixed inset-0 pointer-events-none -z-10 transition-opacity duration-1000 ${getThemeOverlay()}`}></div>
      
      {/* Matrix Rain Effect (Only for Matrix theme) */}
      {theme === "matrix" && (
        <div className="fixed inset-0 pointer-events-none -z-10 matrix-rain opacity-30"></div>
      )}

      {/* Cyberpunk Scanlines (Only for Cyberpunk theme) */}
      {theme === "cyberpunk" && (
        <div className="fixed inset-0 pointer-events-none -z-10 bg-scanlines opacity-20"></div>
      )}

      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-md py-4 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="EstiMate Logo" width="40" height="40" className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <h1 className={`text-2xl font-bold bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent tracking-tight transition-colors duration-1000`}>
            EstiMate
          </h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => setLang('pt')} className={`transition-all hover:scale-110 rounded-full overflow-hidden flex items-center justify-center ${lang === 'pt' ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950' : 'opacity-80 hover:opacity-100'}`} title="Português">
            <img src="https://flagcdn.com/br.svg" alt="Português" width="28" height="28" loading="lazy" className="w-6 h-6 sm:w-7 sm:h-7 object-cover" referrerPolicy="no-referrer" />
          </button>
          <button onClick={() => setLang('en')} className={`transition-all hover:scale-110 rounded-full overflow-hidden flex items-center justify-center ${lang === 'en' ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950' : 'opacity-80 hover:opacity-100'}`} title="English">
            <img src="https://flagcdn.com/us.svg" alt="English" width="28" height="28" loading="lazy" className="w-6 h-6 sm:w-7 sm:h-7 object-cover" referrerPolicy="no-referrer" />
          </button>
          <button onClick={() => setLang('es')} className={`transition-all hover:scale-110 rounded-full overflow-hidden flex items-center justify-center ${lang === 'es' ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950' : 'opacity-80 hover:opacity-100'}`} title="Español">
            <img src="https://flagcdn.com/es.svg" alt="Español" width="28" height="28" loading="lazy" className="w-6 h-6 sm:w-7 sm:h-7 object-cover" referrerPolicy="no-referrer" />
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 sm:p-6 relative z-10">{children}</main>
    </div>
  );
}
