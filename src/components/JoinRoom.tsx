import { useState, FormEvent } from "react";
import { useLanguage } from "../i18n/LanguageContext";

interface JoinRoomProps {
  onJoin: (name: string, role: string) => Promise<void>;
  theme?: string;
  wasRemoved?: boolean;
}

const getThemeUI = (theme?: string) => {
  switch (theme) {
    case "cyberpunk": return {
      primaryBtn: "bg-gradient-to-r from-pink-500 to-yellow-500 shadow-[0_0_20px_-5px_rgba(236,72,153,0.6)] hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.8)] text-slate-900",
      textGradient: "from-pink-500 to-yellow-500",
      cardBorder: "border-pink-500/20 shadow-[0_0_40px_-10px_rgba(236,72,153,0.2)]",
      inputFocus: "focus:ring-pink-500 focus:border-pink-500",
    };
    case "matrix": return {
      primaryBtn: "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_20px_-5px_rgba(16,185,129,0.6)] hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.8)] text-slate-900",
      textGradient: "from-emerald-400 to-teal-500",
      cardBorder: "border-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]",
      inputFocus: "focus:ring-emerald-500 focus:border-emerald-500",
    };
    case "ocean": return {
      primaryBtn: "bg-gradient-to-r from-blue-400 to-cyan-500 shadow-[0_0_20px_-5px_rgba(56,187,248,0.6)] hover:shadow-[0_0_30px_-5px_rgba(56,187,248,0.8)] text-slate-900",
      textGradient: "from-blue-400 to-cyan-500",
      cardBorder: "border-cyan-500/20 shadow-[0_0_40px_-10px_rgba(56,187,248,0.2)]",
      inputFocus: "focus:ring-cyan-500 focus:border-cyan-500",
    };
    default: return {
      primaryBtn: "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.6)] text-white",
      textGradient: "from-cyan-400 to-purple-500",
      cardBorder: "border-white/10 shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)]",
      inputFocus: "focus:ring-purple-500 focus:border-purple-500",
    };
  }
};

export function JoinRoom({ onJoin, theme, wasRemoved }: JoinRoomProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("Dev");
  const [customRole, setCustomRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const ui = getThemeUI(theme);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim()) {
      setIsLoading(true);
      const finalRole = role === "Outro" ? customRole.trim() || "Outro" : role;
      try {
        await onJoin(name.trim(), finalRole);
      } catch (err: any) {
        setError(err.message || t('errorJoining'));
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`max-w-md mx-auto mt-10 sm:mt-20 p-6 sm:p-8 rounded-3xl bg-slate-900/50 border backdrop-blur-sm transition-all duration-1000 ${ui.cardBorder}`}>
      <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r ${ui.textGradient} bg-clip-text text-transparent transition-colors duration-1000`}>
        {wasRemoved ? t('rejoinRoom') : t('joinSession')}
      </h2>

      {wasRemoved && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium text-center">
          {t('removedFromRoom')}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">{t('yourName')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 focus:ring-2 outline-none transition-all text-white placeholder-slate-600 font-medium text-sm sm:text-base ${ui.inputFocus}`}
            placeholder={t('yourNamePlaceholder')}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">{t('selectRole')}</label>
          <div className="flex gap-3 sm:gap-4 mb-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="Dev"
                checked={role === "Dev"}
                onChange={() => setRole("Dev")}
                className="peer sr-only"
              />
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-white/10 peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 peer-checked:text-cyan-400 peer-checked:shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)] font-bold transition-all text-xs sm:text-sm">
                DEV
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="QA"
                checked={role === "QA"}
                onChange={() => setRole("QA")}
                className="peer sr-only"
              />
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-white/10 peer-checked:border-purple-500 peer-checked:bg-purple-500/10 peer-checked:text-purple-400 peer-checked:shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)] font-bold transition-all text-xs sm:text-sm">
                QA
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="Outro"
                checked={role === "Outro"}
                onChange={() => setRole("Outro")}
                className="peer sr-only"
              />
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-white/10 peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-400 peer-checked:shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] font-bold transition-all text-xs sm:text-sm">
                {t('other')}
              </div>
            </label>
          </div>
          {role === "Outro" && (
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 focus:ring-2 outline-none transition-all text-white placeholder-slate-600 font-medium text-sm sm:text-base ${ui.inputFocus}`}
              placeholder={t('otherRolePlaceholder')}
              required
            />
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center animate-pulse">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || isLoading}
          className={`w-full py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] ${ui.primaryBtn}`}
        >
          {isLoading ? t('joining') : t('joinRoomBtn')}
        </button>
      </form>
    </div>
  );
}
