import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  padding?: "sm" | "md" | "lg";
};

const padMap = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ padding = "md", className = "", children, ...rest }: Props) {
  return (
    <div
      className={[
        "bg-white border border-gray-200 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
        padMap[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
