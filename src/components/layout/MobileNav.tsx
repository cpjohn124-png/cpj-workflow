import { Link, useLocation } from "react-router";
import { LayoutDashboard, FolderKanban, ListTodo, Users, Settings } from "lucide-react";

const navItems = [
  { path: "/", label: "工作台", icon: LayoutDashboard },
  { path: "/workflows", label: "工作流", icon: FolderKanban },
  { path: "/tasks", label: "任务", icon: ListTodo },
  { path: "/my-tasks", label: "我的", icon: Users },
  { path: "/settings", label: "连接", icon: Settings },
];

export function MobileNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-card border-t flex items-center justify-around md:hidden">
      {navItems.map(item => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}><Icon className="h-5 w-5" /><span className="text-[10px] font-medium">{item.label}</span></Link>;
      })}
    </nav>
  );
}
