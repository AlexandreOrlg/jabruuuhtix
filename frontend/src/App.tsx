import "@/components/ui/8bit/styles/retro.css";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useRoom } from "@/hooks/useRoom";
import { usePlayer } from "@/hooks/usePlayer";
import { useUrlSync } from "@/hooks/useUrlSync";
import { HomeScreen } from "@/components/screens/HomeScreen/HomeScreen";
import { GameScreen } from "@/components/screens/GameScreen/GameScreen";
import type { RoomMode } from "@/models/Room";

const HEART_ICON = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 60 60"
        height={24}
        className="inline mx-3"
    >
        <path fill="#fff" d="M12 18h6v6h-6v-6ZM18 6h6v6h-6V6Zm-6 0h6v6h-6V6Zm12 6h6v6h-6v-6Zm6 0h6v6h-6v-6Zm6-6h6v6h-6V6Zm6 0h6v6h-6V6Zm6 0h6v6h-6V6Zm6 6h6v6h-6v-6Zm0 6h6v6h-6v-6ZM6 6h6v6H6V6Zm-6 6h6v6H0v-6Zm0 6h6v6H0v-6Zm0 6h6v6H0v-6Zm54 0h6v6h-6v-6ZM6 30h6v6H6v-6Zm6 6h6v6h-6v-6Zm6 6h6v6h-6v-6Zm6 6h6v6h-6v-6Zm6 0h6v6h-6v-6Zm6-6h6v6h-6v-6Zm6-6h6v6h-6v-6Zm6-6h6v6h-6v-6Z" />
        <path fill="#9D0000" d="M6 12h6v6H6v-6Z" />
        <path fill="red" d="M12 12h6v6h-6v-6Zm6 0h6v6h-6v-6Z" />
        <path fill="#9D0000" d="M6 18h6v6H6v-6Z" />
        <path fill="red" d="M12 18h6v6h-6v-6Zm6 0h6v6h-6v-6Z" />
        <path fill="#9D0000" d="M6 24h6v6H6v-6Z" />
        <path fill="red" d="M12 24h6v6h-6v-6Zm6 0h6v6h-6v-6Z" />
        <path fill="#9D0000" d="M12 30h6v6h-6v-6Z" />
        <path fill="red" d="M18 30h6v6h-6v-6Z" />
        <path fill="#9D0000" d="M18 36h6v6h-6v-6Z" />
        <path fill="red" d="M24 36h6v6h-6v-6Z" />
        <path fill="#9D0000" d="M24 42h6v6h-6v-6Z" />
        <path fill="red" d="M30 42h6v6h-6v-6Zm0-6h6v6h-6v-6Zm-6-6h6v6h-6v-6Zm6 0h6v6h-6v-6Zm0-6h6v6h-6v-6Zm-6 0h6v6h-6v-6Zm0-6h6v6h-6v-6Zm6 0h6v6h-6v-6Zm6 6h6v6h-6v-6Zm6 6h6v6h-6v-6Zm-6 0h6v6h-6v-6Zm0 6h6v6h-6v-6Zm6-12h6v6h-6v-6Z" />
        <path fill="#FF5757" d="M48 24h6v6h-6v-6Z" />
        <path fill="red" d="M36 18h6v6h-6v-6Zm6 0h6v6h-6v-6Z" />
        <path fill="#FF5757" d="M48 18h6v6h-6v-6Zm0-6h6v6h-6v-6Zm-6 0h6v6h-6v-6Zm-6 0h6v6h-6v-6Z" />
    </svg>
);

