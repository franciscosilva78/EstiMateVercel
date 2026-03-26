import { ReactNode, memo, useMemo } from "react";
import { useAccessibilityPreferences, useSkipLinks } from "../hooks/useAccessibility";

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

const LayoutComponent = memo(({ children, theme = "default" }: { children: ReactNode, theme?: ThemeType }) => {
  const { prefersReducedMotion, prefersHighContrast } = useAccessibilityPreferences();
  const { skipLinksRef, createSkipLink } = useSkipLinks();

  const currentTheme = useMemo(() => themes[theme] || themes.default, [theme]);

  const themeOverlay = useMemo(() => {
    switch(theme) {
      case "cyberpunk": return "bg-grid-pattern opacity-30 mix-blend-overlay";
      case "matrix": return "bg-dot-pattern opacity-20 mix-blend-overlay";
      case "ocean": return "bg-waves opacity-50 mix-blend-screen";
      default: return "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-50";
    }
  }, [theme]);

  const themeFont = useMemo(() => {
    if (theme === "matrix") return "font-mono";
    return "font-sans";
  }, [theme]);

  // Memoize motion classes based on user preference
  const motionClasses = useMemo(() => {
    return prefersReducedMotion ? "" : "transition-colors duration-1000";
  }, [prefersReducedMotion]);

  // Memoize contrast classes
  const contrastClasses = useMemo(() => {
    return prefersHighContrast ? "contrast-150" : "";
  }, [prefersHighContrast]);

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-50 ${themeFont} ${currentTheme.selection} ${contrastClasses} relative overflow-hidden`}
      data-theme={theme}
    >
      {/* Skip Links */}
      <div ref={skipLinksRef} className="skip-links">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          Pular para o conteúdo principal
        </a>
        <a
          href="#navigation"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-40 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          Pular para a navegação
        </a>
      </div>

      {/* Base Gradient */}
      <div className={`fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${currentTheme.bg} -z-20 ${motionClasses}`}></div>

      {/* Theme Specific Overlay Pattern */}
      <div className={`fixed inset-0 pointer-events-none -z-10 ${motionClasses} ${themeOverlay}`}></div>

      {/* Matrix Rain Effect (Only for Matrix theme) */}
      {theme === "matrix" && !prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none -z-10 matrix-rain opacity-30" aria-hidden="true"></div>
      )}

      {/* Cyberpunk Scanlines (Only for Cyberpunk theme) */}
      {theme === "cyberpunk" && !prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none -z-10 bg-scanlines opacity-20" aria-hidden="true"></div>
      )}

      <header
        id="navigation"
        role="banner"
        className={`border-b border-white/10 bg-slate-950/50 backdrop-blur-md py-4 px-6 flex items-center justify-between sticky top-0 z-40`}
      >
        <h1 className={`text-2xl font-bold bg-gradient-to-r ${currentTheme.text} bg-clip-text text-transparent tracking-tight ${motionClasses}`}>
          <span className="sr-only">EstiMate - </span>
          EstiMate
          <span className="sr-only"> - Aplicação de Planning Poker</span>
        </h1>
      </header>

      <main
        id="main-content"
        role="main"
        className="max-w-5xl mx-auto p-4 sm:p-6 relative z-10"
        aria-label="Conteúdo principal da aplicação"
      >
        {children}
      </main>

      {/* Live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="announcements"
      ></div>

      {/* Status for loading/error states */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        id="status"
      ></div>
    </div>
  );
});

LayoutComponent.displayName = 'Layout';

export { LayoutComponent as Layout };
