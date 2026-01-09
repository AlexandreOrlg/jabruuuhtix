import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Card, CardContent } from "@/components/ui/8bit/card";

interface VictoryBannerProps {
    revealedWord: string;
}

export function VictoryBanner({ revealedWord }: VictoryBannerProps) {
    useEffect(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
        });
    }, [confetti]);

    return (
        <Card className="mb-6 bg-green-900/50 border-green-400">
            <CardContent className="py-6 text-center">
                <div className="text-2xl mb-2">🎉 VICTOIRE ! 🎉</div>
                <div className="text-3xl font-bold text-green-400 uppercase">
                    {revealedWord}
                </div>
            </CardContent>
        </Card>
    );
}
