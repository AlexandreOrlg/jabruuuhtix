import { Badge } from "@/components/ui/8bit/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/8bit/table";
import type { Guess } from "@/models/Guess";

interface GuessesTableProps {
    guesses: Guess[];
    playerId: string;
}

export function GuessesTable({ guesses, playerId }: GuessesTableProps) {
    if (guesses.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                Aucune proposition pour l'instant...
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Proposition</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {guesses.map((guess) => (
                    <TableRow
                        key={guess.id}
                        className={guess.belongsTo(playerId) ? "bg-primary/10" : ""}
                    >
                        <TableCell className="font-medium">{guess.word}</TableCell>
                        <TableCell>{guess.playerName}</TableCell>
                        <TableCell className="text-right">
                            <Badge variant="secondary" className={guess.scoreColor}>
                                {guess.formattedScore}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
