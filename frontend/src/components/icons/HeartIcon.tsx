import * as React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

export function HeartIcon({ size = 24, className, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 60 60"
            height={size}
            className={`inline mx-3 ${className ?? ""}`}
            {...props}
        >
            <path fill="#fff" d="M12 18h6v6h-6v-6ZM18 6h6v6h-6V6Zm-6 0h6v6h-6V6Zm12 6h6v6h-6v-6Zm6 0h6v6h-6v-6Zm6-6h6v6h-6V6Zm6 0h6v6h-6V6Zm6 0h6v6h-6V6Zm6 6h6v6h-6v-6Zm0 6h6v6h-6v-6ZM6 6h6v6H6V6Zm-6 6h6v6H0v-6Zm0 6h6v6H0v-6Zm0 6h6v6H0v-6Zm54 0h6v6h-6v-6ZM6 30h6v6H6v-6Zm6 6h6v6h-6v-6Zm6 6h6v6h-6v-6Zm6 6h6v6h-6v-6Zm6 0h6v6h-6v-6Zm6-6h6v6h-6v-6Zm6-6h6v6h-6v-6Zm6-6h6v6h-6v-6Z" />
            <path fill="#9D0000" d="M6 12h6v6H6v-6Z" />
            <path fill="red" d="M12 12h6v6h-6v-6Zm6 0h6v6h-6v-6Z" />
            <path fill="#9D0000" d="M6 18h6v6H6v-6Z" />
            <path fill="red" d="M12 18h6v6h-6v-6Zm6 0h6v6h-6v-6Z" />
            <path fill="#9D0000" d="M6 24h6v6H6v-6Z" />
            <path fill="red" d="M12 24h6v6h-6v-6Zm6 0h6v6h-6v-6Z" />
            <path fill="#9D0000" d="M12 30h6v6h-6v-6Z" />
            <path fill="red" d="M18 30h6v6h-6v-6Z" />
            <path fill="#9D0000" d="M18 36h6v6h-6v-6Z" />
            <path fill="red" d="M24 36h6v6h-6v-6Z" />
            <path fill="#9D0000" d="M24 42h6v6h-6v-6Z" />
            <path fill="red" d="M30 42h6v6h-6v-6Zm0-6h6v6h-6v-6Zm-6-6h6v6h-6v-6Zm6 0h6v6h-6v-6Zm0-6h6v6h-6v-6Zm-6 0h6v6h-6v-6Zm0-6h6v6h-6v-6Zm6 0h6v6h-6v-6Zm6 6h6v6h-6v-6Zm6 6h6v6h-6v-6Zm-6 0h6v6h-6v-6Zm0 6h6v6h-6v-6Zm6-12h6v6h-6v-6Z" />
            <path fill="#FF5757" d="M48 24h6v6h-6v-6Z" />
            <path fill="red" d="M36 18h6v6h-6v-6Zm6 0h6v6h-6v-6Z" />
            <path fill="#FF5757" d="M48 18h6v6h-6v-6Zm0-6h6v6h-6v-6Zm-6 0h6v6h-6v-6Zm-6 0h6v6h-6v-6Z" />
        </svg>
    );
}
