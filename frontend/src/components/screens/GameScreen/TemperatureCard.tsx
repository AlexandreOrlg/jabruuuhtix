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

const MAX_BAR_HEIGHT = 40;
const MIN_BAR_WIDTH = 3;
const MAX_BAR_WIDTH = 12;
const BAR_GAP = 4;
const BAR_CONTAINER_WIDTH = 240;
const NEAR_MAX_TEMPERATURE = 90;
const TEMPERATURE_MARKS = [
    { value: 0, label: "Froid", align: "left" },
    { value: 30, label: "Moyen" },
    { value: 60, label: "Chaud" },
    { value: 80, label: "Brûlant" },
];

function getTemperatureBarColor(
    temperature: number,
    enableTrail: boolean
): string {
    if (enableTrail && temperature >= NEAR_MAX_TEMPERATURE) {
        return "temperature-trail";
    }
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
    const isNearMax = bestTemperature >= NEAR_MAX_TEMPERATURE;
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
            color: getTemperatureBarColor(guess.temperature, isNearMax),
        }));

        return { bars, barWidth };
    }, [guesses, isNearMax, playerId, roomMode]);

    useEffect(() => {
        const container = barContainerRef.current;
        if (!container) return;
        requestAnimationFrame(() => {
            container.scrollLeft = container.scrollWidth;
        });
    }, [temperatureBars.bars.length]);

    return (
        <Card className="bg-gray-900/80 border-cyan-400 !pb-0 ">
            <CardContent className="py-1 flex flex-col !pb-0">
                <div className="text-center flex gap-24 items-center">
                    <div className="flex flex-col">
                        <div className="text-sm text-gray-400 mb-1">Température max</div>
                        <div
                            className={`text-5xl font-bold ${Guess.getTemperatureColor(bestTemperature)}`}
                        >
                            {bestTemperature.toFixed(1)}°C
                        </div>
                    </div>

                    <div className="flex flex-col items-center w-full">
                        <div className="relative w-full h-9 text-[10px] text-gray-400">
                            {TEMPERATURE_MARKS.map((mark) => {
                                const alignment =
                                    mark.align === "left"
                                        ? "translate-x-0"
                                        : mark.align === "right"
                                            ? "-translate-x-full"
                                            : "-translate-x-1/2";

                                return (
                                    <div
                                        key={mark.value}
                                        className="absolute top-0"
                                        style={{ left: `${Math.min(100, mark.value)}%` }}
                                    >
                                        <div className={`flex flex-col items-center ${alignment}`}>
                                            <div className="mt-1 whitespace-nowrap leading-none pb-1">
                                                {mark.label}
                                            </div>
                                            <div className="h-2 w-0.5 bg-gray-500/80 pb-1" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <Progress
                            value={progressValue}
                            className="h-4 w-full"
                            progressBg="temperature-progress"
                        />
                    </div>
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
