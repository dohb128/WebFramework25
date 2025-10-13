import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface PendingBooking {
  id: string;
  facilityName: string;
  requester: string;
  requestedDate: string;
  startTime: string;
  endTime: string;
  participants: number;
  status: "pending" | "approved" | "rejected";
}

const mockPending: PendingBooking[] = [
  {
    id: "REQ-001",
    facilityName: "Main Gym",
    requester: "Lee Min",
    requestedDate: "2024-12-21",
    startTime: "10:00",
    endTime: "12:00",
    participants: 20,
    status: "pending",
  },
  {
    id: "REQ-002",
    facilityName: "Conference Room 1",
    requester: "Choi Dana",
    requestedDate: "2024-12-22",
    startTime: "14:00",
    endTime: "15:30",
    participants: 8,
    status: "approved",
  },
  {
    id: "REQ-003",
    facilityName: "Swimming Pool",
    requester: "Park Haneul",
    requestedDate: "2024-12-23",
    startTime: "07:00",
    endTime: "08:00",
    participants: 4,
    status: "rejected",
  },
];

const statusColor: Record<PendingBooking["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function ReservationAdmin() {
  const [items, setItems] = useState(mockPending);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "pending").length,
    [items]
  );

  const updateStatus = (id: string, status: PendingBooking["status"]) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reservation approvals</h2>
        <Badge variant="secondary">Pending: {pendingCount}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
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
                <TableHead>Participants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.facilityName}</TableCell>
                  <TableCell>{item.requester}</TableCell>
                  <TableCell>{item.requestedDate}</TableCell>
                  <TableCell>
                    {item.startTime} - {item.endTime}
                  </TableCell>
                  <TableCell>{item.participants}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[item.status]}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.status === "approved"}
                      onClick={() => updateStatus(item.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.status === "rejected"}
                      onClick={() => updateStatus(item.id, "rejected")}
                    >
                      Reject
                    </Button>
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
