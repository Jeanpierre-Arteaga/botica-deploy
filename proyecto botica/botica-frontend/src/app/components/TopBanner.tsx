import { Phone } from "lucide-react";

export function TopBanner() {
  return (
    <div className="bg-[#FF6633] text-white py-2">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3" />
          <span>Sede Ate: 01 XXX-XXXX</span>
        </div>
        <span className="text-white/60">|</span>
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3" />
          <span>Sede Santa Anita: 01 XXX-XXXX</span>
        </div>
      </div>
    </div>
  );
}
