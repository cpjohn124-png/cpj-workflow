import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Header } from "./Header";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { Outlet } from "react-router";
import { Loader2 } from "lucide-react";
import { useMediaQuery } from "react-responsive";

export function AppLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  if (isLoading) return <div className="flex h-screen w-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!isAuthenticated) return <div className="flex h-screen w-screen items-center justify-center bg-background"><div className="text-center"><p className="text-muted-foreground mb-4">请先登录</p><a href="/login" className="text-primary hover:underline">前往登录</a></div></div>;

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      {!isMobile && <Sidebar user={user} />}
      {isMobile && mobileMenuOpen && <div className="fixed inset-0 z-50 flex"><div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} /><div className="relative w-64 bg-card h-full"><Sidebar user={user} onNavigate={() => setMobileMenuOpen(false)} /></div></div>}
      <div className="flex flex-col flex-1 min-w-0">
        <Header user={user} isMobile={isMobile} onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6"><Outlet /></main>
      </div>
      {isMobile && <MobileNav />}
      <AIAssistant />
    </div>
  );
}