const MARSEILLE_ICON = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 78 78"
        height={24}
        className="inline mx-3"
    >
        <g clip-path=" url(#a)">
            <path fill="#FFC41D" d="M46 20.5c-4.833.667-14.8 1.6-16 0V24l-7.5 6.5L22 46l10 11 14-.5 9-9.5V31l-4.5-3.5-4.5-7Z" />
            <path fill="#fff" d="M24 30v-6h6v6h-6ZM30 24v-6h6v6h-6ZM36 24v-6h6v6h-6ZM42 24v-6h6v6h-6ZM48 30v-6h6v6h-6ZM60 18v-6h6v6h-6ZM18 60v6h-6v-6h6ZM18 18v-6h6v6h-6ZM60 60v6h-6v-6h6ZM66 12V6h6v6h-6ZM12 66v6H6v-6h6ZM12 12V6h6v6h-6ZM66 66v6h-6v-6h6ZM36 12V6h6v6h-6ZM42 66v6h-6v-6h6ZM66 36h6v6h-6v-6ZM12 42H6v-6h6v6ZM0 36h6v6H0v-6ZM78 42h-6v-6h6v6ZM36 6V0h6v6h-6ZM42 72v6h-6v-6h6ZM54 36v-6h6v6h-6ZM54 42v-6h6v6h-6v-6ZM54 48v-6h6v6h-6ZM48 54v-6h6v6h-6ZM42 60v-6h6v6h-6ZM36 60v-6h6v6h-6ZM30 60v-6h6v6h-6ZM24 54v-6h6v6h-6ZM18 48v-6h6v6h-6ZM18 42v-6h6v6h-6v-6ZM18 36v-6h6v6h-6v-6Z" />
        </g>
        <defs>
            <clipPath id="a">
                <path fill="#fff" d="M0 0h78v78H0z" />
            </clipPath>
        </defs>
    </svg>
);



function App() {
  const { playerId, playerName, setPlayerName } = usePlayer();
  const {
    room,
    guesses,
    submittedWords,
    presentPlayers,
    isLoading,
    error,
    revealedWord,
    createRoom,
    joinRoom,
    submitGuess,
    leaveRoom,
  } = useRoom({ playerId, playerName });

  const hasStoredPlayerNameRef = useRef(Boolean(playerName.trim()));
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);
  const hasHandledInitialRoomCodeRef = useRef(false);

  const initialRoomCode = useUrlSync(room?.code ?? null);

  useEffect(() => {
    if (hasHandledInitialRoomCodeRef.current || !initialRoomCode || room) return;
    setPendingRoomCode(initialRoomCode);
    hasHandledInitialRoomCodeRef.current = true;
  }, [initialRoomCode, room]);

  // Auto-join room from URL once pseudo is set
  useEffect(() => {
    if (!pendingRoomCode || room || !playerName.trim() || isLoading) return;
    if (!hasStoredPlayerNameRef.current) return;
    let cancelled = false;

    const attemptJoin = async () => {
      await joinRoom(pendingRoomCode);
      if (cancelled) return;
      setPendingRoomCode(null);
    };

    attemptJoin();

    return () => {
      cancelled = true;
    };
  }, [pendingRoomCode, room, playerName, joinRoom, isLoading]);

  // Handle room creation
  const handleCreateRoom = async (mode: RoomMode) => {
    setPendingRoomCode(null);
    await createRoom(mode);
  };

  // Handle room joining
  const handleJoinRoom = async (code: string) => {
    setPendingRoomCode(null);
    await joinRoom(code);
  };

  // Handle guess submission
  const handleSubmitGuess = async (word: string) => {
    const result = await submitGuess(word);
    if (result) {
      return { score: result.score };
    }
    return null;
  };

  const handleLeaveRoom = () => {
    setPendingRoomCode(null);
    leaveRoom();
  };

  // Show game screen if in a room
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <main className="flex-1 h-full overflow-hidden">
        {room ? (
          <GameScreen
            roomCode={room.code}
            guesses={guesses}
            presentPlayers={presentPlayers}
            roomMode={room.mode}
            revealedWord={revealedWord}
            playerId={playerId}
            submittedWords={submittedWords}
            onSubmitGuess={handleSubmitGuess}
            onLeaveRoom={handleLeaveRoom}
            isLoading={isLoading}
            error={error}
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

      <footer className="retro bottom-0 left-0 right-0 border-t bg-white/10 border-white/10  px-4 py-3 text-center text-[10px] text-white/70">
        Réalisé avec le
        {HEART_ICON}
        sous le
        {MARSEILLE_ICON}
        de Marseille · Open source :{" "}
        <a
          className="underline underline-offset-2 hover:text-white"
          href="https://github.com/AlexandreOrlg/jabruuuhtix"
          target="_blank"
          rel="noreferrer"
        >
          github.com/AlexandreOrlg/jabruuuhtix
        </a>
      </footer >


      <Toaster position="bottom-right" />
    </div >
  );
}

export default App;
