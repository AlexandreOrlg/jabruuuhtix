import "@/components/ui/8bit/styles/retro.css";
import { Toaster } from "@/components/ui/sonner";
import { useRoom } from "@/hooks/useRoom";
import { usePlayer } from "@/hooks/usePlayer";
import { useUrlSync } from "@/hooks/useUrlSync";
import { useAutoJoin } from "@/hooks/useAutoJoin";
import { HomeScreen } from "@/components/screens/HomeScreen/HomeScreen";
import { GameScreen } from "@/components/screens/GameScreen/GameScreen";
import { HeartIcon, MarseilleIcon } from "@/components/icons";
import type { RoomMode } from "@/models/Room";

function App() {
  const { playerId, playerName, setPlayerName } = usePlayer();
  const {
    room,
    guesses,
    submittedWords,
    presentPlayers,
    isLoading,
    error,
    guessValidationPulse,
    createRoom,
    joinRoom,
    submitGuess,
    leaveRoom,
  } = useRoom({ playerId, playerName });

  // URL sync and auto-join logic
  const initialRoomCode = useUrlSync(room?.code ?? null);
  const { clearPendingRoomCode } = useAutoJoin({
    room,
    playerName,
    isLoading,
    joinRoom,
  });

  const handleCreateRoom = async (mode: RoomMode) => {
    clearPendingRoomCode();
    await createRoom(mode);
  };

  const handleJoinRoom = async (code: string) => {
    clearPendingRoomCode();
    await joinRoom(code);
  };

  const handleSubmitGuess = async (word: string) => {
    const result = await submitGuess(word);
    return result ? { score: result.score } : null;
  };

  const handleLeaveRoom = () => {
    clearPendingRoomCode();
    leaveRoom();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <main className="flex-1 h-full overflow-hidden">
        {room ? (
          <GameScreen
            room={room}
            guesses={guesses}
            presentPlayers={presentPlayers}
            playerId={playerId}
            submittedWords={submittedWords}
            guessValidationPulse={guessValidationPulse}
            onSubmitGuess={handleSubmitGuess}
            onLeaveRoom={handleLeaveRoom}
            isLoading={isLoading}
          />
        ) : (
          <HomeScreen
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            isLoading={isLoading}
            error={error}
            initialRoomCode={initialRoomCode}
          />
        )}
      </main>

      <footer className="retro bottom-0 left-0 right-0 border-t bg-white/10 border-white/10 px-4 py-3 text-center text-[10px] text-white/70">
        Réalisé avec le
        <HeartIcon />
        sous le
        <MarseilleIcon />
        de Marseille · Open source :{" "}
        <a
          className="underline underline-offset-2 hover:text-white"
          href="https://github.com/AlexandreOrlg/jabruuuhtix"
          target="_blank"
          rel="noreferrer"
        >
          github.com/AlexandreOrlg/jabruuuhtix
        </a>
      </footer>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
