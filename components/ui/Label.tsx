import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement>;

export function Label({ className = "", children, ...rest }: Props) {
  return (
    <span
      className={[
        "text-[11px] uppercase tracking-wider text-gray-500 font-semibold",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[12px] font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
    >
      {children}
      {required ? <span className="text-patch-red ml-0.5">*</span> : null}
    </label>
  );
}
