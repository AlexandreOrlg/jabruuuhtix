import "@/components/ui/8bit/styles/retro.css";
import { useEffect } from "react";
import { useRoom } from "@/hooks/useRoom";
import { usePlayer } from "@/hooks/usePlayer";
import { HomeScreen } from "@/components/HomeScreen";
import { GameScreen } from "@/components/GameScreen";

function App() {
  const { playerId, playerName, setPlayerName } = usePlayer();
  const {
    room,
    guesses,
    isLoading,
    error,
    bestScore,
    revealedWord,
    createRoom,
    joinRoom,
    submitGuess,
    leaveRoom,
  } = useRoom();

  // Sync room code with URL
  useEffect(() => {
    if (room) {
      // Update URL when joining a room
      const url = new URL(window.location.href);
      url.searchParams.set("room", room.code);
      window.history.replaceState({}, "", url.toString());
    } else {
      // Remove room from URL when leaving
      const url = new URL(window.location.href);
      if (url.searchParams.has("room")) {
        url.searchParams.delete("room");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [room]);

  // Auto-join room from URL on load
  useEffect(() => {
    const url = new URL(window.location.href);
    const roomCode = url.searchParams.get("room");

    if (roomCode && !room && playerName) {
      joinRoom(roomCode);
    }
  }, [playerName]); // Only run when playerName is set

  // Handle room creation
  const handleCreateRoom = async () => {
    await createRoom(playerName);
  };

  // Handle room joining
  const handleJoinRoom = async (code: string) => {
    await joinRoom(code);
  };

  // Handle guess submission
  const handleSubmitGuess = async (word: string) => {
    const result = await submitGuess(playerId, playerName, word);
    if (result) {
      return { score: result.score };
    }
    return null;
  };

  // Show game screen if in a room
  if (room) {
    return (
      <GameScreen
        roomCode={room.code}
        guesses={guesses}
        bestScore={bestScore}
        revealedWord={revealedWord}
        playerId={playerId}
        onSubmitGuess={handleSubmitGuess}
        onLeaveRoom={leaveRoom}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  // Show home screen
  return (
    <HomeScreen
      playerName={playerName}
      onPlayerNameChange={setPlayerName}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      isLoading={isLoading}
      error={error}
    />
  );
}

export default App;

