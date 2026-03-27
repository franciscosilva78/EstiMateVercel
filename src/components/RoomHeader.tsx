import { RoomState, User } from "../types";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RoomHeaderProps {
  roomState: RoomState;
  currentUser: User;
  onDelete: () => void;
}

export function RoomHeader({ roomState, currentUser, onDelete }: RoomHeaderProps) {
  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!", {
      description: "Compartilhe com sua equipe para eles entrarem na sala."
    });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-4 sm:p-6 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-sm shadow-lg">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          {roomState.name}
          <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-medium tracking-wide uppercase border border-cyan-500/20">
            {roomState.status === "voting" ? "Votação em andamento" : "Resultados revelados"}
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-400 font-medium">Você é: <span className="text-cyan-400 font-bold">{currentUser.name}</span> ({currentUser.role})</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-lg hover:bg-slate-700/50"
          >
            <Copy size={14} />
            <span className="font-medium">Copiar Link</span>
          </button>
        </div>
      </div>
      
      {currentUser.role === "ScrumMaster" && (
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl font-medium transition-all border border-red-500/20 hover:border-red-500/40 flex-1 sm:flex-none"
          >
            <Trash2 size={18} />
            <span>Encerrar Sala</span>
          </button>
        </div>
      )}
    </div>
  );
}
