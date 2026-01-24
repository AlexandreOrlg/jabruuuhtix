import { forwardRef } from "react";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Input as ShadcnInput } from "@/components/ui/input";

import "./styles/retro.css";

export const inputVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    font: "retro",
  },
});

export interface BitInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
  VariantProps<typeof inputVariants> {
  asChild?: boolean;
}

const Input = forwardRef<HTMLInputElement, BitInputProps>(
  ({ className, font, "aria-invalid": ariaInvalid, ...props }, ref) => {
    const isInvalid = ariaInvalid === true || ariaInvalid === "true";
    const borderClass = isInvalid
      ? "border-red-500"
      : "border-foreground dark:border-ring";

    return (
      <div
        className={cn(
          "relative border-y-6 !p-0 flex items-center",
          borderClass,
          className
        )}
      >
        <ShadcnInput
          ref={ref}
          {...props}
          aria-invalid={ariaInvalid}
          className={cn(
            "rounded-none ring-0 !w-full",
            font !== "normal" && "retro",
            className
          )}
        />

        <div
          className={cn(
            "absolute inset-0 border-x-6 -mx-1.5 pointer-events-none",
            borderClass
          )}
          aria-hidden="true"
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
