import { useState } from "react";
import { RoomState, User } from "../types";
import { Share, Eye, RotateCcw, Trash2 } from "lucide-react";

interface RoomProps {
  roomState: RoomState | null;
  currentUser: User;
  onVote: (vote: number) => void;
  onReveal: () => void;
  onReset: () => void;
  onDelete: () => void;
  onCalculationChange: (method: "average" | "sumByRole") => void;
  onSelectManualMode: (role: string, vote: number) => void;
}

const VOTING_OPTIONS = Array.from({ length: 26 }, (_, i) => (i + 1) * 0.5);

const getColorClasses = (idx: number) => {
  const colors = [
    { border: "border-purple-500/30", text: "text-purple-400", shadow: "shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]", bg: "bg-purple-500/20", borderActive: "border-purple-500", badge: "bg-purple-500/20 text-purple-300", iconBg: "bg-purple-500/10 border-purple-500/50 text-purple-400" },
    { border: "border-cyan-500/30", text: "text-cyan-400", shadow: "shadow-[0_0_30px_-10px_rgba(34,211,238,0.2)]", bg: "bg-cyan-500/20", borderActive: "border-cyan-500", badge: "bg-cyan-500/20 text-cyan-300", iconBg: "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" },
    { border: "border-emerald-500/30", text: "text-emerald-400", shadow: "shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]", bg: "bg-emerald-500/20", borderActive: "border-emerald-500", badge: "bg-emerald-500/20 text-emerald-300", iconBg: "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" },
    { border: "border-amber-500/30", text: "text-amber-400", shadow: "shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]", bg: "bg-amber-500/20", borderActive: "border-amber-500", badge: "bg-amber-500/20 text-amber-300", iconBg: "bg-amber-500/10 border-amber-500/50 text-amber-400" },
    { border: "border-pink-500/30", text: "text-pink-400", shadow: "shadow-[0_0_30px_-10px_rgba(236,72,153,0.2)]", bg: "bg-pink-500/20", borderActive: "border-pink-500", badge: "bg-pink-500/20 text-pink-300", iconBg: "bg-pink-500/10 border-pink-500/50 text-pink-400" },
  ];
  return colors[idx % colors.length];
};

