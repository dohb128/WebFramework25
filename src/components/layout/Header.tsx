import { useState } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Bell, Settings, LogOut, User, Menu, X } from "lucide-react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="border-b bg-white">
      {/* Centered container with max-width; adjusts padding by breakpoint */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: brand/title */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold">국가대표선수촌 예약관리시스템</h1>
              <p className="text-sm text-muted-foreground">National Training Center Reservation System</p>
            </div>
          </div>

          {/* Middle / Right: navigation (hidden on small screens) */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm hover:text-primary">홈</a>
            <a href="#" className="text-sm hover:text-primary">시설예약</a>
            <a href="#" className="text-sm hover:text-primary">차량배차</a>
            <a href="#" className="text-sm hover:text-primary">대시보드</a>
            <a href="#" className="text-sm hover:text-primary">로그인</a>
            <a href="#" className="text-sm hover:text-primary">회원가입</a>
          </nav>

          {/* Right: icons / avatar and mobile menu button */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
                3
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="사용자" />
                    <AvatarFallback>김선수</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>프로필</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>설정</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu toggle */}
            <Button variant="ghost" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="메뉴 열기">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav (collapsible) */}
        {mobileOpen && (
          <nav className="md:hidden mt-3 space-y-2">
            <a href="#" className="block text-base px-2 py-1 rounded hover:bg-slate-100">홈</a>
            <a href="#" className="block text-base px-2 py-1 rounded hover:bg-slate-100">시설예약</a>
            <a href="#" className="block text-base px-2 py-1 rounded hover:bg-slate-100">차량배차</a>
            <a href="#" className="block text-base px-2 py-1 rounded hover:bg-slate-100">대시보드</a>
            <a href="#" className="block text-base px-2 py-1 rounded hover:bg-slate-100">로그인</a>
            <a href="#" className="block text-base px-2 py-1 rounded hover:bg-slate-100">회원가입</a>
          </nav>
        )}
      </div>
    </header>
  );
}