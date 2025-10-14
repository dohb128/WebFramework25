import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Eye, Filter } from "lucide-react";
import { supabase } from "../../utils/supabase/client";

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

const statusLabels: Record<Booking["status"], string> = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

type DbStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

const toUiStatus = (s?: DbStatus | null): Booking["status"] => {
  switch (s) {
    case "APPROVED":
    case "COMPLETED":
      return "confirmed";
    case "CANCELLED":
      return "cancelled";
    case "PENDING":
    default:
      return "pending";
  }
};

export default function BookingList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Booking[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select("reservation_id, facility_id, title, participants, start_time, end_time, status, created_at")
          .eq("reservation_type", "TRAINING")
          .order("start_time", { ascending: false });
        if (error) throw error;
        type ReservationRow = {
          reservation_id: number;
          facility_id: number | null;
          title: string | null;
          participants: number | null;
          start_time: string | null;
          end_time: string | null;
          status: DbStatus | null;
          created_at: string | null;
        };

        const rows: ReservationRow[] = (data ?? []) as ReservationRow[];

        const ids = Array.from(
          new Set(
            rows
              .map((r) => r.facility_id)
              .filter((v): v is number => typeof v === "number")
          )
        );

        const nameMap = new Map<number, string>();
        if (ids.length) {
          const { data: facs } = await supabase
            .from("facilities")
            .select("facility_id, name")
            .in("facility_id", ids);
          type FacilityRow = { facility_id: number; name: string | null };
          const facRows: FacilityRow[] = (facs ?? []) as FacilityRow[];
          facRows.forEach((f) => nameMap.set(f.facility_id, f.name ?? `Facility #${f.facility_id}`));
        }

        const mapped: Booking[] = rows.map((r) => ({
          id: `BK-${r.reservation_id}`,
          facilityName: nameMap.get(r.facility_id ?? -1) || `Facility #${r.facility_id}`,
          requester: "-",
          role: "-",
          date: r.start_time ? new Date(r.start_time).toLocaleDateString("ko-KR") : "",
          startTime: r.start_time
            ? new Date(r.start_time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
            : "",
          endTime: r.end_time
            ? new Date(r.end_time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
            : "",
          status: toUiStatus(r.status ?? undefined),
          purpose: r.title ?? "-",
          participants: r.participants ?? 0,
          createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("ko-KR") : "",
        }));
        if (mounted) setItems(mapped);
      } catch (e) {
        console.error("Failed to load facility reservations", e);
        if (mounted) setItems([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((booking) => {
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
  }, [statusFilter, search, items]);

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
