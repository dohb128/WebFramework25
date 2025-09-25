import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { 
  Calendar, 
  Home, 
  Building2, 
  ClipboardList, 
  Users, 
  BarChart3,
  Settings,
  HelpCircle
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "대시보드", icon: Home },
  { id: "reservations", label: "예약 관리", icon: Calendar },
  { id: "facilities", label: "시설 관리", icon: Building2 },
  { id: "bookings", label: "예약 현황", icon: ClipboardList },
  { id: "users", label: "사용자 관리", icon: Users },
  { id: "reports", label: "리포트", icon: BarChart3 },
  { id: "settings", label: "설정", icon: Settings },
  { id: "help", label: "도움말", icon: HelpCircle },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r h-full">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeTab === item.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}