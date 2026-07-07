import { Link, useLocation } from "react-router";
import { LayoutDashboard, FolderKanban, ListTodo, Users, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { User } from "@/types";

const navItems = [
  { path: "/", label: "工作台", icon: LayoutDashboard },
  { path: "/workflows", label: "工作流", icon: FolderKanban },
  { path: "/tasks", label: "任务管理", icon: ListTodo },
  { path: "/my-tasks", label: "我的任务", icon: Users },
  { path: "/settings", label: "Kimi 连接", icon: Settings },
];

interface SidebarProps { user: User | null; onNavigate?: () => void; }

export function Sidebar({ user, onNavigate }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`flex flex-col border-r bg-card transition-all duration-300 h-full ${collapsed ? "w-16" : "w-64"}`}>
      <div className="flex items-center h-16 px-4 border-b">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0"><span className="text-primary-foreground font-bold text-sm">C</span></div>
        {!collapsed && <span className="ml-3 font-semibold text-lg truncate">CPJ Workflow</span>}
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return <Link key={item.path} to={item.path} onClick={onNavigate} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`} title={collapsed ? item.label : undefined}><Icon className="h-5 w-5 shrink-0" />{!collapsed && <span>{item.label}</span>}</Link>;
        })}
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-primary text-sm font-medium">{user?.name?.charAt(0) || "?"}</span></div>
          {!collapsed && <div className="min-w-0"><p className="text-sm font-medium truncate">{user?.name || "用户"}</p><p className="text-xs text-muted-foreground truncate">{user?.role === "admin" ? "管理员" : "员工"}</p></div>}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="mt-2 flex items-center justify-center w-full py-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title={collapsed ? "展开" : "收起"}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <div className="flex items-center gap-1.5 text-xs"><ChevronLeft className="h-3.5 w-3.5" /><span>收起侧边栏</span></div>}</button>
      </div>
    </aside>
  );
}
