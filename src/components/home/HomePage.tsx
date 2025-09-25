import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import ImageWithFallback from "../figma/ImageWithFallback";
import { Calendar, Car, Building2, TrendingUp, Users, Clock, ArrowRight } from "lucide-react";

const quickStats = [
  {
    title: "오늘 예약 현황",
    value: "24건",
    description: "시설 18건, 차량 6건",
    icon: Calendar,
    color: "text-blue-600"
  },
  {
    title: "이용 가능 시설",
    value: "18개",
    description: "전체 25개 중",
    icon: Building2,
    color: "text-green-600"
  },
  {
    title: "배차 대기",
    value: "4건",
    description: "승인 대기 중",
    icon: Car,
    color: "text-orange-600"
  },
  {
    title: "현재 이용자",
    value: "156명",
    description: "실시간 접속자",
    icon: Users,
    color: "text-purple-600"
  }
];

const recentActivities = [
  {
    id: 1,
    type: "facility",
    title: "수영장 A 예약 완료",
    user: "김선수",
    time: "5분 전",
    status: "confirmed"
  },
  {
    id: 2,
    type: "vehicle",
    title: "차량 배차 요청",
    user: "이코치",
    time: "10분 전",
    status: "pending"
  },
  {
    id: 3,
    type: "facility",
    title: "체육관 B 예약 취소",
    user: "박선수",
    time: "15분 전",
    status: "cancelled"
  },
  {
    id: 4,
    type: "vehicle",
    title: "차량 배차 승인",
    user: "최관리자",
    time: "20분 전",
    status: "approved"
  }
];

const featuredFacilities = [
  {
    id: 1,
    name: "올림픽 수영장",
    image: "olympic swimming pool",
    availability: "이용가능",
    capacity: "50명",
    popular: true
  },
  {
    id: 2,
    name: "다목적 체육관",
    image: "multipurpose gymnasium",
    availability: "이용가능",
    capacity: "200명",
    popular: false
  },
  {
    id: 3,
    name: "컨퍼런스룸",
    image: "modern conference room",
    availability: "예약중",
    capacity: "30명",
    popular: false
  }
];

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const getActivityIcon = (type: string) => {
    return type === "facility" ? Building2 : Car;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">완료</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">대기</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">취소</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800">승인</Badge>;
      default:
        return <Badge>알 수 없음</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-blue-500 text-white p-8 rounded-lg">
        <div className="max-w-4xl">
          <p className="text-xl opacity-90 mb-6">효율적인 시설 관리와 스마트한 예약 서비스를 제공합니다</p>
          <div className="flex gap-4">
            <Button
              onClick={() => onNavigate("facility-reservation")}  className="bg-white text-gray-900 font-bold hover:bg-gray-200">
              시설 예약하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={() => onNavigate("vehicle-dispatch")}className="bg-white text-gray-900 font-bold hover:bg-gray-200">
              차량 배차 신청
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Facilities */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>인기 시설</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate("facility-reservation")}
            >
              전체 보기
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredFacilities.map((facility) => (
                <div key={facility.id} className="relative">
                  <div className="h-40 bg-gray-200 rounded-lg overflow-hidden mb-3">
                    <ImageWithFallback
                      src={
                        facility.id === 1
                          ? "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?..."
                          : facility.id === 2
                          ? "https://images.unsplash.com/photo-1641352848874-c96659e03144?..."
                          : "https://images.unsplash.com/photo-1614354860054-3e14b83b899b?..."
                      }
                      alt={facility.name}
                      className="w-full h-full object-cover"
                      fallback="/placeholder.png"   // ✅ fallback 추가
                    />
                  </div>
                  {facility.popular && (
                    <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground">
                      인기
                    </Badge>
                  )}
                  <h4 className="font-medium mb-1">{facility.name}</h4>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{facility.capacity}</span>
                    <Badge 
                      variant={facility.availability === "이용가능" ? "secondary" : "outline"}
                      className={facility.availability === "이용가능" ? "bg-green-100 text-green-800" : ""}
                    >
                      {facility.availability}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>최근 활동</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate("dashboard")}
            >
              더보기
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate("facility-reservation")}
            >
              <Building2 className="h-6 w-6" />
              <span>시설 예약</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate("vehicle-dispatch")}
            >
              <Car className="h-6 w-6" />
              <span>차량 배차</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate("dashboard")}
            >
              <TrendingUp className="h-6 w-6" />
              <span>통계 보기</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
            >
              <Clock className="h-6 w-6" />
              <span>예약 현황</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}