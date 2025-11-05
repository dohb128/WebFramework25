import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Calendar, TrendingUp, Car, Users } from "lucide-react";
import { supabase } from "../../utils/supabase/client";

export function StatsCharts() {
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [todayVehicle, setTodayVehicle] = useState(0);
  const [pendingVehicle, setPendingVehicle] = useState(0);
  const [facilityTypeData, setFacilityTypeData] = useState<{ name: string; value: number }[]>([]);
  const [vehicleDaily, setVehicleDaily] = useState<{ date: string; requests: number }[]>([]);
  const [vehicleUsage, setVehicleUsage] = useState<{ vehicle: string; usage: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const today = new Date();
      const ymd = today.toISOString().slice(0, 10);
      const start = `${ymd}T00:00:00`;
      const end = `${ymd}T23:59:59`;

      const [{ data: resToday }, { data: vehToday }, { data: vehPend }] = await Promise.all([
        supabase.from("reservations").select("reservation_id").gte("start_time", start).lte("start_time", end),
        supabase.from("reservations").select("reservation_id").eq("reservation_type", "VEHICLE").gte("start_time", start).lte("start_time", end),
        supabase.from("reservations").select("reservation_id").eq("reservation_type", "VEHICLE").eq("status", "PENDING"),
      ]);
      setTodayCount((resToday ?? []).length);
      setTodayVehicle((vehToday ?? []).length);
      setPendingVehicle((vehPend ?? []).length);

      const { data: facType } = await supabase
        .from("reservations")
        .select("reservation_type")
        .in("reservation_type", ["TRAINING", "AUXILIARY"])
        .gte("start_time", start)
        .lte("start_time", end);
      const countByType: Record<string, number> = {};
      (facType ?? []).forEach((r: any) => {
        countByType[r.reservation_type] = (countByType[r.reservation_type] ?? 0) + 1;
      });
      setFacilityTypeData([
        { name: "TRAINING", value: countByType["TRAINING"] ?? 0 },
        { name: "AUXILIARY", value: countByType["AUXILIARY"] ?? 0 },
      ]);

      const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      const sinceStr = since.toISOString().slice(0, 10);
      const { data: vehHist } = await supabase
        .from("reservations")
        .select("start_time")
        .eq("reservation_type", "VEHICLE")
        .gte("start_time", `${sinceStr}T00:00:00`);
      const bucket: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(since.getTime() + i * 86400000);
        const k = d.toISOString().slice(5, 10);
        bucket[k] = 0;
      }
      (vehHist ?? []).forEach((r: any) => {
        const k = new Date(r.start_time).toISOString().slice(5, 10);
        if (k in bucket) bucket[k] += 1;
      });
      setVehicleDaily(Object.entries(bucket).map(([date, requests]) => ({ date, requests })));

      const { data: vehUse } = await supabase
        .from("reservations")
        .select("vehicle_id")
        .eq("reservation_type", "VEHICLE")
        .not("vehicle_id", "is", null);
      const vc: Record<string, number> = {};
      (vehUse ?? []).forEach((r: any) => {
        const k = String(r.vehicle_id);
        vc[k] = (vc[k] ?? 0) + 1;
      });
      const sorted = Object.entries(vc)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([vehicle, usage]) => ({ vehicle, usage }));
      setVehicleUsage(sorted);

      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { title: "오늘 총 예약", value: String(todayCount), subtitle: "금일 시작 예약 수", icon: Calendar, color: "text-blue-600" },
    { title: "차량 배차", value: String(todayVehicle), subtitle: `대기 ${pendingVehicle}`, icon: Car, color: "text-purple-600" },
    { title: "훈련/부대시설", value: `${facilityTypeData[0]?.value ?? 0}/${facilityTypeData[1]?.value ?? 0}`, subtitle: "TRAINING/AUXILIARY", icon: TrendingUp, color: "text-green-600" },
    { title: "예상 이용객", value: "-", subtitle: "집계 지표 준비 중", icon: Users, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat) => {
          const Icon = stat.icon as any;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "…" : stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>시설 유형별 예약 (오늘)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={facilityTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#005BAC" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 7일 차량 요청</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={vehicleDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#28A745" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>차량별 이용량 (Top5)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleUsage} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="vehicle" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="usage" fill="#6C63FF" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

