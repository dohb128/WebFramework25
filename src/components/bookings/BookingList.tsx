import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Eye, Filter } from "lucide-react";

interface Booking {
  id: string;
  facilityName: string;
  requester: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "pending" | "cancelled";
  purpose: string;
  participants: number;
  createdAt: string;
}

const mockBookings: Booking[] = [
  {
    id: "BK-001",
    facilityName: "Pool A",
    requester: "Kim Seungho",
    role: "Athlete",
    date: "2024-12-20",
    startTime: "09:00",
    endTime: "11:00",
    status: "confirmed",
    purpose: "Training",
    participants: 1,
    createdAt: "2024-12-18",
  },
  {
    id: "BK-002",
    facilityName: "Gym B",
    requester: "Park Dana",
    role: "Coach",
    date: "2024-12-20",
    startTime: "14:00",
    endTime: "16:00",
    status: "pending",
    purpose: "Team practice",
    participants: 15,
    createdAt: "2024-12-19",
  },
  {
    id: "BK-003",
    facilityName: "Conference Room 1",
    requester: "Lee Sora",
    role: "Admin",
    date: "2024-12-21",
    startTime: "10:00",
    endTime: "12:00",
    status: "confirmed",
    purpose: "Strategy meeting",
    participants: 8,
    createdAt: "2024-12-17",
  },
  {
    id: "BK-004",
    facilityName: "Outdoor track",
    requester: "Choi Sunwoo",
    role: "Athlete",
    date: "2024-12-22",
    startTime: "06:00",
    endTime: "08:00",
    status: "cancelled",
    purpose: "Track run",
    participants: 1,
    createdAt: "2024-12-16",
  },
];

const statusLabels: Record<Booking["status"], string> = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function BookingList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return mockBookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" ? true : booking.status === statusFilter;
      const term = search.trim().toLowerCase();
      const matchesTerm = term
        ? booking.facilityName.toLowerCase().includes(term) ||
          booking.requester.toLowerCase().includes(term) ||
          booking.id.toLowerCase().includes(term)
        : true;

      return matchesStatus && matchesTerm;
    });
  }, [statusFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Card className="sm:w-auto">
          <CardContent className="flex items-center gap-3 p-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Filter and search booking records.
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by facility, requester, or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking list</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.id}</TableCell>
                  <TableCell>{booking.facilityName}</TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.requester}</div>
                    <div className="text-xs text-muted-foreground">{booking.role}</div>
                  </TableCell>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>
                    {booking.startTime} - {booking.endTime}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusLabels[booking.status]}>{booking.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Booking detail</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div>
                            <strong>Facility:</strong> {booking.facilityName}
                          </div>
                          <div>
                            <strong>Date:</strong> {booking.date} ({booking.startTime} - {booking.endTime})
                          </div>
                          <div>
                            <strong>Requester:</strong> {booking.requester} ({booking.role})
                          </div>
                          <div>
                            <strong>Purpose:</strong> {booking.purpose}
                          </div>
                          <div>
                            <strong>Participants:</strong> {booking.participants}
                          </div>
                          <div>
                            <strong>Created:</strong> {booking.createdAt}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
