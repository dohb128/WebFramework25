import { useState } from "react";
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
import { Calendar as CalendarIcon, Clock, Upload, Car, User, Phone, FileText } from "lucide-react";
// import { format } from "date-fns";
// import { ko } from "date-fns/locale";

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
  passengers: number;
  status: "pending" | "approved" | "completed" | "cancelled";
  purpose: string;
  requestDate: string;
}

const mockRequests: VehicleRequest[] = [
  {
    id: "1",
    requestId: "#202509-1",
    vehicleNumber: "12가3456",
    driverName: "홍길동",
    driverPhone: "010-1234-5678",
    departure: "국가대표선수촌",
    destination: "올림픽공원",
    date: "2024-12-20",
    time: "09:00",
    passengers: 15,
    status: "pending",
    purpose: "훈련 이동",
    requestDate: "2024-12-18"
  },
  {
    id: "2",
    requestId: "#202509-2",
    vehicleNumber: "45나6789",
    driverName: "김철수",
    driverPhone: "010-9876-5432",
    departure: "국가대표선수촌",
    destination: "잠실종합운동장",
    date: "2024-12-21",
    time: "14:00",
    passengers: 8,
    status: "approved",
    purpose: "경기 참가",
    requestDate: "2024-12-17"
  },
  {
    id: "3",
    requestId: "#202509-3",
    vehicleNumber: "78다0123",
    driverName: "박영희",
    driverPhone: "010-1111-2222",
    departure: "선수촌 의무실",
    destination: "서울대병원",
    date: "2024-12-19",
    time: "10:30",
    passengers: 2,
    status: "completed",
    purpose: "의료진료",
    requestDate: "2024-12-16"
  }
];

export function VehicleDispatch() {
  const [requests, setRequests] = useState<VehicleRequest[]>(mockRequests);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">승인대기</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">승인완료</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">이용완료</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">취소</Badge>;
      default:
        return <Badge>알 수 없음</Badge>;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: VehicleRequest = {
      id: String(requests.length + 1),
      requestId: `#202509-${requests.length + 1}`,
      vehicleNumber: "배차 대기",
      driverName: "배정 예정",
      driverPhone: "-",
      departure,
      destination,
      date: selectedDate ? selectedDate.toLocaleDateString('ko-KR') : "",
      time: selectedTime,
      passengers,
      status: "pending",
      purpose,
      requestDate: new Date().toLocaleDateString('ko-KR')
    };
    
    setRequests([newRequest, ...requests]);
    
    // Reset form
    setSelectedDate(undefined);
    setSelectedTime("");
    setDeparture("");
    setDestination("");
    setPassengers(1);
    setPurpose("");
    setAttachedFile(null);
  };

  const handleCancel = (id: string) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: "cancelled" as const } : req
    ));
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2>차량 배차 예약</h2>
        <p className="text-muted-foreground">차량 배차를 요청하고 현황을 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 배차 요청 폼 */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departure">출발지</Label>
                    <Input
                      id="departure"
                      value={departure}
                      onChange={(e) => setDeparture(e.target.value)}
                      placeholder="출발지를 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">도착지</Label>
                    <Input
                      id="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="도착지를 입력하세요"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>날짜</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            selectedDate.toLocaleDateString('ko-KR')
                          ) : (
                            <span>날짜를 선택하세요</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="time">시간</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime} required>
                      <SelectTrigger>
                        <SelectValue placeholder="시간을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passengers">탑승인원</Label>
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
                  <div>
                    <Label htmlFor="file">문서첨부</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.jpg,.png"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="purpose">이용목적</Label>
                  <Textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="배차 목적을 상세히 입력하세요"
                    rows={3}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  배차 요청하기
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 내 배차 신청 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>내 배차 신청 현황</CardTitle>
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
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {request.vehicleNumber}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {request.driverName}
                  </div>
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
                    취소
                  </Button>
                )}
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      </div>

      {/* 전체 배차 현황 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 배차 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>예약번호</TableHead>
              <TableHead>차량번호</TableHead>
              <TableHead>기사</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>출발지</TableHead>
              <TableHead>도착지</TableHead>
              <TableHead>일시</TableHead>
              <TableHead>인원</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
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
                <TableCell>{request.passengers}명</TableCell>
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
    </div>
  );
}