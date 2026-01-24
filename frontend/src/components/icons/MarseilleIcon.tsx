import * as React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

export function MarseilleIcon({ size = 24, className, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 78 78"
            height={size}
            className={`inline mx-3 ${className ?? ""}`}
            {...props}
        >
            <g clipPath=" url(#a)">
                <path fill="#FFC41D" d="M46 20.5c-4.833.667-14.8 1.6-16 0V24l-7.5 6.5L22 46l10 11 14-.5 9-9.5V31l-4.5-3.5-4.5-7Z" />
                <path fill="#fff" d="M24 30v-6h6v6h-6ZM30 24v-6h6v6h-6ZM36 24v-6h6v6h-6ZM42 24v-6h6v6h-6ZM48 30v-6h6v6h-6ZM60 18v-6h6v6h-6ZM18 60v6h-6v-6h6ZM18 18v-6h6v6h-6ZM60 60v6h-6v-6h6ZM66 12V6h6v6h-6ZM12 66v6H6v-6h6ZM12 12V6h6v6h-6ZM66 66v6h-6v-6h6ZM36 12V6h6v6h-6ZM42 66v6h-6v-6h6ZM66 36h6v6h-6v-6ZM12 42H6v-6h6v6ZM0 36h6v6H0v-6ZM78 42h-6v-6h6v6ZM36 6V0h6v6h-6ZM42 72v6h-6v-6h6ZM54 36v-6h6v6h-6ZM54 42v-6h6v6h-6v-6ZM54 48v-6h6v6h-6ZM48 54v-6h6v6h-6ZM42 60v-6h6v6h-6ZM36 60v-6h6v6h-6ZM30 60v-6h6v6h-6ZM24 54v-6h6v6h-6ZM18 48v-6h6v6h-6ZM18 42v-6h6v6h-6v-6ZM18 36v-6h6v6h-6v-6Z" />
            </g>
            <defs>
                <clipPath id="a">
                    <path fill="#fff" d="M0 0h78v78H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}
