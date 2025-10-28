import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Calendar as CalendarIcon, Car } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import { supabase } from "../../utils/supabase/client";

interface VehicleRequest {
  id: string;
  requestId: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  departure: string;
  destination: string;
  date: string;
  time: string;
  participants: number;
  status: "pending" | "approved" | "completed" | "cancelled";
  purpose: string;
  requestDate: string;
}

type DbStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

type ReservationRow = {
  reservation_id: number;
  vehicle_id: number | null;
  title: string | null;
  participants: number | null;
  start_time: string | null;
  end_time: string | null;
  status: DbStatus | null;
  user_id: string;
  org_id: number | null;
  departure?: string | null;
  destination?: string | null;
};

export function VehicleDispatch() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [purpose, setPurpose] = useState("");

  // 배차 완료된(할당된) 나의 예약 목록 (현재/미래)
  type MyAssigned = {
    dispatch_id: number;
    reservation_id: number;
    vehicle_id: number;
    driver_id: number | null;
    status: string | null;
    start_time: string;
    end_time: string;
    departure: string | null;
    destination: string | null;
    title?: string | null;
  };
  const [myAssigned, setMyAssigned] = useState<MyAssigned[]>([]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">승인됨</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">완료</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">취소</Badge>;
      default:
        return <Badge>상태 없음</Badge>;
    }
  };

  const mapStatus = (s?: DbStatus): VehicleRequest["status"] => {
    switch (s) {
      case "PENDING":
        return "pending";
      case "APPROVED":
        return "approved";
      case "COMPLETED":
        return "completed";
      case "CANCELLED":
      case "REJECTED":
        return "cancelled";
      default:
        return "pending";
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data: mine, error: errMine } = await supabase
          .from("reservations")
          .select(
            "reservation_id, vehicle_id, title, participants, start_time, end_time, status, user_id, org_id, departure, destination"
          )
          .eq("reservation_type", "VEHICLE")
          .eq("user_id", user?.user_id ?? "")
          .order("start_time", { ascending: true })
          .limit(5);

        if (errMine) throw errMine;

        const mineRows: ReservationRow[] = (mine ?? []) as ReservationRow[];
        const mineMapped: VehicleRequest[] = mineRows.map((r) => ({
          id: String(r.reservation_id),
          requestId: `#${r.reservation_id}`,
          vehicleNumber: r.vehicle_id ? String(r.vehicle_id) : "-",
          driverName: "-",
          driverPhone: "-",
          departure: r.departure ?? "-",
          destination: r.destination ?? "-",
          date: r.start_time ? new Date(r.start_time).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : "",
          time: r.start_time
            ? new Date(r.start_time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" })
            : "",
          participants: r.participants ?? 0,
          status: mapStatus(r.status ?? undefined),
          purpose: r.title ?? "-",
          requestDate: r.start_time ? new Date(r.start_time).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : "",
        }));

        if (!mounted) return;
        setRequests(mineMapped);
      } catch (e) {
        console.error("요청 데이터 가져오기 실패", e);
      }
    };
    if (user?.user_id) load();
    return () => {
      mounted = false;
    };
  }, [user?.user_id]);

  // 나의 배차 완료된 예약(현재 시각 이후) 조회
  useEffect(() => {
    let alive = true;
    const loadAssigned = async () => {
      if (!user?.user_id) return;
      try {
        const { data, error } = await supabase
          .from("dispatches")
          .select(`
            dispatch_id, reservation_id, vehicle_id, driver_id, status, created_at,
            reservations!inner ( reservation_id, user_id, start_time, end_time, departure, destination, title )
          `)
          .eq("reservations.user_id", user.user_id)
          .order("dispatch_id", { ascending: true });

        if (error) throw error;
        const now = new Date();
        const rows = (data ?? []) as any[];
        const mapped: MyAssigned[] = rows
          .map((d) => {
            const r = Array.isArray(d.reservations) ? d.reservations[0] : d.reservations;
            return r
              ? {
                  dispatch_id: d.dispatch_id,
                  reservation_id: d.reservation_id,
                  vehicle_id: d.vehicle_id,
                  driver_id: d.driver_id,
                  status: d.status ?? null,
                  start_time: r.start_time,
                  end_time: r.end_time,
                  departure: r.departure ?? null,
                  destination: r.destination ?? null,
                  title: r.title ?? null,
                }
              : null;
          })
          .filter(Boolean) as MyAssigned[];

        const futureOnly = mapped.filter((m) => new Date(m.start_time) >= now);
        const futureSorted = futureOnly.sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        if (!alive) return;
        setMyAssigned(futureSorted);
      } catch (err) {
        console.error("배차 목록 로드 실패", err);
      }
    };
    loadAssigned();
    return () => {
      alive = false;
    };
  }, [user?.user_id]);

  const cancelAssigned = async (item: MyAssigned) => {
    const ok = typeof window !== "undefined" && window.confirm("해당 배차를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
    if (!ok) return;
    try {
      const { error: e1 } = await supabase
        .from("dispatches")
        .update({ status: "CANCELLED" })
        .eq("dispatch_id", item.dispatch_id);
      if (e1) throw e1;

      // 예약도 취소 처리 (정책에 따라 PENDING 복귀로 변경 가능)
      const { error: e2 } = await supabase
        .from("reservations")
        .update({ status: "CANCELLED" })
        .eq("reservation_id", item.reservation_id);
      if (e2) {
        console.warn("예약 상태 변경 실패 (배차는 취소됨)", e2);
      }
      setMyAssigned((prev) => prev.filter((m) => m.dispatch_id !== item.dispatch_id));
    } catch (err) {
      console.error("배차 취소 실패", err);
      alert("배차 취소에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedDate || !selectedTime) return;

    const [hh, mm] = selectedTime.split(":");
    // 선택한 날짜/시간을 KST 벽시계 시각 그대로 DB(timestamp without time zone)에 저장하기 위해
    // 타임존 오프셋이 없는 문자열(YYYY-MM-DD HH:mm:ss)로 구성합니다.
    const y = selectedDate.getFullYear();
    const mon = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const pad = (n: number) => String(n).padStart(2, "0");
    const toLocalTimestampString = (dt: Date) =>
      `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;

    const startLocal = new Date(y, mon - 1, day, Number(hh || 0), Number(mm || 0), 0, 0);
    const endLocal = new Date(startLocal.getTime() + 60 * 60 * 1000);
    const startStr = toLocalTimestampString(startLocal);
    const endStr = toLocalTimestampString(endLocal);

    const title = purpose?.trim() || `차량 이용 요청: ${user.name ?? "사용자"}`;

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        reservation_type: "VEHICLE",
        user_id: user.user_id,
        org_id: null,
        vehicle_id: null,
        facility_id: null,
        title,
        participants: passengers,
        departure,
        destination,
        start_time: startStr,
        end_time: endStr,
        status: "PENDING",
      })
      .select("reservation_id, start_time")
      .single();

    if (error) {
      console.error("예약 생성 실패", error);
      return;
    }

    const newReq: VehicleRequest = {
      id: String(data?.reservation_id ?? Date.now()),
      requestId: `#${data?.reservation_id ?? "-"}`,
      vehicleNumber: "-",
      driverName: "-",
      driverPhone: "-",
      departure,
      destination,
      date: startLocal.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }),
      time: startLocal.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }),
      participants: passengers,
      status: "pending",
      purpose: title,
      requestDate: startLocal.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }),
    };
    setRequests((prev) => [newReq, ...prev].slice(0, 5));

    // 입력 초기화
    setSelectedDate(undefined);
    setSelectedTime("");
    setDeparture("");
    setDestination("");
    setPassengers(1);
    setPurpose("");
  };

  const handleCancel = async (id: string) => {
    const reservationId = Number(id);
    if (Number.isFinite(reservationId)) {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "CANCELLED" })
        .eq("reservation_id", reservationId)
        .eq("status", "PENDING");
      if (error) {
        console.error("요청 취소 실패", error);
      }
    }
    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: "cancelled" } : req)));
  };

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, "0");
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour}:${minute}`;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2>차량 운행 요청</h2>
        <p className="text-muted-foreground">차량 이용을 요청하고 상태를 확인할 수 있습니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 차량 요청 폼 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                차량 요청
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 출발/도착 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departure" className="mb-2">출발지</Label>
                    <Input id="departure" value={departure} onChange={(e) => setDeparture(e.target.value)} placeholder="출발지를 입력하세요" required />
                  </div>
                  <div>
                    <Label htmlFor="destination" className="mb-2">도착지</Label>
                    <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="도착지를 입력하세요" required />
                  </div>
                </div>

                {/* 날짜/시간 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">날짜</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? selectedDate.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : <span>날짜 선택</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="time" className="mb-2">시간</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime} required>
                      <SelectTrigger>
                        <SelectValue placeholder="시간 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 인원 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passengers" className="mb-2">탑승 인원</Label>
                    <Input id="passengers" type="number" value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} min={1} max={50} required />
                  </div>
                </div>

                {/* 목적 */}
                <div>
                  <Label htmlFor="purpose" className="mb-2">이용 목적</Label>
                  <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="이용 목적을 입력하세요" rows={3} required />
                </div>

                <Button type="submit" className="w-full">요청 제출</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 나의 최근 요청 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 차량 요청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{request.requestId}</span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>{request.date} {request.time}</div>
                    <div>{request.departure} → {request.destination}</div>
                  </div>
                  {request.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCancel(request.id)}
                    >
                      요청 취소
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 배차 완료된 요청 (현재/미래) */}
      <Card>
        <CardHeader>
          <CardTitle>배차 완료된 요청</CardTitle>
        </CardHeader>
        <CardContent>
          {myAssigned.length === 0 ? (
            <div className="text-sm text-muted-foreground">현재/미래 일정의 배차 완료된 요청이 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {myAssigned.map((it) => (
                <div key={it.dispatch_id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">예약 #{it.reservation_id}</div>
                    <Badge variant="secondary">{it.status ?? "ASSIGNED"}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>
                      {new Date(it.start_time).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} {new Date(it.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" })}
                      {" "}~{" "}
                      {new Date(it.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" })}
                    </div>
                    <div>
                      {it.departure ?? "-"} → {it.destination ?? "-"}
                    </div>
                    <div className="text-xs">차량 #{it.vehicle_id}{it.driver_id ? ` · 기사 #${it.driver_id}` : ""}</div>
                  </div>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => cancelAssigned(it)}>
                      배차 취소
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
