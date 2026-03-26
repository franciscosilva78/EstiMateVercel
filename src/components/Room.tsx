import { useState, memo, useCallback, useMemo } from "react";
import { RoomState, User } from "../types";
import { Share, Eye, RotateCcw, Trash2, Palette } from "lucide-react";
import { useFocusManagement, useScreenReaderAnnouncements } from "../hooks/useAccessibility";
import { useStableMemo } from "../utils/performance";

interface RoomProps {
  roomState: RoomState | null;
  currentUser: User;
  onVote: (vote: number) => void;
  onReveal: () => void;
  onReset: () => void;
  onDelete: () => void;
  onCalculationChange: (method: "average" | "sumByRole" | "mostVotedOverall") => void;
  onSelectManualMode: (role: string, vote: number) => void;
  onThemeChange?: (theme: "default" | "cyberpunk" | "matrix" | "ocean") => void;
}

const VOTING_OPTIONS = Array.from({ length: 26 }, (_, i) => (i + 1) * 0.5);

const getColorClasses = (idx: number, theme?: string) => {
  const defaultColors = [
    { border: "border-purple-500/30", text: "text-purple-400", shadow: "shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]", bg: "bg-purple-500/20", borderActive: "border-purple-500", badge: "bg-purple-500/20 text-purple-300", iconBg: "bg-purple-500/10 border-purple-500/50 text-purple-400" },
    { border: "border-cyan-500/30", text: "text-cyan-400", shadow: "shadow-[0_0_30px_-10px_rgba(34,211,238,0.2)]", bg: "bg-cyan-500/20", borderActive: "border-cyan-500", badge: "bg-cyan-500/20 text-cyan-300", iconBg: "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" },
    { border: "border-emerald-500/30", text: "text-emerald-400", shadow: "shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]", bg: "bg-emerald-500/20", borderActive: "border-emerald-500", badge: "bg-emerald-500/20 text-emerald-300", iconBg: "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" },
    { border: "border-amber-500/30", text: "text-amber-400", shadow: "shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]", bg: "bg-amber-500/20", borderActive: "border-amber-500", badge: "bg-amber-500/20 text-amber-300", iconBg: "bg-amber-500/10 border-amber-500/50 text-amber-400" },
    { border: "border-pink-500/30", text: "text-pink-400", shadow: "shadow-[0_0_30px_-10px_rgba(236,72,153,0.2)]", bg: "bg-pink-500/20", borderActive: "border-pink-500", badge: "bg-pink-500/20 text-pink-300", iconBg: "bg-pink-500/10 border-pink-500/50 text-pink-400" },
  ];

  const cyberpunkColors = [
    { border: "border-pink-500/30", text: "text-pink-400", shadow: "shadow-[0_0_30px_-10px_rgba(236,72,153,0.2)]", bg: "bg-pink-500/20", borderActive: "border-pink-500", badge: "bg-pink-500/20 text-pink-300", iconBg: "bg-pink-500/10 border-pink-500/50 text-pink-400" },
    { border: "border-fuchsia-500/30", text: "text-fuchsia-400", shadow: "shadow-[0_0_30px_-10px_rgba(217,70,239,0.2)]", bg: "bg-fuchsia-500/20", borderActive: "border-fuchsia-500", badge: "bg-fuchsia-500/20 text-fuchsia-300", iconBg: "bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-400" },
    { border: "border-yellow-500/30", text: "text-yellow-400", shadow: "shadow-[0_0_30px_-10px_rgba(234,179,8,0.2)]", bg: "bg-yellow-500/20", borderActive: "border-yellow-500", badge: "bg-yellow-500/20 text-yellow-300", iconBg: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400" },
    { border: "border-rose-500/30", text: "text-rose-400", shadow: "shadow-[0_0_30px_-10px_rgba(244,63,94,0.2)]", bg: "bg-rose-500/20", borderActive: "border-rose-500", badge: "bg-rose-500/20 text-rose-300", iconBg: "bg-rose-500/10 border-rose-500/50 text-rose-400" },
    { border: "border-orange-500/30", text: "text-orange-400", shadow: "shadow-[0_0_30px_-10px_rgba(249,115,22,0.2)]", bg: "bg-orange-500/20", borderActive: "border-orange-500", badge: "bg-orange-500/20 text-orange-300", iconBg: "bg-orange-500/10 border-orange-500/50 text-orange-400" },
  ];

  const matrixColors = [
    { border: "border-emerald-500/30", text: "text-emerald-400", shadow: "shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]", bg: "bg-emerald-500/20", borderActive: "border-emerald-500", badge: "bg-emerald-500/20 text-emerald-300", iconBg: "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" },
    { border: "border-green-500/30", text: "text-green-400", shadow: "shadow-[0_0_30px_-10px_rgba(34,197,94,0.2)]", bg: "bg-green-500/20", borderActive: "border-green-500", badge: "bg-green-500/20 text-green-300", iconBg: "bg-green-500/10 border-green-500/50 text-green-400" },
    { border: "border-teal-500/30", text: "text-teal-400", shadow: "shadow-[0_0_30px_-10px_rgba(20,184,166,0.2)]", bg: "bg-teal-500/20", borderActive: "border-teal-500", badge: "bg-teal-500/20 text-teal-300", iconBg: "bg-teal-500/10 border-teal-500/50 text-teal-400" },
    { border: "border-lime-500/30", text: "text-lime-400", shadow: "shadow-[0_0_30px_-10px_rgba(132,204,22,0.2)]", bg: "bg-lime-500/20", borderActive: "border-lime-500", badge: "bg-lime-500/20 text-lime-300", iconBg: "bg-lime-500/10 border-lime-500/50 text-lime-400" },
  ];

  const oceanColors = [
    { border: "border-blue-500/30", text: "text-blue-400", shadow: "shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]", bg: "bg-blue-500/20", borderActive: "border-blue-500", badge: "bg-blue-500/20 text-blue-300", iconBg: "bg-blue-500/10 border-blue-500/50 text-blue-400" },
    { border: "border-cyan-500/30", text: "text-cyan-400", shadow: "shadow-[0_0_30px_-10px_rgba(34,211,238,0.2)]", bg: "bg-cyan-500/20", borderActive: "border-cyan-500", badge: "bg-cyan-500/20 text-cyan-300", iconBg: "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" },
    { border: "border-sky-500/30", text: "text-sky-400", shadow: "shadow-[0_0_30px_-10px_rgba(14,165,233,0.2)]", bg: "bg-sky-500/20", borderActive: "border-sky-500", badge: "bg-sky-500/20 text-sky-300", iconBg: "bg-sky-500/10 border-sky-500/50 text-sky-400" },
    { border: "border-indigo-500/30", text: "text-indigo-400", shadow: "shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)]", bg: "bg-indigo-500/20", borderActive: "border-indigo-500", badge: "bg-indigo-500/20 text-indigo-300", iconBg: "bg-indigo-500/10 border-indigo-500/50 text-indigo-400" },
  ];

  let colors = defaultColors;
  if (theme === "cyberpunk") colors = cyberpunkColors;
  if (theme === "matrix") colors = matrixColors;
  if (theme === "ocean") colors = oceanColors;

  return colors[idx % colors.length];
};

const getThemeUI = (theme?: string) => {
  switch (theme) {
    case "cyberpunk": return {
      primaryBtn: "bg-gradient-to-r from-pink-500 to-yellow-500 text-slate-900 shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:scale-[1.02]",
      secondaryBtn: "bg-fuchsia-900/60 text-pink-400 border-pink-500/60 hover:bg-fuchsia-800/80 hover:border-pink-400 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]",
      accentText: "text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]",
      accentBorder: "border-pink-500/60",
      cardBg: "bg-fuchsia-950/40 backdrop-blur-md",
      cardBorder: "border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.15)]",
      voteSelected: "bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-[0_0_25px_rgba(236,72,153,0.8)] border-pink-300 scale-105 sm:scale-110",
      voteHover: "hover:border-pink-400 hover:text-pink-300 hover:bg-pink-900/40 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]",
      totalCard: "from-pink-900 to-fuchsia-900 border-pink-500 shadow-[0_0_40px_-5px_rgba(236,72,153,0.6)]",
      totalText: "text-pink-200 drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]",
      pulse: "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]",
      userVotedBg: "bg-fuchsia-900/60 shadow-[0_0_15px_rgba(236,72,153,0.2)]",
      userVotedBox: "bg-pink-500/30 border-pink-500/60 text-pink-300 shadow-[inset_0_0_10px_rgba(236,72,153,0.5)]",
      userEmptyBox: "bg-fuchsia-950/50 border-pink-500/20 text-pink-700/50",
      userRevealedBox: "bg-gradient-to-br from-fuchsia-800 to-pink-900 border-pink-500/50 text-white",
    };
    case "matrix": return {
      primaryBtn: "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:scale-[1.02]",
      secondaryBtn: "bg-black/60 text-emerald-400 border-emerald-500/60 hover:bg-emerald-900/60 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
      accentText: "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]",
      accentBorder: "border-emerald-500/60",
      cardBg: "bg-black/60 backdrop-blur-md",
      cardBorder: "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      voteSelected: "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.8)] border-emerald-300 scale-105 sm:scale-110",
      voteHover: "hover:border-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
      totalCard: "from-emerald-900 to-teal-900 border-emerald-500 shadow-[0_0_40px_-5px_rgba(16,185,129,0.6)]",
      totalText: "text-emerald-200 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]",
      pulse: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]",
      userVotedBg: "bg-emerald-900/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      userVotedBox: "bg-emerald-500/30 border-emerald-500/60 text-emerald-300 shadow-[inset_0_0_10px_rgba(16,185,129,0.5)]",
      userEmptyBox: "bg-black/50 border-emerald-500/20 text-emerald-700/50",
      userRevealedBox: "bg-gradient-to-br from-emerald-800 to-teal-900 border-emerald-500/50 text-white",
    };
    case "ocean": return {
      primaryBtn: "bg-gradient-to-r from-blue-400 to-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(56,187,248,0.6)] hover:scale-[1.02]",
      secondaryBtn: "bg-blue-900/60 text-cyan-400 border-cyan-500/60 hover:bg-blue-800/80 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(56,187,248,0.4)]",
      accentText: "text-cyan-400 drop-shadow-[0_0_8px_rgba(56,187,248,0.8)]",
      accentBorder: "border-cyan-500/60",
      cardBg: "bg-blue-950/40 backdrop-blur-md",
      cardBorder: "border-cyan-500/40 shadow-[0_0_20px_rgba(56,187,248,0.15)]",
      voteSelected: "bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-[0_0_25px_rgba(56,187,248,0.8)] border-cyan-300 scale-105 sm:scale-110",
      voteHover: "hover:border-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/40 hover:shadow-[0_0_15px_rgba(56,187,248,0.4)]",
      totalCard: "from-blue-900 to-cyan-900 border-cyan-500 shadow-[0_0_40px_-5px_rgba(56,187,248,0.6)]",
      totalText: "text-cyan-200 drop-shadow-[0_0_5px_rgba(56,187,248,0.8)]",
      pulse: "bg-cyan-500 shadow-[0_0_10px_rgba(56,187,248,0.8)]",
      userVotedBg: "bg-blue-900/60 shadow-[0_0_15px_rgba(56,187,248,0.2)]",
      userVotedBox: "bg-cyan-500/30 border-cyan-500/60 text-cyan-300 shadow-[inset_0_0_10px_rgba(56,187,248,0.5)]",
      userEmptyBox: "bg-blue-950/50 border-cyan-500/20 text-cyan-700/50",
      userRevealedBox: "bg-gradient-to-br from-blue-800 to-cyan-900 border-cyan-500/50 text-white",
    };
    default: return {
      primaryBtn: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-[1.02]",
      secondaryBtn: "bg-slate-800/80 text-cyan-400 border-cyan-500/40 hover:border-cyan-500/80 hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]",
      accentText: "text-cyan-400",
      accentBorder: "border-cyan-500/50",
      cardBg: "bg-slate-900/60 backdrop-blur-md",
      cardBorder: "border-white/10 shadow-xl",
      voteSelected: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] border-transparent scale-105 sm:scale-110",
      voteHover: "hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-slate-800",
      totalCard: "from-indigo-900 to-slate-900 border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]",
      totalText: "text-indigo-300",
      pulse: "bg-emerald-500",
      userVotedBg: "bg-slate-800/80",
      userVotedBox: "bg-cyan-500/20 border-cyan-500/50 text-cyan-400",
      userEmptyBox: "bg-slate-950 border-white/5 text-slate-700",
      userRevealedBox: "bg-gradient-to-br from-slate-700 to-slate-800 border-white/20 text-white",
    };
  }
};