export function Room({ roomState, currentUser, onVote, onReveal, onReset, onDelete, onCalculationChange, onSelectManualMode }: RoomProps) {
  const [copied, setCopied] = useState(false);

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

  const handleShare = () => {
    const shareUrl = window.location.origin + window.location.pathname + `?name=${encodeURIComponent(roomState.name)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const users = Object.values(roomState.users).filter(u => u.role !== "ScrumMaster");
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

  // Group users by role dynamically
  const roles = Array.from(new Set(users.map(u => u.role)));
  
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-white/10 backdrop-blur-sm shadow-[0_0_30px_-15px_rgba(168,85,247,0.3)]">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            {roomState.name}
          </h2>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-1">
            <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {users.length} usuário{users.length !== 1 ? "s" : ""} online
            </p>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Método: <span className="text-cyan-400">{method === "average" ? "Média Simples" : "Mais Votado por Função"}</span>
            </p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <button
            onClick={handleShare}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl font-bold transition-all border border-cyan-500/30 hover:border-cyan-500/60 text-xs sm:text-sm"
          >
            <Share size={16} />
            {copied ? "COPIADO" : "COMPARTILHAR"}
          </button>
        </div>
      </div>

      {/* Calculation Method Toggle (Scrum Master only) */}
      {currentUser.role === "ScrumMaster" && (
        <div className="flex justify-center">
          <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 flex gap-2">
            <button
              onClick={() => onCalculationChange("sumByRole")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "sumByRole" 
                  ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              MAIS VOTADO POR FUNÇÃO
            </button>
            <button
              onClick={() => onCalculationChange("average")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "average" 
                  ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]" 
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
        <div className="bg-slate-900/50 p-4 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-sm shadow-[0_0_30px_-15px_rgba(34,211,238,0.2)]">
          <h3 className="text-xs sm:text-sm font-bold text-slate-400 mb-4 sm:mb-6 text-center uppercase tracking-widest">Selecione a Estimativa</h3>
          <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center">
            {VOTING_OPTIONS.map((option) => {
              const isSelected = currentUser.vote === option;
              return (
                <button
                  key={option}
                  onClick={() => onVote(option)}
                  className={`h-14 sm:w-14 sm:h-16 rounded-xl font-bold text-base sm:text-lg transition-all flex items-center justify-center border ${
                    isSelected
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-transparent shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105 sm:scale-110"
                      : "bg-slate-950 text-slate-300 border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-slate-900"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {isRevealed && currentUser.role === "ScrumMaster" && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {roles.map((role, idx) => {
              const { result } = roleResults[role];
              const colors = getColorClasses(idx);
              return (
                <div key={role} className={`flex-1 min-w-[200px] max-w-[300px] bg-slate-900/50 p-4 sm:p-6 rounded-3xl border ${colors.border} backdrop-blur-sm ${colors.shadow} flex flex-col items-center justify-center relative overflow-hidden`}>
                  <span className={`${colors.text} font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10`}>
                    {method === "average" ? `Média ${role}` : `Resultado ${role}`}
                  </span>
                  <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">{result > 0 ? result.toFixed(method === "average" ? 2 : 1) : "-"}</span>
                </div>
              );
            })}
            
            <div className="flex-1 min-w-[200px] max-w-[300px] bg-gradient-to-br from-indigo-900 to-slate-900 p-4 sm:p-6 rounded-3xl border border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10">Soma Total</span>
              <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">{totalSum > 0 ? totalSum.toFixed(method === "average" ? 2 : 1) : "-"}</span>
            </div>
          </div>

          {/* Tie Breaker / Distribution UI */}
          {method === "sumByRole" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role, idx) => {
                const { result, stats } = roleResults[role];
                const colors = getColorClasses(idx);
                
                return (
                  <div key={role} className={`bg-slate-900/40 p-5 rounded-3xl border ${colors.border}`}>
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Users Grid */}
      <div className="bg-slate-900/30 p-4 sm:p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-200 uppercase tracking-widest">
            {currentUser.role === "ScrumMaster" ? `PARTICIPANTES - ${users.length}` : "Seu Voto"}
          </h3>
          {currentUser.role === "ScrumMaster" && (
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-all border border-red-500/30 text-xs sm:text-sm"
              >
                <Trash2 size={16} />
                EXCLUIR SALA
              </button>
              
              {!isRevealed ? (
                <button
                  onClick={onReveal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold transition-all text-xs sm:text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  <Eye size={16} />
                  REVELAR VOTOS
                </button>
              ) : (
                <button
                  onClick={onReset}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-white/10 text-xs sm:text-sm"
                >
                  <RotateCcw size={16} />
                  REINICIAR
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {users
            .filter((user) => currentUser.role === "ScrumMaster" || user.id === currentUser.id)
            .map((user) => {
              const roleIdx = roles.indexOf(user.role);
              const colors = roleIdx >= 0 ? getColorClasses(roleIdx) : getColorClasses(0);
              
              return (
                <div
                  key={user.id}
                  className={`flex flex-col items-center p-4 sm:p-6 rounded-2xl border transition-all duration-500 ${
                    user.vote !== null
                      ? "bg-slate-800/80 border-cyan-500/50"
                      : "bg-slate-900/50 border-white/10 border-dashed opacity-70"
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-base sm:text-xl mb-3 sm:mb-4 border-2 ${colors.iconBg}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-200 truncate w-full text-center mb-1 text-sm sm:text-base">
                    {user.name}
                  </span>
                  <span
                    className={`text-[8px] sm:text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded-md mb-3 sm:mb-5 uppercase tracking-widest ${colors.badge}`}
                  >
                    {user.role}
                  </span>

                  <div
                    className={`w-12 h-16 sm:w-16 sm:h-20 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-black border-2 transition-all duration-500 ${
                      user.vote !== null
                        ? (isRevealed && currentUser.role === "ScrumMaster") || user.id === currentUser.id
                          ? "bg-gradient-to-br from-slate-700 to-slate-800 border-white/20 text-white"
                          : "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-slate-950 border-white/5 text-slate-700"
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
}
