import { useState, FormEvent, memo, useCallback } from "react";
import { useScreenReaderAnnouncements } from "../hooks/useAccessibility";

interface JoinRoomProps {
  onJoin: (name: string, role: string) => Promise<void>;
  theme?: string;
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
      primaryBtn: "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.6)] text-white",
      textGradient: "from-cyan-400 to-purple-500",
      cardBorder: "border-white/10 shadow-[0_0_40px_-10px_rgba(34,211,238,0.2)]",
      inputFocus: "focus:ring-cyan-500 focus:border-cyan-500",
    };
  }
};

const JoinRoomComponent = memo(({ onJoin, theme }: JoinRoomProps) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("Dev");
  const [customRole, setCustomRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { announce } = useScreenReaderAnnouncements();
  const ui = getThemeUI(theme);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim()) {
      setIsLoading(true);
      const finalRole = role === "Outro" ? customRole.trim() || "Outro" : role;
      try {
        await onJoin(name.trim(), finalRole);
        announce(`Entrando na sala como ${finalRole}`);
      } catch (err: any) {
        const errorMessage = err.message || "Erro ao entrar na sala";
        setError(errorMessage);
        announce(`Erro: ${errorMessage}`);
        setIsLoading(false);
      }
    }
  }, [name, role, customRole, onJoin, announce]);

  return (
    <section
      aria-labelledby="join-room-heading"
      className={`max-w-md mx-auto mt-10 sm:mt-20 p-6 sm:p-8 rounded-3xl bg-slate-900/50 border backdrop-blur-sm transition-all duration-1000 ${ui.cardBorder}`}
    >
      <h2
        id="join-room-heading"
        className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r ${ui.textGradient} bg-clip-text text-transparent transition-colors duration-1000`}
      >
        Entrar na Sessão
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label
            htmlFor="user-name"
            className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider"
          >
            Seu Nome
          </label>
          <input
            id="user-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 focus:ring-2 outline-none transition-all text-white placeholder-slate-600 font-medium text-sm sm:text-base ${ui.inputFocus}`}
            placeholder="Digite seu nome"
            aria-describedby="name-help"
            required
            autoFocus
          />
          <div id="name-help" className="sr-only">
            Digite seu nome para identificação na sessão de planning poker
          </div>
        </div>
        <fieldset>
          <legend className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
            Selecione sua Função
          </legend>
          <div
            role="radiogroup"
            aria-labelledby="role-legend"
            className="flex gap-3 sm:gap-4 mb-3"
          >
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="Dev"
                checked={role === "Dev"}
                onChange={() => setRole("Dev")}
                aria-describedby="dev-role-help"
                className="peer sr-only"
              />
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-white/10 peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 peer-checked:text-cyan-400 peer-checked:shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)] peer-focus:ring-2 peer-focus:ring-cyan-500 font-bold transition-all text-xs sm:text-sm">
                DEV
              </div>
              <div id="dev-role-help" className="sr-only">
                Função de Desenvolvedor
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="QA"
                checked={role === "QA"}
                onChange={() => setRole("QA")}
                aria-describedby="qa-role-help"
                className="peer sr-only"
              />
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-white/10 peer-checked:border-purple-500 peer-checked:bg-purple-500/10 peer-checked:text-purple-400 peer-checked:shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)] peer-focus:ring-2 peer-focus:ring-purple-500 font-bold transition-all text-xs sm:text-sm">
                QA
              </div>
              <div id="qa-role-help" className="sr-only">
                Função de Quality Assurance (Tester)
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="Outro"
                checked={role === "Outro"}
                onChange={() => setRole("Outro")}
                aria-describedby="other-role-help"
                className="peer sr-only"
              />
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-white/10 peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-400 peer-checked:shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] peer-focus:ring-2 peer-focus:ring-emerald-500 font-bold transition-all text-xs sm:text-sm">
                OUTRO
              </div>
              <div id="other-role-help" className="sr-only">
                Outra função personalizada
              </div>
            </label>
          </div>
          {role === "Outro" && (
            <input
              id="custom-role"
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 focus:ring-2 outline-none transition-all text-white placeholder-slate-600 font-medium text-sm sm:text-base ${ui.inputFocus}`}
              placeholder="Digite sua função (ex: Designer)"
              aria-label="Função personalizada"
              aria-describedby="custom-role-help"
              required
            />
          )}
          {role === "Outro" && (
            <div id="custom-role-help" className="sr-only">
              Digite o nome da sua função personalizada, como Designer, Product Owner, etc.
            </div>
          )}
        </fieldset>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center animate-pulse"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || isLoading}
          aria-describedby="submit-button-help"
          className={`w-full py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${ui.primaryBtn}`}
        >
          {isLoading ? "Entrando..." : "Entrar na Sala"}
          <span id="submit-button-help" className="sr-only">
            Entra na sessão de planning poker com o nome e função escolhidos
          </span>
        </button>
      </form>
    </section>
  );
});

JoinRoomComponent.displayName = 'JoinRoom';

export { JoinRoomComponent as JoinRoom };
