import { Card, CardContent } from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";
import { Guess } from "@/models/Guess";

interface ScoreCardProps {
    bestScore: number;
}

export function ScoreCard({ bestScore }: ScoreCardProps) {
    return (
        <Card className="mb-6 bg-gray-900/80 border-cyan-400">
            <CardContent className="py-4">
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Meilleur score</div>
                    <div className={`text-5xl font-bold ${Guess.getScoreColor(bestScore)}`}>
                        {bestScore}%
                    </div>
                    <Progress value={bestScore} className="mt-3 h-4" />
                </div>
            </CardContent>
        </Card>
    );
}
