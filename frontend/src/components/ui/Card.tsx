import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "solid" | "active";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "glass",
  className = "",
  ...props
}) => {
  const baseStyle = "rounded-2xl transition-all duration-200 border";

  const variants = {
    default: "bg-slate-900/80 border-slate-800 text-slate-100",
    glass:
      "bg-slate-900/60 backdrop-blur-xl border-slate-800/80 shadow-xl shadow-slate-950/40 text-slate-100",
    solid: "bg-slate-900 border-slate-800 text-slate-100",
    active:
      "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10 text-white",
  };

  return (
    <div className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
