import logo from "@/assets/logo.png";
import { COMPANY } from "@/lib/format";

export function Logo({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <img src={logo} alt={`Logo ${COMPANY.name}`} width={size} height={size}
      className={className} style={{ height: size, width: "auto", objectFit: "contain" }} />
  );
}
