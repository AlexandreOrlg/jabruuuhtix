from typing import Sequence, Union


def parse_pgvector(value: Union[str, Sequence[float]]) -> list[float]:
    if isinstance(value, str):
        cleaned = value.strip("[]() ")
        if not cleaned:
            return []
        return [float(x) for x in cleaned.split(",") if x]
    return [float(x) for x in value]
