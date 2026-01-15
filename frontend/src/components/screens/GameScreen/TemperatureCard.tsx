import { useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";
import { Guess } from "@/models/Guess";
import type { RoomMode } from "@/models/Room";

interface TemperatureCardProps {
    bestTemperature: number;
    lastGuess: Guess | null;
    guesses: Guess[];
    roomMode: RoomMode;
    playerId: string;
}

const MAX_BAR_HEIGHT = 96;
const MIN_BAR_WIDTH = 3;
const MAX_BAR_WIDTH = 12;
const BAR_GAP = 4;
const BAR_CONTAINER_WIDTH = 240;

function getTemperatureBarColor(temperature: number): string {
    if (temperature >= 90) return "bg-red-500";
    if (temperature >= 75) return "bg-red-400";
    if (temperature >= 60) return "bg-orange-400";
    if (temperature >= 45) return "bg-amber-400";
    if (temperature >= 30) return "bg-yellow-400";
    if (temperature >= 20) return "bg-lime-400";
    if (temperature >= 10) return "bg-teal-300";
    if (temperature > 0) return "bg-sky-300";
    return "bg-cyan-400";
}

export function TemperatureCard({
    bestTemperature,
    lastGuess,
    guesses,
    roomMode,
    playerId,
}: TemperatureCardProps) {
    const barContainerRef = useRef<HTMLDivElement>(null);
    const progressValue = Math.min(100, Math.max(0, bestTemperature));
    const temperatureBars = useMemo(() => {
        const sourceGuesses =
            roomMode === "coop"
                ? guesses
                : guesses.filter((guess) => guess.belongsTo(playerId));
        const orderedGuesses = [...sourceGuesses].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const count = orderedGuesses.length;
        if (count === 0) {
            return { bars: [], barWidth: MAX_BAR_WIDTH };
        }

        const computedWidth = Math.floor(
            (BAR_CONTAINER_WIDTH - BAR_GAP * Math.max(0, count - 1)) / count
        );
        const barWidth = Math.max(
            MIN_BAR_WIDTH,
            Math.min(MAX_BAR_WIDTH, computedWidth)
        );

        const bars = orderedGuesses.map((guess) => ({
            id: guess.id,
            height: Math.max(4, Math.round((guess.temperature / 100) * MAX_BAR_HEIGHT)),
            color: getTemperatureBarColor(guess.temperature),
        }));

        return { bars, barWidth };
    }, [guesses, playerId, roomMode]);

    useEffect(() => {
        const container = barContainerRef.current;
        if (!container) return;
        requestAnimationFrame(() => {
            container.scrollLeft = container.scrollWidth;
        });
    }, [temperatureBars.bars.length]);

    return (
        <Card className="bg-gray-900/80 border-cyan-400 !pb-0">
            <CardContent className="py-4 flex flex-col min-h-[240px] !pb-0">
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Température max</div>
                    <div
                        className={`text-5xl font-bold ${Guess.getTemperatureColor(bestTemperature)}`}
                    >
                        {bestTemperature.toFixed(1)}°C
                    </div>
                    <Progress value={progressValue} className="mt-3 h-4" />
                </div>
                <div className="text-center">
                    <div className="mt-3 text-xs text-gray-400">Dernière soumission</div>
                    {lastGuess ? (
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <span className="font-medium truncate max-w-[140px]">
                                {lastGuess.word}
                            </span>
                            <span className={lastGuess.temperatureColor}>
                                {lastGuess.temperatureEmoji} {lastGuess.formattedTemperature}
                            </span>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500 mt-1">
                            Aucune proposition pour l'instant
                        </div>
                    )}
                </div>
                <div className="-pb-4 mt-auto w-full flex justify-center pt-4">
                    <div
                        ref={barContainerRef}
                        className="flex items-end w-full justify-start overflow-x-auto hide-scrollbar"
                        style={{
                            gap: `${BAR_GAP}px`,
                            height: `${MAX_BAR_HEIGHT}px`,
                        }}
                    >
                        {temperatureBars.bars.map((bar) => (
                            <span
                                key={bar.id}
                                className={`${bar.color}`}
                                style={{
                                    width: `${temperatureBars.barWidth}px`,
                                    height: `${bar.height}px`,
                                    minWidth: `${MIN_BAR_WIDTH}px`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
