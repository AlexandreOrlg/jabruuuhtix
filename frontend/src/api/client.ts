const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type") && options.body) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let message = "Request failed";
        try {
            const data = await response.json();
            if (typeof data?.detail === "string") {
                message = data.detail;
            } else if (typeof data?.message === "string") {
                message = data.message;
            }
        } catch {
            // Ignore parsing errors for non-JSON responses.
        }
        throw new Error(message);
    }

    return response.json() as Promise<T>;
}
