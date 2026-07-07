import { useAuth } from "@/hooks/useAuth";
import { LogOut, Bell, Menu } from "lucide-react";
import type { User } from "@/types";

interface HeaderProps { user: User | null; isMobile?: boolean; onMenuToggle?: () => void; }

export function Header({ user, isMobile, onMenuToggle }: HeaderProps) {
  const { logout } = useAuth();
  return (
    <header className="h-14 md:h-16 border-b bg-card flex items-center justify-between px-3 md:px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && onMenuToggle && <button onClick={onMenuToggle} className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors shrink-0"><Menu className="h-5 w-5" /></button>}
        <h1 className="text-base md:text-lg font-semibold truncate">{isMobile ? "CPJ Workflow" : user?.role === "admin" ? "管理工作台" : "我的工作台"}</h1>
      </div>
      <div className="flex items-center gap-1 md:gap-3 shrink-0">
        <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Bell className="h-5 w-5" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" /></button>
        <button onClick={logout} className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><LogOut className="h-4 w-4" />{!isMobile && <span>退出</span>}</button>
      </div>
    </header>
  );
}
