import { Link } from "@tanstack/react-router";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className={`${dims} relative rounded-2xl gradient-primary flex items-center justify-center shadow-glass transition group-hover:scale-105`}>
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2 text-white">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${text} font-semibold tracking-tight`}>AgriVision</span>
        <span className="text-[10px] font-medium tracking-[0.2em] text-accent uppercase">AI</span>
      </div>
    </Link>
  );
}
