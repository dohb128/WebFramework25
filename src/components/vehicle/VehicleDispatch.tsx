import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
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
  const [assigned, setAssigned] = useState<VehicleRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [purpose, setPurpose] = useState("");

  // 상태 표시 뱃지
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">승인됨</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">완료</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">취소됨</Badge>;
      default:
        return <Badge>알 수 없음</Badge>;
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
        return "cancelled";
      default:
        return "pending";
    }
  };

  // 내 예약 / 전체 배차 조회
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // 내 최근 차량 예약
        const { data: mine, error: errMine } = await supabase
          .from("reservations")
          .select(
            "reservation_id, vehicle_id, title, participants, start_time, end_time, status, user_id, org_id, departure, destination"
          )
          .eq("reservation_type", "VEHICLE")
          .eq("user_id", user?.user_id ?? "")
          .order("created_at", { ascending: false })
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
          date: r.start_time ? new Date(r.start_time).toLocaleDateString("ko-KR") : "",
          time: r.start_time
            ? new Date(r.start_time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
            : "",
          participants: r.participants ?? 0,
          status: mapStatus(r.status ?? undefined),
          purpose: r.title ?? "-",
          requestDate: r.start_time ? new Date(r.start_time).toLocaleDateString("ko-KR") : "",
        }));

        // 관리자용 전체 배차 목록
        const { data: allAssigned, error: errAssigned } = await supabase
          .from("reservations")
          .select(
            "reservation_id, vehicle_id, title, participants, start_time, end_time, status, user_id, org_id, departure, destination"
          )
          .eq("reservation_type", "VEHICLE")
          .order("start_time", { ascending: false });

        if (errAssigned) throw errAssigned;

        const assignedRows: ReservationRow[] = (allAssigned ?? []) as ReservationRow[];
        const assignedMapped: VehicleRequest[] = assignedRows.map((r) => ({
          id: String(r.reservation_id),
          requestId: `#${r.reservation_id}`,
          vehicleNumber: r.vehicle_id ? String(r.vehicle_id) : "-",
          driverName: "-",
          driverPhone: "-",
          departure: r.departure ?? "-",
          destination: r.destination ?? "-",
          date: r.start_time ? new Date(r.start_time).toLocaleDateString("ko-KR") : "",
          time: r.start_time
            ? new Date(r.start_time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
            : "",
          participants: r.participants ?? 0,
          status: mapStatus(r.status ?? undefined),
          purpose: r.title ?? "-",
          requestDate: r.start_time ? new Date(r.start_time).toLocaleDateString("ko-KR") : "",
        }));

        if (!mounted) return;
        setRequests(mineMapped);
        setAssigned(assignedMapped);
      } catch (e) {
        console.error("차량 예약 불러오기 실패", e);
      }
    };
    if (user?.user_id) load();
    return () => {
      mounted = false;
    };
  }, [user?.user_id]);

  // 🚗 차량 배차 요청 저장 (한국 시간 기준)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedDate || !selectedTime) return;

    const [hh, mm] = selectedTime.split(":");
    const start = new Date(selectedDate);
    start.setHours(Number(hh || 0), Number(mm || 0), 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    // ✅ 한국 시간(KST) 그대로 DB에 저장
    start.setHours(start.getHours() - 9);
    end.setHours(end.getHours() - 9);

    const title = purpose?.trim() || `차량 배차 요청자: ${user.name ?? "사용자"}`;

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
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "PENDING",
      })
      .select("reservation_id, start_time")
      .single();

    if (error) {
      console.error("차량 예약 생성 실패", error);
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
      date: start.toLocaleDateString("ko-KR"),
      time: start.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      participants: passengers,
      status: "pending",
      purpose: title,
      requestDate: start.toLocaleDateString("ko-KR"),
    };
    setRequests((prev) => [newReq, ...prev].slice(0, 5));

    // 폼 초기화
    setSelectedDate(undefined);
    setSelectedTime("");
    setDeparture("");
    setDestination("");
    setPassengers(1);
    setPurpose("");
  };

  const handleCancel = async (id: string) => {
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
        <h2>차량 배차 예약</h2>
        <p className="text-muted-foreground">차량 배차 요청을 생성하고 상태를 확인할 수 있습니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 🚗 배차 요청 폼 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                배차 요청
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 출발지/도착지 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departure" className="mb-2">출발지</Label>
                    <Input
                      id="departure"
                      value={departure}
                      onChange={(e) => setDeparture(e.target.value)}
                      placeholder="출발지를 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination" className="mb-2">도착지</Label>
                    <Input
                      id="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="도착지를 입력하세요"
                      required
                    />
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
                          {selectedDate ? selectedDate.toLocaleDateString("ko-KR") : <span>날짜 선택</span>}
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
                    <Input
                      id="passengers"
                      type="number"
                      value={passengers}
                      onChange={(e) => setPassengers(Number(e.target.value))}
                      min={1}
                      max={50}
                      required
                    />
                  </div>
                </div>

                {/* 목적 */}
                <div>
                  <Label htmlFor="purpose" className="mb-2">이용 목적</Label>
                  <Textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="배차 목적을 입력하세요"
                    rows={3}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  요청 등록
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 내 최근 요청 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 배차 요청</CardTitle>
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

      {/* 관리자 전용 전체 배차 내역 */}
      {user?.roleId === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>전체 배차 내역 (관리자 전용)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>차량</TableHead>
                  <TableHead>기사</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>출발지</TableHead>
                  <TableHead>도착지</TableHead>
                  <TableHead>날짜 / 시간</TableHead>
                  <TableHead>탑승 인원</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assigned.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.requestId}</TableCell>
                    <TableCell>{request.vehicleNumber}</TableCell>
                    <TableCell>{request.driverName}</TableCell>
                    <TableCell>{request.driverPhone}</TableCell>
                    <TableCell>{request.departure}</TableCell>
                    <TableCell>{request.destination}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{request.date}</div>
                        <div className="text-muted-foreground">{request.time}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.participants}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(request.id)}
                        >
                          취소
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