const RoomComponent = memo(({ roomState, currentUser, onVote, onReveal, onReset, onDelete, onCalculationChange, onSelectManualMode, onThemeChange }: RoomProps) => {
  const [copied, setCopied] = useState(false);

  const { announce } = useScreenReaderAnnouncements();
  const { registerFocusableElement, handleKeyboardNavigation } = useFocusManagement();

  if (!roomState) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 px-4 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <div className="text-cyan-400 font-bold tracking-widest uppercase text-sm animate-pulse">Estabelecendo Conexão...</div>
        <p className="text-slate-500 text-xs mt-4 max-w-xs">
          O servidor pode levar até 50 segundos para "acordar" caso seja o primeiro acesso do dia.
        </p>
      </div>
    );
  }

  const handleShare = useCallback(() => {
    const shareUrl = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    announce("Link da sala copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  }, [announce]);

  const users = useMemo(() =>
    Object.values(roomState.users).filter(u => u.role !== "ScrumMaster"),
    [roomState.users]
  );

  const votedCount = useMemo(() =>
    users.filter(u => u.vote !== null).length,
    [users]
  );

  const isRevealed = roomState.status === "revealed";
  const method = roomState.calculationMethod || "sumByRole";
  const manualSelections = roomState.manualModeSelections || {};

  // Helper to get vote distribution and modes
  const getVoteStats = (votes: number[]) => {
    if (votes.length === 0) return { distribution: {}, modes: [], autoMode: 0 };
    const counts: Record<number, number> = {};
    let maxCount = 0;

    votes.forEach(v => {
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > maxCount) {
        maxCount = counts[v];
      }
    });

    const modes = Object.keys(counts)
      .map(Number)
      .filter(v => counts[v] === maxCount);

    return { 
      distribution: counts, 
      modes, 
      autoMode: Math.max(...modes) // Default to highest if tie
    };
  };

  // Group users by role dynamically - memoized
  const roles = useMemo(() =>
    Array.from(new Set(users.map(u => u.role))),
    [users]
  );

  // Memoize vote calculations
  const { allVotes, overallStats, overallResult, roleResults, totalSum } = useMemo(() => {
    const allVotes = users.filter(u => u.vote !== null).map(u => u.vote as number);
    const overallStats = getVoteStats(allVotes);
    let overallResult = 0;
    if (method === "average") {
      overallResult = allVotes.length ? allVotes.reduce((a, b) => a + b, 0) / allVotes.length : 0;
    } else {
      overallResult = manualSelections['overall'] !== undefined ? manualSelections['overall'] : overallStats.autoMode;
    }

    const roleResults: Record<string, { result: number, stats: ReturnType<typeof getVoteStats> }> = {};
    let totalSum = 0;

    roles.forEach(role => {
      const roleVotes = users.filter(u => u.role === role && u.vote !== null).map(u => u.vote as number);
      const stats = getVoteStats(roleVotes);

      let result = 0;
      if (method === "average") {
        result = roleVotes.length ? roleVotes.reduce((a, b) => a + b, 0) / roleVotes.length : 0;
      } else {
        result = manualSelections[role] !== undefined ? manualSelections[role] : stats.autoMode;
      }

      roleResults[role] = { result, stats };
      totalSum += result;
    });

    return { allVotes, overallStats, overallResult, roleResults, totalSum };
  }, [users, method, manualSelections, roles]);

  // Memoize theme functions
  const themeTextGradient = useStableMemo(
    getThemeTextGradient(roomState?.theme),
    [roomState?.theme]
  );

  const themeShadow = useStableMemo(
    getThemeShadow(roomState?.theme),
    [roomState?.theme]
  );

  const ui = useStableMemo(
    getThemeUI(roomState?.theme),
    [roomState?.theme]
  );

  // Helper functions memoized
  const getThemeTextGradient = useCallback((theme?: string) => {
    switch (theme) {
      case "cyberpunk": return "from-pink-500 to-yellow-500";
      case "matrix": return "from-emerald-400 to-teal-500";
      case "ocean": return "from-blue-400 to-cyan-500";
      default: return "from-cyan-400 to-purple-500";
    }
  }, []);

  const getThemeShadow = useCallback((theme?: string) => {
    switch (theme) {
      case "cyberpunk": return "shadow-[0_0_40px_-10px_rgba(236,72,153,0.4)]";
      case "matrix": return "shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]";
      case "ocean": return "shadow-[0_0_40px_-10px_rgba(56,187,248,0.4)]";
      default: return "shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)]";
    }
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl border backdrop-blur-sm transition-all duration-1000 ${ui.cardBg} ${ui.cardBorder} ${getThemeShadow(roomState.theme)}`}>
        <div className="text-center sm:text-left">
          <h2 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${getThemeTextGradient(roomState.theme)} bg-clip-text text-transparent transition-colors duration-1000`}>
            {roomState.name}
          </h2>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-1">
            <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${ui.pulse}`}></span>
              {users.length} online
            </p>
            {currentUser.role === "ScrumMaster" && (
              <>
                <div className="h-4 w-[1px] bg-white/10"></div>
                <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${ui.pulse}`}></span>
                  {votedCount}/{users.length} votaram
                </p>
              </>
            )}
            <div className="h-4 w-[1px] bg-white/10"></div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Método: <span className={ui.accentText}>{method === "average" ? "Média Simples" : method === "sumByRole" ? "Votação por Função" : "Votação Geral"}</span>
            </p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-3 items-center justify-center sm:justify-end flex-wrap">
          {currentUser.role === "ScrumMaster" && onThemeChange && (
            <div className={`flex gap-1.5 p-1.5 rounded-xl border transition-all duration-1000 ${ui.cardBg} ${ui.cardBorder}`}>
              <button onClick={() => onThemeChange("default")} className={`w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 transition-all ${roomState.theme === "default" || !roomState.theme ? "border-white scale-110 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "border-transparent opacity-50 hover:opacity-100"}`} title="Nebula"></button>
              <button onClick={() => onThemeChange("cyberpunk")} className={`w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 border-2 transition-all ${roomState.theme === "cyberpunk" ? "border-white scale-110 shadow-[0_0_10px_rgba(236,72,153,0.5)]" : "border-transparent opacity-50 hover:opacity-100"}`} title="Cyberpunk"></button>
              <button onClick={() => onThemeChange("matrix")} className={`w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 transition-all ${roomState.theme === "matrix" ? "border-white scale-110 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "border-transparent opacity-50 hover:opacity-100"}`} title="Matrix"></button>
              <button onClick={() => onThemeChange("ocean")} className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 transition-all ${roomState.theme === "ocean" ? "border-white scale-110 shadow-[0_0_10px_rgba(56,187,248,0.5)]" : "border-transparent opacity-50 hover:opacity-100"}`} title="Ocean"></button>
            </div>
          )}
          <button
            onClick={handleShare}
            aria-label={copied ? "Link copiado para área de transferência" : "Compartilhar link da sala"}
            aria-describedby="share-button-help"
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${ui.secondaryBtn}`}
          >
            <Share size={16} aria-hidden="true" />
            {copied ? "COPIADO" : "COMPARTILHAR"}
            <span id="share-button-help" className="sr-only">
              {copied ? "Link da sala foi copiado" : "Copia o link da sala para compartilhar"}
            </span>
          </button>
        </div>
      </div>

      {/* Calculation Method Toggle (Scrum Master only) */}
      {currentUser.role === "ScrumMaster" && (
        <div className="flex justify-center">
          <div className={`p-1.5 rounded-2xl border flex flex-wrap justify-center gap-2 transition-all duration-1000 ${ui.cardBg} ${ui.cardBorder}`}>
            <button
              onClick={() => onCalculationChange("mostVotedOverall")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "mostVotedOverall" 
                  ? ui.voteSelected
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              VOTAÇÃO GERAL
            </button>
            <button
              onClick={() => onCalculationChange("sumByRole")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "sumByRole" 
                  ? ui.voteSelected
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              VOTAÇÃO POR FUNÇÃO
            </button>
            <button
              onClick={() => onCalculationChange("average")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "average" 
                  ? ui.voteSelected
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              MÉDIA SIMPLES
            </button>
          </div>
        </div>
      )}

      {/* Voting Options */}
      {!isRevealed && currentUser.role !== "ScrumMaster" && (
        <section
          aria-labelledby="voting-heading"
          className={`p-4 sm:p-8 rounded-3xl border backdrop-blur-sm transition-all duration-1000 ${ui.cardBg} ${ui.cardBorder} ${themeShadow}`}
        >
          <h3
            id="voting-heading"
            className="text-xs sm:text-sm font-bold text-slate-400 mb-4 sm:mb-6 text-center uppercase tracking-widest"
          >
            Selecione a Estimativa
          </h3>
          <div
            role="group"
            aria-labelledby="voting-heading"
            className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center"
            onKeyDown={handleKeyboardNavigation}
          >
            {VOTING_OPTIONS.map((option, index) => {
              const isSelected = currentUser.vote === option;
              return (
                <button
                  key={option}
                  ref={registerFocusableElement}
                  onClick={() => onVote(option)}
                  aria-label={`Votar ${option} pontos de story`}
                  aria-pressed={isSelected}
                  aria-describedby={`vote-${option}-help`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onVote(option);
                    }
                  }}
                  className={`h-14 sm:w-14 sm:h-16 rounded-xl font-bold text-base sm:text-lg transition-all flex items-center justify-center border focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                    isSelected
                      ? ui.voteSelected
                      : `bg-slate-950 text-slate-300 border-white/10 ${ui.voteHover}`
                  }`}
                >
                  {option}
                  <span id={`vote-${option}-help`} className="sr-only">
                    {isSelected ? "Voto atual selecionado" : "Clique para votar"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Results */}
      {isRevealed && currentUser.role === "ScrumMaster" && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-center items-start gap-4 sm:gap-6">
            {roles.map((role, idx) => {
              const { result, stats } = roleResults[role];
              const colors = getColorClasses(idx, roomState.theme);
              return (
                <div key={role} className="flex flex-col gap-4 flex-1 min-w-[200px] max-w-[300px]">
                  <div className={`p-4 sm:p-6 rounded-3xl border ${colors.border} backdrop-blur-sm ${colors.shadow} flex flex-col items-center justify-center relative overflow-hidden transition-all duration-1000 ${ui.cardBg}`}>
                    <span className={`${colors.text} font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10`}>
                      {method === "average" ? `Média ${role}` : `Votação ${role}`}
                    </span>
                    <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">{result > 0 ? result.toFixed(method === "average" ? 2 : 1) : "-"}</span>
                  </div>

                  {(method === "sumByRole" || method === "mostVotedOverall") && (
                    <div className={`p-5 rounded-3xl border transition-all duration-1000 ${colors.border} ${ui.cardBg}`}>
                      <h4 className={`text-xs font-bold ${colors.text} uppercase tracking-widest mb-4`}>Distribuição de Votos {role}</h4>
                      <div className="space-y-3">
                        {Object.entries(stats.distribution).sort((a, b) => Number(b[0]) - Number(a[0])).map(([vote, count]) => {
                          const isMode = stats.modes.includes(Number(vote));
                          const isSelected = result === Number(vote);
                          return (
                            <button
                              key={vote}
                              disabled={!isMode || stats.modes.length <= 1}
                              onClick={() => onSelectManualMode(role, Number(vote))}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                isSelected 
                                  ? `${colors.bg} ${colors.borderActive} ${colors.shadow}` 
                                  : isMode 
                                    ? `bg-slate-800 ${colors.border} hover:${colors.borderActive}` 
                                    : "bg-slate-950/50 border-white/5 opacity-60"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-white">{vote}</span>
                                {isMode && stats.modes.length > 1 && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">Empate</span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-slate-400">{count} voto{count !== 1 ? "s" : ""}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="flex flex-col gap-4 flex-1 min-w-[200px] max-w-[300px]">
              <div className={`p-4 sm:p-6 rounded-3xl border flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br transition-all duration-1000 ${ui.totalCard}`}>
                <span className={`font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10 ${ui.totalText}`}>
                  {method === "average" ? "Soma Total das Médias" : method === "sumByRole" ? "Soma Votação por Função" : "Votação Geral"}
                </span>
                <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">
                  {method === "average"
                    ? (totalSum > 0 ? totalSum.toFixed(2) : "-")
                    : method === "sumByRole"
                      ? (totalSum > 0 ? totalSum.toFixed(1) : "-")
                      : (overallResult > 0 ? overallResult.toFixed(1) : "-")}
                </span>
              </div>

              {method === "mostVotedOverall" && (
                <div className={`p-5 rounded-3xl border transition-all duration-1000 ${ui.cardBorder} ${ui.cardBg}`}>
                  <h4 className={`text-xs font-bold ${ui.accentText} uppercase tracking-widest mb-4`}>Distribuição Geral</h4>
                  <div className="space-y-3">
                    {Object.entries(overallStats.distribution).sort((a, b) => Number(b[0]) - Number(a[0])).map(([vote, count]) => {
                      const isMode = overallStats.modes.includes(Number(vote));
                      const isSelected = overallResult === Number(vote);
                      return (
                        <button
                          key={vote}
                          disabled={!isMode || overallStats.modes.length <= 1}
                          onClick={() => onSelectManualMode('overall', Number(vote))}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isSelected 
                              ? `${ui.userRevealedBox} shadow-[0_0_15px_rgba(255,255,255,0.2)]` 
                              : isMode 
                                ? `${ui.userVotedBox} hover:${ui.accentBorder}` 
                                : `${ui.userEmptyBox} opacity-60`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-white">{vote}</span>
                            {isMode && overallStats.modes.length > 1 && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">Empate</span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-slate-400">{count} voto{count !== 1 ? "s" : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className={`p-4 sm:p-8 rounded-3xl border backdrop-blur-sm transition-all duration-1000 ${ui.cardBg} ${ui.cardBorder}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-200 uppercase tracking-widest">
            {currentUser.role === "ScrumMaster" ? `PARTICIPANTES - ${users.length}` : "Seu Voto"}
          </h3>
          {currentUser.role === "ScrumMaster" && (
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              <button
                onClick={onDelete}
                aria-label="Excluir sala permanentemente"
                aria-describedby="delete-button-help"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-all border border-red-500/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <Trash2 size={16} aria-hidden="true" />
                EXCLUIR SALA
                <span id="delete-button-help" className="sr-only">
                  Remove a sala permanentemente. Esta ação não pode ser desfeita.
                </span>
              </button>

              {!isRevealed ? (
                <button
                  onClick={onReveal}
                  aria-label="Revelar todos os votos da sessão"
                  aria-describedby="reveal-button-help"
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${ui.primaryBtn}`}
                >
                  <Eye size={16} aria-hidden="true" />
                  REVELAR VOTOS
                  <span id="reveal-button-help" className="sr-only">
                    Revela os votos de todos os participantes e calcula o resultado
                  </span>
                </button>
              ) : (
                <button
                  onClick={onReset}
                  aria-label="Reiniciar sessão de votação"
                  aria-describedby="reset-button-help"
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${ui.secondaryBtn}`}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  REINICIAR
                  <span id="reset-button-help" className="sr-only">
                    Limpa todos os votos e inicia uma nova rodada de votação
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {users
            .filter((user) => currentUser.role === "ScrumMaster" || user.id === currentUser.id)
            .map((user) => {
              const roleIdx = roles.indexOf(user.role);
              const colors = roleIdx >= 0 ? getColorClasses(roleIdx, roomState.theme) : getColorClasses(0, roomState.theme);
              
              return (
                <div
                  key={user.id}
                  className={`flex flex-col items-center p-3 sm:p-4 rounded-2xl border transition-all duration-500 ${
                    user.vote !== null
                      ? `${ui.userVotedBg} ${ui.accentBorder}`
                      : `${ui.cardBg} border-white/10 border-dashed opacity-70`
                  }`}
                >
                  <span className="font-bold text-slate-200 truncate w-full text-center mb-1 text-xs sm:text-sm">
                    {user.name}
                  </span>
                  <span
                    className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md mb-2 sm:mb-3 uppercase tracking-widest ${colors.badge}`}
                  >
                    {user.role}
                  </span>

                  <div
                    className={`w-10 h-14 sm:w-12 sm:h-16 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black border-2 transition-all duration-500 ${
                      user.vote !== null
                        ? (isRevealed && currentUser.role === "ScrumMaster") || user.id === currentUser.id
                          ? ui.userRevealedBox
                          : ui.userVotedBox
                        : ui.userEmptyBox
                    }`}
                  >
                    {user.vote !== null ? ((isRevealed && currentUser.role === "ScrumMaster") || user.id === currentUser.id ? user.vote : "✓") : "?"}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
});

RoomComponent.displayName = 'Room';

export { RoomComponent as Room };
