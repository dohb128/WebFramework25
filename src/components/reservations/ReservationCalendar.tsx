import { useMemo, useState } from "react";
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
  requester: string;
}

const mockReservations: Record<string, Reservation[]> = {
  "2024-12-20": [
    {
      id: "1",
      title: "Swimming practice",
      facility: "Pool A",
      time: "09:00-11:00",
      status: "confirmed",
      requester: "Kim Seungho",
    },
    {
      id: "2",
      title: "Coaching meeting",
      facility: "Conference Room 1",
      time: "14:00-15:00",
      status: "pending",
      requester: "Coach Park",
    },
  ],
  "2024-12-21": [
    {
      id: "3",
      title: "Track training",
      facility: "Outdoor track",
      time: "06:00-08:00",
      status: "confirmed",
      requester: "Choi Sunwoo",
    },
  ],
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusBadge: Record<Reservation["status"], string> = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

export function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 20));
  const [selectedDate, setSelectedDate] = useState("2024-12-20");

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingEmpty = firstDay.getDay();
    const total = lastDay.getDate();

    const entries: (number | null)[] = [];
    for (let i = 0; i < leadingEmpty; i += 1) {
      entries.push(null);
    }
    for (let day = 1; day <= total; day += 1) {
      entries.push(day);
    }
    return entries;
  }, [currentDate]);

  const selectedReservations = mockReservations[selectedDate] ?? [];

  const changeMonth = (offset: number) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const formatDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Reservation calendar</h2>
          <p className="text-sm text-muted-foreground">
            Select a date to review reservations and status.
          </p>
        </div>
        <Button type="button">
          <Plus className="mr-2 h-4 w-4" />
          Create reservation
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {currentDate.getFullYear()} {monthNames[currentDate.getMonth()]}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
              {weekdayNames.map((name) => (
                <div key={name} className="p-2">
                  {name}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-20" />;
                }

                const dateKey = formatDate(day);
                const hasReservation = Boolean(mockReservations[dateKey]);
                const selected = selectedDate === dateKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={`h-20 rounded-md border p-2 text-left transition hover:bg-accent ${
                      selected ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    <div className="font-semibold">{day}</div>
                    {hasReservation && <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedDate} reservations</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReservations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No reservations for the selected date.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedReservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-md border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{reservation.title}</span>
                      <Badge className={statusBadge[reservation.status]}>{reservation.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>{reservation.facility}</div>
                      <div>{reservation.time}</div>
                      <div>{reservation.requester}</div>
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
