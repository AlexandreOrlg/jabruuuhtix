import { Card, CardContent } from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";
import { Guess } from "@/models/Guess";

interface TemperatureCardProps {
    bestTemperature: number;
}

export function TemperatureCard({ bestTemperature }: TemperatureCardProps) {
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
                </div>
            </CardContent>
        </Card>
    );
}
