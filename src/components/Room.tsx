import { useState } from "react";
import { RoomState, User } from "../types";
import { Share, Eye, RotateCcw, Trash2, UserX } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface RoomProps {
  roomState: RoomState | null;
  currentUser: User;
  onVote: (vote: number) => void;
  onReveal: () => void;
  onReset: () => void;
  onDelete: () => void;
  onCalculationChange: (method: "average" | "sumByRole" | "mostVotedOverall") => void;
  onSelectManualMode: (role: string, vote: number) => void;
  onRemoveUser: (userId: string) => void;
  onChangeUserRole: (newRole: string) => void;
}

const getVotingOptions = (system?: string) => {
  switch (system) {
    case "fibonacci":
      return [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    case "modified_fibonacci":
      return [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100];
    case "estimate":
    default:
      return Array.from({ length: 26 }, (_, i) => (i + 1) * 0.5);
  }
};

const formatVoteDisplay = (vote: number, system?: string) => {
  if (system === "modified_fibonacci" && vote === 0.5) return "½";
  return vote.toString();
};

const getColorClasses = (idx: number) => {
  const colors = [
    { border: "border-purple-500/30", text: "text-purple-400", shadow: "shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]", bg: "bg-purple-500/20", borderActive: "border-purple-500" },
    { border: "border-cyan-500/30", text: "text-cyan-400", shadow: "shadow-[0_0_30px_-10px_rgba(34,211,238,0.2)]", bg: "bg-cyan-500/20", borderActive: "border-cyan-500" },
    { border: "border-emerald-500/30", text: "text-emerald-400", shadow: "shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]", bg: "bg-emerald-500/20", borderActive: "border-emerald-500" },
    { border: "border-amber-500/30", text: "text-amber-400", shadow: "shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]", bg: "bg-amber-500/20", borderActive: "border-amber-500" },
    { border: "border-pink-500/30", text: "text-pink-400", shadow: "shadow-[0_0_30px_-10px_rgba(236,72,153,0.2)]", bg: "bg-pink-500/20", borderActive: "border-pink-500" },
  ];
  return colors[idx % colors.length];
};

export function Room({ roomState, currentUser, onVote, onReveal, onReset, onDelete, onCalculationChange, onSelectManualMode, onRemoveUser, onChangeUserRole }: RoomProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [userToRemove, setUserToRemove] = useState<string | null>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [newRole, setNewRole] = useState(currentUser.role);
  const [customRole, setCustomRole] = useState("");

  if (!roomState) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 px-4 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <div className="text-cyan-400 font-bold tracking-widest uppercase text-sm animate-pulse">{t('establishingConnection')}</div>
      </div>
    );
  }

  const handleShare = () => {
    const shareUrl = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveUserConfirm = (userId: string) => {
    setUserToRemove(userId);
  };

  const confirmRemoveUser = () => {
    if (userToRemove) {
      onRemoveUser(userToRemove);
      setUserToRemove(null);
    }
  };

  const cancelRemoveUser = () => {
    setUserToRemove(null);
  };

  const handleStartEditRole = () => {
    setNewRole(currentUser.role);
    setCustomRole(currentUser.role === "Dev" || currentUser.role === "QA" ? "" : currentUser.role);
    setIsEditingRole(true);
  };

  const handleSaveRole = () => {
    const finalRole = newRole === "Outro" ? customRole.trim() || "Outro" : newRole;
    if (finalRole && finalRole !== currentUser.role) {
      onChangeUserRole(finalRole);
    }
    setIsEditingRole(false);
  };

  const handleCancelEditRole = () => {
    setIsEditingRole(false);
    setNewRole(currentUser.role);
    setCustomRole("");
  };

  const users = Object.values(roomState.users).filter(u =>
    u &&
    u.id &&
    u.name &&
    u.name.trim() !== "" &&
    u.role &&
    u.role !== "ScrumMaster" &&
    typeof u.vote !== 'undefined'
  );
  const votedCount = users.filter(u => u.vote !== null).length;
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
      autoMode: Math.max(...modes)
    };
  };

  // Helper to get overall vote distribution with roles
  const getOverallDistribution = (usersList: User[]) => {
    const distribution: Record<number, { total: number, roles: Record<string, number> }> = {};
    let maxCount = 0;

    usersList.filter(u => u.vote !== null).forEach(u => {
      const vote = u.vote as number;
      if (!distribution[vote]) {
        distribution[vote] = { total: 0, roles: {} };
      }
      distribution[vote].total += 1;
      distribution[vote].roles[u.role] = (distribution[vote].roles[u.role] || 0) + 1;

      if (distribution[vote].total > maxCount) {
        maxCount = distribution[vote].total;
      }
    });

    const modes = Object.keys(distribution)
      .map(Number)
      .filter(v => distribution[v].total === maxCount);

    return {
      distribution,
      modes,
      autoMode: modes.length > 0 ? Math.max(...modes) : 0
    };
  };

  // Group users by role dynamically
  const roles = Array.from(new Set(users.map(u => u.role)));

  const overallStats = getOverallDistribution(users);

  const allVotes = users.filter(u => u.vote !== null).map(u => u.vote as number);
  let overallResult = 0;
  if (method === "average") {
    overallResult = allVotes.length ? allVotes.reduce((a, b) => a + b, 0) / allVotes.length : 0;
  } else {
    overallResult = manualSelections['overall'] !== undefined ? manualSelections['overall'] : overallStats.autoMode;
  }

  // Calculate totalSum for 'sumByRole' and 'average'
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-sm shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)]">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            {roomState.name}
          </h2>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-1">
            <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              {users.length} {t('online')}
            </p>
            {currentUser.role === "ScrumMaster" && (
              <>
                <div className="h-4 w-[1px] bg-white/10"></div>
                <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  {votedCount}/{users.length} {t('voted')}
                </p>
              </>
            )}
            <div className="h-4 w-[1px] bg-white/10"></div>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              {t('method')}: <span className="text-cyan-400">{method === "average" ? t('methodAverage') : method === "sumByRole" ? t('methodSumByRole') : t('methodOverall')}</span>
            </p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-3 items-center justify-center sm:justify-end flex-wrap">
          <button
            onClick={handleShare}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all border text-xs sm:text-sm bg-slate-800/80 text-cyan-400 border-cyan-500/40 hover:border-cyan-500/80 hover:bg-slate-700"
          >
            <Share size={16} />
            {copied ? t('copied') : t('share')}
          </button>
        </div>
      </div>

      {/* Calculation Method Toggle (Scrum Master only) */}
      {currentUser.role === "ScrumMaster" && (
        <div className="flex justify-center">
          <div className="p-1.5 bg-slate-900/60 rounded-2xl border border-white/10 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => onCalculationChange("mostVotedOverall")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "mostVotedOverall"
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] border-transparent scale-105"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t('methodOverall').toUpperCase()}
            </button>
            <button
              onClick={() => onCalculationChange("sumByRole")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "sumByRole"
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] border-transparent scale-105"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t('methodSumByRole').toUpperCase()}
            </button>
            <button
              onClick={() => onCalculationChange("average")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                method === "average"
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] border-transparent scale-105"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t('methodAverage').toUpperCase()}
            </button>
          </div>
        </div>
      )}

      {/* User Role Section */}
      {currentUser.role !== "ScrumMaster" && (
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm font-medium">{t('selectRole')}:</span>
              <span className="text-lg font-bold text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-white/10">
                {currentUser.role}
              </span>
            </div>

            {!isEditingRole ? (
              <button
                onClick={handleStartEditRole}
                className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 rounded-xl font-bold transition-all border border-cyan-500/30 text-sm"
              >
                {t('changeRole')}
              </button>
            ) : (
              <div className="flex flex-col w-full sm:w-auto gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewRole("Dev")}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      newRole === "Dev"
                        ? "bg-cyan-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    DEV
                  </button>
                  <button
                    onClick={() => setNewRole("QA")}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      newRole === "QA"
                        ? "bg-purple-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    QA
                  </button>
                  <button
                    onClick={() => setNewRole("Outro")}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      newRole === "Outro"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    {t('other')}
                  </button>
                </div>

                {newRole === "Outro" && (
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm"
                    placeholder={t('otherRolePlaceholder')}
                    autoFocus
                  />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveRole}
                    className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-lg font-bold transition-all border border-emerald-500/30 text-sm"
                  >
                    {t('save')}
                  </button>
                  <button
                    onClick={handleCancelEditRole}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-bold transition-all text-sm"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voting Options */}
      {!isRevealed && currentUser.role !== "ScrumMaster" && (
        <div className="p-4 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-sm shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)]">
          <h3 className="text-xs sm:text-sm font-bold text-slate-400 mb-4 sm:mb-6 text-center uppercase tracking-widest">{t('selectEstimate')}</h3>
          <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center">
            {getVotingOptions(roomState.votingSystem).map((option) => {
              const isSelected = currentUser.vote === option;
              return (
                <button
                  key={option}
                  onClick={() => onVote(option)}
                  className={`h-14 sm:w-14 sm:h-16 rounded-xl font-bold text-base sm:text-lg transition-all flex items-center justify-center border ${
                    isSelected
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] border-transparent scale-105"
                      : "bg-slate-950 text-slate-300 border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-slate-800"
                  }`}
                >
                  {formatVoteDisplay(option, roomState.votingSystem)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {isRevealed && currentUser.role === "ScrumMaster" && (
        <div className="space-y-6">
          {method === "mostVotedOverall" ? (
            <div className="flex flex-col sm:flex-row justify-center items-start gap-4 sm:gap-6">

              {/* DISTRIBUIÇÃO GERAL (Left) */}
              <div className="flex flex-col gap-4 flex-1 min-w-[200px] max-w-[400px] w-full">
                <div className="p-5 rounded-3xl border border-white/10 bg-slate-900/60">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">{t('generalDistribution')}</h4>
                  <div className="space-y-3">
                    {Object.entries(overallStats.distribution).sort((a, b) => Number(b[0]) - Number(a[0])).map(([voteStr, data]) => {
                      const vote = Number(voteStr);
                      const isMode = overallStats.modes.includes(vote);
                      const isSelected = overallResult === vote;

                      const roleEntries = Object.entries(data.roles).map(([r, c]) => `${c} ${r}`);
                      const roleString = roleEntries.length > 0 ? `(${roleEntries.join(' + ')})` : '';

                      return (
                        <button
                          key={vote}
                          disabled={!isMode || overallStats.modes.length <= 1}
                          onClick={() => onSelectManualMode('overall', vote)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-gradient-to-br from-slate-700 to-slate-800 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                              : isMode
                                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:border-cyan-500"
                                : "bg-slate-950 border-white/5 text-slate-700 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-white">{formatVoteDisplay(vote, roomState.votingSystem)}</span>
                            <span className="text-sm font-bold text-slate-300">- {data.total} {data.total !== 1 ? t('votes') : t('vote')} {roleString}</span>
                          </div>
                          {isMode && overallStats.modes.length > 1 && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">{t('tie')}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* VOTAÇÃO GERAL (Right) */}
              <div className="flex flex-col gap-4 flex-1 min-w-[200px] max-w-[300px] w-full">
                <div className="p-4 sm:p-6 rounded-3xl border flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]">
                  <span className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10">
                    {t('generalVoting')}
                  </span>
                  <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">
                    {allVotes.length > 0 ? formatVoteDisplay(overallResult, roomState.votingSystem) : "-"}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-wrap justify-center items-start gap-4 sm:gap-6">
              {roles.map((role, idx) => {
                const { result, stats } = roleResults[role];
                const colors = getColorClasses(idx);
                return (
                  <div key={role} className="flex flex-col gap-4 flex-1 min-w-[200px] max-w-[300px]">
                    <div className={`p-4 sm:p-6 rounded-3xl border ${colors.border} bg-slate-900/60 ${colors.shadow} flex flex-col items-center justify-center relative overflow-hidden`}>
                      <span className={`${colors.text} font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10`}>
                        {method === "average" ? `${t('averageRole')} ${role}` : `${t('voteRole')} ${role}`}
                      </span>
                      <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">
                        {allVotes.length > 0
                          ? (method === "average" ? result.toFixed(2) : formatVoteDisplay(result, roomState.votingSystem))
                          : "-"}
                      </span>
                    </div>

                    <div className={`p-5 rounded-3xl border ${colors.border} bg-slate-900/60`}>
                      <h4 className={`text-xs font-bold ${colors.text} uppercase tracking-widest mb-4`}>{t('voteDistributionRole')} {role}</h4>
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
                                <span className="text-lg font-black text-white">{formatVoteDisplay(Number(vote), roomState.votingSystem)}</span>
                                {isMode && stats.modes.length > 1 && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">{t('tie')}</span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-slate-400">{count} {count !== 1 ? t('votes') : t('vote')}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col gap-4 flex-1 min-w-[200px] max-w-[300px]">
                <div className="p-4 sm:p-6 rounded-3xl border flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]">
                  <span className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1 sm:mb-2 relative z-10">
                    {method === "average" ? t('methodAverage') : t('methodSumByRole')}
                  </span>
                  <span className="text-3xl sm:text-5xl font-bold text-white relative z-10">
                    {allVotes.length > 0
                      ? (method === "average"
                        ? overallResult.toFixed(2)
                        : formatVoteDisplay(totalSum, roomState.votingSystem))
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Grid */}
      <div className="p-4 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-200 uppercase tracking-widest">
            {currentUser.role === "ScrumMaster" ? `${t('participants')} - ${users.length}` : t('yourVote')}
          </h3>
          {currentUser.role === "ScrumMaster" && (
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-all border border-red-500/30 text-xs sm:text-sm"
              >
                <Trash2 size={16} />
                {t('deleteRoom')}
              </button>

              {!isRevealed ? (
                <button
                  onClick={onReveal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-[1.02]"
                >
                  <Eye size={16} />
                  {t('revealVotes')}
                </button>
              ) : (
                <button
                  onClick={onReset}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border text-xs sm:text-sm bg-slate-800/80 text-cyan-400 border-cyan-500/40 hover:border-cyan-500/80 hover:bg-slate-700"
                >
                  <RotateCcw size={16} />
                  {t('restart')}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {users
            .filter((user) => currentUser.role === "ScrumMaster" || user.id === currentUser.id)
            .map((user) => {
              return (
                <div
                  key={user.id}
                  className={`relative flex flex-col items-center p-3 sm:p-4 rounded-2xl border transition-all duration-500 ${
                    user.vote !== null
                      ? "bg-slate-800/80 border-cyan-500/50"
                      : "bg-slate-900/60 border-white/10 border-dashed opacity-70"
                  }`}
                >
                  <span className="font-bold text-slate-200 truncate w-full text-center mb-1 text-xs sm:text-sm">
                    {user.name}
                  </span>

                  <div className="flex items-center gap-1 mb-2 sm:mb-3">
                    <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-widest bg-slate-700 text-slate-300">
                      {user.role}
                    </span>
                    {currentUser.role === "ScrumMaster" && user.id !== currentUser.id && (
                      <button
                        onClick={() => handleRemoveUserConfirm(user.id)}
                        className="w-4 h-4 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/30 hover:border-red-500/50"
                        title={t('removeUser')}
                      >
                        <UserX size={10} />
                      </button>
                    )}
                  </div>

                  <div
                    className={`w-10 h-14 sm:w-12 sm:h-16 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black border-2 transition-all duration-500 ${
                      user.vote !== null
                        ? (isRevealed && currentUser.role === "ScrumMaster") || user.id === currentUser.id
                          ? "bg-gradient-to-br from-slate-700 to-slate-800 border-white/20 text-white"
                          : "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-slate-950 border-white/5 text-slate-700"
                    }`}
                  >
                    {user.vote !== null ? ((isRevealed && currentUser.role === "ScrumMaster") || user.id === currentUser.id ? formatVoteDisplay(user.vote, roomState.votingSystem) : "✓") : "?"}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Remove User Confirmation Modal */}
      {userToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 text-center">
              {t('removeUser')}
            </h3>
            <p className="text-slate-400 mb-6 text-center text-sm">
              {t('confirmRemoveUser')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelRemoveUser}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold transition-all border text-sm bg-slate-800/80 text-cyan-400 border-cyan-500/40 hover:border-cyan-500/80 hover:bg-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmRemoveUser}
                className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-bold transition-all border border-red-500/30 hover:border-red-500/50 text-sm"
              >
                {t('removeUser')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
