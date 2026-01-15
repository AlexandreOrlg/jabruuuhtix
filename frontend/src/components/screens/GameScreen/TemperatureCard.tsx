import { Card, CardContent } from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";
import { Guess } from "@/models/Guess";

interface TemperatureCardProps {
    bestTemperature: number;
    lastGuess: Guess | null;
}

export function TemperatureCard({ bestTemperature, lastGuess }: TemperatureCardProps) {
    const progressValue = Math.min(100, Math.max(0, bestTemperature));

    return (
        <Card className="mb-6 bg-gray-900/80 border-cyan-400">
            <CardContent className="py-4">
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Température max</div>
                    <div
                        className={`text-5xl font-bold ${Guess.getTemperatureColor(bestTemperature)}`}
                    >
                        {bestTemperature.toFixed(1)}°C
                    </div>
                    <Progress value={progressValue} className="mt-3 h-4" />
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
            </CardContent>
        </Card>
    );
}
