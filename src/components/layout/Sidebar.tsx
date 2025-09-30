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
  HelpCircle,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../contexts/useAuth"; // ✅ 추가

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
  { id: "facility-management", label: "관리자 화면", icon: Settings, roleId: 3 }, // ✅ 관리자 전용
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { isAuthenticated, logout, user } = useAuth(); // ✅ user 추가

  const handleLogout = async () => {
    await logout();
    onTabChange("home"); // 로그아웃 후 홈으로 이동
  };

  return (
    <div className="w-64 h-full bg-white border-r shadow-sm">
      <nav className="p-4 space-y-2">
        {/* 기본 메뉴 (roleId 조건 적용) */}
        {menuItems
          .filter((item) => !item.roleId || item.roleId === user?.roleId) // ✅ 조건 필터링
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-100 hover:text-primary"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon
                  className={cn(
                    "mr-2 h-4 w-4",
                    isActive ? "text-primary-foreground" : "text-gray-600"
                  )}
                />
                {item.label}
              </Button>
            );
          })}

        {/* 구분선 */}
        <div className="border-t my-4" />

        {/* 로그인 상태에 따라 다른 버튼 */}
        {!isAuthenticated ? (
          <>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onTabChange("login")}
            >
              <LogIn className="mr-2 h-4 w-4" />
              로그인
            </Button>
            <Button
              variant="default"
              className="w-full justify-start"
              onClick={() => onTabChange("register")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              회원가입
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onTabChange("my-page")}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              마이페이지
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </>
        )}
      </nav>
    </div>
  );
}
