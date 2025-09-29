import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import {
  LogIn,
  UserPlus,
  Menu,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useState } from "react";
import { useAuth } from "../../contexts/useAuth";

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: "home", label: "홈" },
  { id: "facility-reservation", label: "시설예약" },
  { id: "vehicle-dispatch", label: "차량배차" },
  { id: "dashboard", label: "대시보드" },
];

export function TopNavigation({ activeTab, onTabChange }: TopNavigationProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const handleLogin = () => {
    onTabChange("login");
    setIsSheetOpen(false);
  };

  const handleRegister = () => {
    onTabChange("register");
    setIsSheetOpen(false);
  };

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setIsSheetOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsSheetOpen(false);
    onTabChange("home");
  };

  const handleMyPage = () => {
    setIsSheetOpen(false);
    onTabChange("my-page");
  };

  return (
    <nav className="bg-white border-b w-full">
      <div className="px-6 py-4 flex items-center justify-between w-full">
        {/* 왼쪽 로고 */}
        <div className="flex-shrink-0">
          <h1 className="text-left text-lg font-bold text-primary">
            국가대표선수촌 예약관리시스템
          </h1>
        </div>

        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex space-x-1">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "text-sm px-4 py-2",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent"
                )}
                onClick={() => handleTabClick(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* 인증 상태 */}
          <div className="flex items-center space-x-2 ml-6">
            {!isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogin}
                  className="flex items-center gap-2"
                >
                  <LogIn className="text-sm h-4 w-4" />
                  로그인
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRegister}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  회원가입
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMyPage}
                  className="flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4" />
                  마이페이지
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col gap-4 p-4">
                {navigationItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleTabClick(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}

                <div className="border-t pt-4 mt-4 flex flex-col gap-2">
                  {!isAuthenticated ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleLogin}
                        className="w-full justify-start"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        로그인
                      </Button>
                      <Button
                        variant="default"
                        onClick={handleRegister}
                        className="w-full justify-start"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        회원가입
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        onClick={handleMyPage}
                        className="w-full justify-start"
                      >
                        <UserIcon className="mr-2 h-4 w-4" />
                        마이페이지
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
