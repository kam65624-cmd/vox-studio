import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const baseClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "secondary"
      ? "btn-secondary"
      : "btn-ghost";

  const sizeClass = size === "sm" ? "px-2.5 py-1 text-xs" : size === "lg" ? "px-5 py-2.5 text-base" : "";

  return (
    <button className={`${baseClass} ${sizeClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "surface-2" | "glass";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "surface",
  className = "",
  ...props
}) => {
  const variantClass =
    variant === "surface-2"
      ? "vox-surface-2"
      : variant === "glass"
      ? "vox-glass"
      : "vox-surface";

  return (
    <div className={`${variantClass} rounded-lg p-4 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: "draft" | "generating" | "mentor" | "ready" | "exported";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  status = "draft",
  className = "",
  ...props
}) => {
  const statusClass =
    status === "generating"
      ? "status-generating"
      : status === "mentor"
      ? "status-mentor-review"
      : status === "ready"
      ? "status-ready"
      : status === "exported"
      ? "status-exported"
      : "status-draft";

  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${statusClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};
