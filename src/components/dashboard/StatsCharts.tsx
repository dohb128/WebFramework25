import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, Building2, Car, AlertTriangle, TrendingUp, Users, Clock } from "lucide-react";

// 종목별 시설 이용률 데이터
const sportUsageData = [
  { sport: "축구", usage: 85 },
  { sport: "농구", usage: 72 },
  { sport: "배구", usage: 68 },
  { sport: "수영", usage: 90 },
  { sport: "육상", usage: 76 },
  { sport: "테니스", usage: 63 }
];

// 시설별 예약률 데이터
const facilityReservationData = [
  { name: "훈련관", value: 45, color: "#005BAC" },
  { name: "체육관", value: 30, color: "#28A745" },
  { name: "회의실", value: 15, color: "#17A2B8" },
  { name: "숙소", value: 10, color: "#FFC107" }
];

// 일별 배차 요청 데이터
const dailyDispatchData = [
  { date: "12/15", requests: 12 },
  { date: "12/16", requests: 15 },
  { date: "12/17", requests: 18 },
  { date: "12/18", requests: 14 },
  { date: "12/19", requests: 20 },
  { date: "12/20", requests: 16 },
  { date: "12/21", requests: 22 }
];

// 차량별 이용률 데이터
const vehicleUsageData = [
  { vehicle: "대형버스", usage: 78 },
  { vehicle: "중형버스", usage: 65 },
  { vehicle: "승용차", usage: 82 },
  { vehicle: "승합차", usage: 71 },
  { vehicle: "특수차량", usage: 45 }
];

const todayStats = [
  {
    title: "오늘 총 예약",
    value: "47",
    subtitle: "훈련시설 32, 부대시설 15",
    icon: Calendar,
    color: "text-blue-600"
  },
  {
    title: "현재 가동률",
    value: "73%",
    subtitle: "전일 대비 +5%",
    icon: TrendingUp,
    color: "text-green-600"
  },
  {
    title: "차량 배차",
    value: "16",
    subtitle: "승인 12, 대기 4",
    icon: Car,
    color: "text-purple-600"
  },
  {
    title: "시설 이용자",
    value: "284",
    subtitle: "선수 198, 스태프 86",
    icon: Users,
    color: "text-orange-600"
  }
];

const alerts = [
  { id: 1, type: "warning", message: "체육관 B 에어컨 점검 필요", time: "10분 전" },
  { id: 2, type: "info", message: "새로운 배차 요청 3건", time: "15분 전" },
  { id: 3, type: "error", message: "수영장 A 예약 초과", time: "25분 전" },
  { id: 4, type: "warning", message: "회의실 1 프로젝터 고장", time: "1시간 전" }
];

export function StatsCharts() {
  return (
    <div className="space-y-6">
      {/* 실시간 예약 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {todayStats.map((stat) => {
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
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 종목별 시설 이용률 */}
        <Card>
          <CardHeader>
            <CardTitle>종목별 시설 이용률</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sportUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, "이용률"]} />
                <Bar dataKey="usage" fill="#005BAC" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 시설별 예약률 */}
        <Card>
          <CardHeader>
            <CardTitle>시설별 예약률</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={facilityReservationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {facilityReservationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "예약률"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {facilityReservationData.map((entry) => (
                <div key={entry.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm">{entry.name} {entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일별 배차 요청 건수 */}
        <Card>
          <CardHeader>
            <CardTitle>일별 배차 요청 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyDispatchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}건`, "요청 건수"]} />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#28A745" 
                  strokeWidth={3}
                  dot={{ fill: "#28A745", strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 차량별 이용률 */}
        <Card>
          <CardHeader>
            <CardTitle>차량별 이용률</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleUsageData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="vehicle" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value}%`, "이용률"]} />
                <Bar dataKey="usage" fill="#17A2B8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 경고 및 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            경고 및 알림
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.type === "error" ? "bg-red-500" :
                    alert.type === "warning" ? "bg-yellow-500" : "bg-blue-500"
                  }`}></div>
                  <span>{alert.message}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{alert.time}</span>
                  <Badge 
                    variant="secondary"
                    className={
                      alert.type === "error" ? "bg-red-100 text-red-800" :
                      alert.type === "warning" ? "bg-yellow-100 text-yellow-800" : 
                      "bg-blue-100 text-blue-800"
                    }
                  >
                    {alert.type === "error" ? "오류" :
                     alert.type === "warning" ? "경고" : "정보"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">승인 대기 건수</h4>
                <p className="text-sm text-muted-foreground">시설 예약 7건, 차량 배차 4건이 승인 대기 중입니다</p>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                11건 대기
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}