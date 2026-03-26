/// <reference types="vite/client" />
import { useEffect, useState, FormEvent, useCallback, useMemo, memo, lazy, Suspense } from "react";
import { RoomState, User } from "./types";
import { Layout } from "./components/Layout";
import { db, auth } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useOptimizedFirestore } from "./hooks/useOptimizedFirestore";
import { useScreenReaderAnnouncements } from "./hooks/useAccessibility";
import { useOptimizedCallback } from "./utils/performance";

// Lazy load dos componentes para code splitting
const JoinRoom = lazy(() => import("./components/JoinRoom").then(module => ({ default: module.JoinRoom })));
const Room = lazy(() => import("./components/Room").then(module => ({ default: module.Room })));

// Loading component para Suspense
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-32 space-y-4 px-4 text-center">
    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
    <div className="text-cyan-400 font-bold tracking-widest uppercase text-sm animate-pulse">Carregando...</div>
  </div>
);

const generateShortId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const AppComponent = memo(() => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { announce } = useScreenReaderAnnouncements();

  // Authentication handler otimizado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        try {
          await signInAnonymously(auth);
          setAuthError(null);
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          setAuthError("Erro de conexão. Tentando reconectar...");
          // Retry após 3 segundos
          setTimeout(() => {
            signInAnonymously(auth).catch(() => {
              setAuthError("Não foi possível conectar. Verifique sua conexão.");
            });
          }, 3000);
        }
      } else {
        setIsAuthReady(true);
        setAuthError(null);
        announce("Conectado com sucesso");
      }
    });
    return () => unsubscribe();
  }, [announce]);

  // URL parsing otimizado
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/room\/([a-zA-Z0-9-]+)$/);
    if (match) {
      setRoomId(match[1]);
      announce(`Entrando na sala ${match[1]}`);
    }
  }, [announce]);

  // Hook otimizado para Firestore
  const handleRoomUpdate = useCallback((data: RoomState | null) => {
    if (data) {
      setRoomState(data);
      // Anunciar mudanças importantes
      if (data.status === "revealed") {
        announce("Votos revelados");
      }
    } else {
      // Room deleted
      setRoomId(null);
      setUser(null);
      setRoomState(null);
      window.history.pushState({}, "", "/");
      announce("Sala foi excluída");
    }
  }, [announce]);

  const handleFirestoreError = useCallback((error: Error) => {
    console.error("Error listening to room:", error);
    announce("Erro de conexão com a sala");
  }, [announce]);

  // Usar hook otimizado do Firestore
  useOptimizedFirestore(
    roomId && user && isAuthReady ? `rooms/${roomId}` : '',
    handleRoomUpdate,
    {
      enabled: !!(roomId && user && isAuthReady),
      onError: handleFirestoreError
    }
  );

  const handleCreateRoom = useOptimizedCallback(async (e: FormEvent) => {
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
      announce(`Sala ${roomNameInput} criada com sucesso`);
    } catch (error) {
      console.error("Error creating room:", error);
      announce("Erro ao criar sala. Tente novamente.");
    }
  }, [roomNameInput, isAuthReady, announce]);

  const handleJoin = useOptimizedCallback(async (name: string, role: string) => {
    if (!isAuthReady || !roomId) return;

    if (roomState) {
      const nameExists = (Object.values(roomState.users) as User[]).some(
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
      announce(`Entrou na sala como ${role}`);
    } catch (error) {
      console.error("Error joining room:", error);
      announce("Erro ao entrar na sala");
      throw new Error("Erro ao conectar com o servidor.");
    }
  }, [isAuthReady, roomId, roomState, announce]);

  const handleVote = useOptimizedCallback(async (vote: number) => {
    if (roomId && user) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        [`users.${user.id}.vote`]: vote
      });
      announce(`Voto ${vote} registrado`);
    }
  }, [roomId, user, announce]);

  const handleReveal = useOptimizedCallback(async () => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, { status: "revealed" });
      announce("Revelando votos de todos os participantes");
    }
  }, [roomId, announce]);

  const handleReset = useOptimizedCallback(async () => {
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
      announce("Nova rodada de votação iniciada");
    }
  }, [roomId, roomState, announce]);

  const handleCalculationChange = useOptimizedCallback(async (method: "average" | "sumByRole" | "mostVotedOverall") => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, { calculationMethod: method });
      const methodNames = {
        average: "Média Simples",
        sumByRole: "Votação por Função",
        mostVotedOverall: "Votação Geral"
      };
      announce(`Método alterado para ${methodNames[method]}`);
    }
  }, [roomId, announce]);

  const handleSelectManualMode = useOptimizedCallback(async (role: string, vote: number) => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        [`manualModeSelections.${role}`]: vote
      });
      announce(`Seleção manual: ${role} - ${vote} pontos`);
    }
  }, [roomId, announce]);

  const handleThemeChange = useOptimizedCallback(async (theme: "default" | "cyberpunk" | "matrix" | "ocean") => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, { theme });
      const themeNames = {
        default: "Padrão",
        cyberpunk: "Cyberpunk",
        matrix: "Matrix",
        ocean: "Oceano"
      };
      announce(`Tema alterado para ${themeNames[theme]}`);
    }
  }, [roomId, announce]);

  const handleDeleteRoom = useOptimizedCallback(async () => {
    if (roomId && window.confirm("Tem certeza que deseja excluir esta sala?")) {
      const roomRef = doc(db, "rooms", roomId);
      await deleteDoc(roomRef);
      announce("Sala excluída com sucesso");
    }
  }, [roomId, announce]);

  // Memoização do currentUser para evitar re-renders
  const currentUserMemo = useMemo(() => {
    return user && roomState?.users[user.id] ? roomState.users[user.id] : user;
  }, [user, roomState?.users]);

  return (
    <Layout theme={roomState?.theme || "default"}>
      <div role="main" aria-label="Aplicação de Planning Poker">
        {/* Skip link para navegação por teclado */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          Pular para o conteúdo principal
        </a>

        <div id="main-content">
          {authError && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center"
            >
              {authError}
            </div>
          )}

          {!roomId ? (
            <section
              aria-labelledby="create-room-heading"
              className="flex flex-col items-center justify-center min-h-[60vh] px-4"
            >
              <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)] backdrop-blur-sm">
                <h1
                  id="create-room-heading"
                  className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
                >
                  Criar Sala
                </h1>
                <form onSubmit={handleCreateRoom} className="space-y-4 sm:space-y-6">
                  <div>
                    <label
                      htmlFor="room-name"
                      className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider"
                    >
                      Nome da Sala
                    </label>
                    <input
                      id="room-name"
                      type="text"
                      value={roomNameInput}
                      onChange={(e) => setRoomNameInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-white placeholder-slate-600 font-medium text-sm sm:text-base"
                      placeholder="ex: Planejamento Sprint 42"
                      aria-describedby="room-name-help"
                      required
                      autoFocus
                    />
                    <div id="room-name-help" className="sr-only">
                      Digite um nome descritivo para sua sala de planning poker
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!roomNameInput.trim() || !isAuthReady}
                    aria-describedby="create-button-help"
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    {isAuthReady ? "Iniciar Sala" : "Conectando..."}
                  </button>
                  <div id="create-button-help" className="sr-only">
                    Cria uma nova sala de planning poker com você como Scrum Master
                  </div>
                </form>
              </div>
            </section>
          ) : !user ? (
            <Suspense fallback={<LoadingSpinner />}>
              <JoinRoom onJoin={handleJoin} theme={roomState?.theme} />
            </Suspense>
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <Room
                roomState={roomState}
                currentUser={currentUserMemo}
                onVote={handleVote}
                onReveal={handleReveal}
                onReset={handleReset}
                onDelete={handleDeleteRoom}
                onCalculationChange={handleCalculationChange}
                onSelectManualMode={handleSelectManualMode}
                onThemeChange={handleThemeChange}
              />
            </Suspense>
          )}
        </div>
      </div>
    </Layout>
  );
});

AppComponent.displayName = 'App';

export default AppComponent;
