import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Reservation {
  id: string;
  title: string;
  facility: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
  user: string;
}

const mockReservations: Record<string, Reservation[]> = {
  "2024-12-20": [
    {
      id: "1",
      title: "수영 훈련",
      facility: "수영장 A",
      time: "09:00-11:00",
      status: "confirmed",
      user: "김선수"
    },
    {
      id: "2",
      title: "팀 미팅",
      facility: "회의실 1",
      time: "14:00-15:00",
      status: "pending",
      user: "이코치"
    }
  ],
  "2024-12-21": [
    {
      id: "3",
      title: "육상 훈련",
      facility: "트랙 필드",
      time: "06:00-08:00",
      status: "confirmed",
      user: "최선수"
    }
  ]
};

export function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 20)); // December 20, 2024
  const [selectedDate, setSelectedDate] = useState("2024-12-20");

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const selectedReservations = mockReservations[selectedDate] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>예약 캘린더</h2>
          <p className="text-muted-foreground">날짜를 선택하여 예약을 확인하고 관리하세요</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 예약
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={index} className="p-2 h-20"></div>;
                }
                
                const dateStr = formatDate(day);
                const hasReservations = mockReservations[dateStr];
                const isSelected = selectedDate === dateStr;
                
                return (
                  <button
                    key={day}
                    className={`p-2 h-20 border rounded-lg text-left hover:bg-accent transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground" : ""
                    }`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <div className="font-medium">{day}</div>
                    {hasReservations && (
                      <div className="mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate} 예약
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReservations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                선택한 날짜에 예약이 없습니다
              </p>
            ) : (
              <div className="space-y-4">
                {selectedReservations.map((reservation) => (
                  <div key={reservation.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{reservation.title}</span>
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status === "confirmed" ? "확정" : 
                         reservation.status === "pending" ? "대기" : "취소"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>{reservation.facility}</div>
                      <div>{reservation.time}</div>
                      <div>{reservation.user}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}