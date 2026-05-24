import { Phone } from "lucide-react";

export function TopBar() {
  return (
    <div className="bg-[#F26430] text-white">
      <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-center md:justify-end gap-6 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          <span className="font-medium">Ate: (01) 357-2468</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          <span className="font-medium">Santa Anita: (01) 362-1547</span>
        </div>
      </div>
    </div>
  );
}
