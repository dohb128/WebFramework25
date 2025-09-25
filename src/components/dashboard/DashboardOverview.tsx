import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Calendar, Building2, Users, AlertCircle } from "lucide-react";

const stats = [
  {
    title: "오늘 예약",
    value: "24",
    icon: Calendar,
    color: "text-blue-600",
    description: "오늘 총 예약 건수"
  },
  {
    title: "사용 가능 시설",
    value: "18",
    icon: Building2,
    color: "text-green-600",
    description: "현재 예약 가능한 시설"
  },
  {
    title: "등록된 사용자",
    value: "156",
    icon: Users,
    color: "text-purple-600",
    description: "시스템 등록 사용자"
  },
  {
    title: "대기 중 예약",
    value: "7",
    icon: AlertCircle,
    color: "text-orange-600",
    description: "승인 대기 중"
  }
];

const recentBookings = [
  {
    id: 1,
    facility: "수영장 A",
    user: "김선수",
    time: "09:00 - 11:00",
    status: "confirmed",
    date: "2024-12-20"
  },
  {
    id: 2,
    facility: "체육관 B",
    user: "이코치",
    time: "14:00 - 16:00",
    status: "pending",
    date: "2024-12-20"
  },
  {
    id: 3,
    facility: "회의실 1",
    user: "박관리자",
    time: "10:00 - 12:00",
    status: "confirmed",
    date: "2024-12-20"
  },
  {
    id: 4,
    facility: "트랙 필드",
    user: "최선수",
    time: "06:00 - 08:00",
    status: "confirmed",
    date: "2024-12-21"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">확정</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">대기</Badge>;
    case "cancelled":
      return <Badge variant="secondary" className="bg-red-100 text-red-800">취소</Badge>;
    default:
      return <Badge variant="secondary">알 수 없음</Badge>;
  }
};

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h2>대시보드</h2>
        <p className="text-muted-foreground">예약 시스템 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>최근 예약 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{booking.facility}</span>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {booking.user} • {booking.date} • {booking.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}