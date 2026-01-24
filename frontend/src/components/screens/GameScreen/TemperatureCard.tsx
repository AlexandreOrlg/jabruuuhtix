import { useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";
import { Guess } from "@/models/Guess";
import {
    getTemperatureBarColor,
    getTemperatureTextColor,
    TEMPERATURE_MARKS,
    NEAR_MAX_TEMPERATURE,
} from "@/lib/temperature";
import { TEMPERATURE_BAR } from "@/lib/constants";

interface TemperatureCardProps {
    bestTemperature: number;
    barGuesses: Guess[];
}

export function TemperatureCard({
    bestTemperature,
    barGuesses,
}: TemperatureCardProps) {
    const barContainerRef = useRef<HTMLDivElement>(null);
    const progressValue = Math.min(100, Math.max(0, bestTemperature));
    const isNearMax = bestTemperature >= NEAR_MAX_TEMPERATURE;

    const temperatureBars = useMemo(() => {
        const count = barGuesses.length;
        if (count === 0) {
            return { bars: [], barWidth: TEMPERATURE_BAR.MAX_WIDTH };
        }

        const computedWidth = Math.floor(
            (TEMPERATURE_BAR.CONTAINER_WIDTH - TEMPERATURE_BAR.GAP * Math.max(0, count - 1)) / count
        );
        const barWidth = Math.max(
            TEMPERATURE_BAR.MIN_WIDTH,
            Math.min(TEMPERATURE_BAR.MAX_WIDTH, computedWidth)
        );

        const bars = barGuesses.map((guess) => ({
            id: guess.id,
            height: Math.max(4, Math.round((guess.temperature / 100) * TEMPERATURE_BAR.MAX_HEIGHT)),
            color: getTemperatureBarColor(guess.temperature, isNearMax),
        }));

        return { bars, barWidth };
    }, [barGuesses, isNearMax]);

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
                            className={`text-5xl font-bold ${getTemperatureTextColor(bestTemperature)}`}
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
                            gap: `${TEMPERATURE_BAR.GAP}px`,
                            height: `${TEMPERATURE_BAR.MAX_HEIGHT}px`,
                        }}
                    >
                        {temperatureBars.bars.map((bar) => (
                            <span
                                key={bar.id}
                                className={`${bar.color}`}
                                style={{
                                    width: `${temperatureBars.barWidth}px`,
                                    height: `${bar.height}px`,
                                    minWidth: `${TEMPERATURE_BAR.MIN_WIDTH}px`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
