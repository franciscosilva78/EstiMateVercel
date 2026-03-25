/// <reference types="vite/client" />
import { useEffect, useState, FormEvent } from "react";
import { RoomState, User } from "./types";
import { JoinRoom } from "./components/JoinRoom";
import { Room } from "./components/Room";
import { Layout } from "./components/Layout";
import { db, auth } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

const generateShortId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error signing in anonymously:", error);
        }
      } else {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/room\/([a-zA-Z0-9-]+)$/);
    if (match) {
      setRoomId(match[1]);
    }
  }, []);

  useEffect(() => {
    if (roomId && user && isAuthReady) {
      const roomRef = doc(db, "rooms", roomId);
      
      const unsubscribe = onSnapshot(roomRef, (docSnap) => {
        if (docSnap.exists()) {
          setRoomState(docSnap.data() as RoomState);
        } else {
          // Room deleted
          setRoomId(null);
          setUser(null);
          setRoomState(null);
          window.history.pushState({}, "", "/");
        }
      }, (error) => {
        console.error("Error listening to room:", error);
      });

      return () => unsubscribe();
    }
  }, [roomId, user, isAuthReady]);

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomNameInput.trim() || !isAuthReady) return;
    
    const newRoomId = generateShortId();
    const scrumMaster: User = { id: auth.currentUser!.uid, name: "Scrum Master", role: "ScrumMaster", vote: null };
    
    const newRoom: RoomState = {
      id: newRoomId,
      name: roomNameInput,
      status: "voting",
      calculationMethod: "sumByRole",
      manualModeSelections: {},
      users: {
        [scrumMaster.id]: scrumMaster
      }
    };

    try {
      await setDoc(doc(db, "rooms", newRoomId), newRoom);
      window.history.pushState({}, "", `/room/${newRoomId}`);
      setRoomId(newRoomId);
      setUser(scrumMaster);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleJoin = async (name: string, role: string) => {
    if (!isAuthReady || !roomId) return;
    
    if (roomState) {
      const nameExists = Object.values(roomState.users).some(
        (u) => u.name.toLowerCase() === name.trim().toLowerCase() && u.id !== auth.currentUser!.uid
      );
      if (nameExists) {
        throw new Error("Este nome já está em uso na sala.");
      }
    }

    const newUser: User = { id: auth.currentUser!.uid, name: name.trim(), role, vote: null };
    
    try {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        [`users.${newUser.id}`]: newUser
      });
      setUser(newUser);
    } catch (error) {
      console.error("Error joining room:", error);
      throw new Error("Erro ao conectar com o servidor.");
    }
  };

  const handleVote = async (vote: number) => {
    if (roomId && user) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        [`users.${user.id}.vote`]: vote
      });
    }
  };

  const handleReveal = async () => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, { status: "revealed" });
    }
  };

  const handleReset = async () => {
    if (roomId && roomState) {
      const roomRef = doc(db, "rooms", roomId);
      const updates: Record<string, any> = {
        status: "voting",
        manualModeSelections: {}
      };
      
      // Reset all votes
      Object.keys(roomState.users).forEach(userId => {
        updates[`users.${userId}.vote`] = null;
      });
      
      await updateDoc(roomRef, updates);
    }
  };

  const handleCalculationChange = async (method: "average" | "sumByRole") => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, { calculationMethod: method });
    }
  };

  const handleSelectManualMode = async (role: string, vote: number) => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        [`manualModeSelections.${role}`]: vote
      });
    }
  };

  const handleDeleteRoom = async () => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await deleteDoc(roomRef);
    }
  };

  return (
    <Layout>
      {!roomId ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)] backdrop-blur-sm">
            <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Criar Sala
            </h1>
            <form onSubmit={handleCreateRoom} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Nome da Sala</label>
                <input
                  type="text"
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-white placeholder-slate-600 font-medium text-sm sm:text-base"
                  placeholder="ex: Planejamento Sprint 42"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!roomNameInput.trim() || !isAuthReady}
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
              >
                {isAuthReady ? "Iniciar Sala" : "Conectando..."}
              </button>
            </form>
          </div>
        </div>
      ) : !user ? (
        <JoinRoom onJoin={handleJoin} />
      ) : (
        <Room
          roomState={roomState}
          currentUser={(roomState?.users[user.id]) || user}
          onVote={handleVote}
          onReveal={handleReveal}
          onReset={handleReset}
          onDelete={handleDeleteRoom}
          onCalculationChange={handleCalculationChange}
          onSelectManualMode={handleSelectManualMode}
        />
      )}
    </Layout>
  );
}
