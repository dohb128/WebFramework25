import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { supabase } from "../../utils/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

interface ReservationRow {
  reservation_id: number;
  facility_id: number | null;
  start_time: string;
  end_time: string;
  participants: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  users: { name: string } | { name: string }[] | null;
  facilities: { name: string } | { name: string }[] | null;
}

interface PendingBooking {
  id: number;
  facilityName: string;
  requester: string;
  requestedDate: string;
  startTime: string;
  endTime: string;
  participants: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const statusColor: Record<PendingBooking["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function ReservationAdmin() {
  const [items, setItems] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [actionTarget, setActionTarget] = useState<{ id: number; action: "APPROVED" | "REJECTED" } | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select(`
            reservation_id,
            facility_id,
            start_time,
            end_time,
            participants,
            status,
            users ( name ),
            facilities ( name )
          `)
          .eq("reservation_type", "TRAINING")
          .order("reservation_id", { ascending: false });

        if (error) throw error;
        if (!data) {
          setItems([]);
          return;
        }

        const rows = data as unknown as ReservationRow[];

        const mapped: PendingBooking[] = rows.map((item) => {
          let requester = "이름 없음";
          if (Array.isArray(item.users)) {
            requester = item.users[0]?.name ?? "이름 없음";
          } else if (item.users && typeof item.users === "object") {
            requester = item.users.name ?? "이름 없음";
          }

          let facilityName = "시설 정보 없음";
          if (Array.isArray(item.facilities)) {
            facilityName = item.facilities[0]?.name ?? "시설 정보 없음";
          } else if (item.facilities && typeof item.facilities === "object") {
            facilityName = item.facilities.name ?? "시설 정보 없음";
          }

          return {
            id: item.reservation_id,
            facilityName,
            requester,
            requestedDate: new Date(item.start_time).toLocaleDateString("ko-KR"),
            startTime: new Date(item.start_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            endTime: new Date(item.end_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            participants: item.participants,
            status: item.status,
          };
        });

        setItems(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "PENDING").length,
    [items]
  );

  const updateStatus = async (id: number, status: PendingBooking["status"], adminReason?: string) => {
    const originalItems = [...items];
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));

    const payload: any = { status };
    if (adminReason && adminReason.trim()) payload.admin_reason = adminReason.trim();

    const { error } = await supabase
      .from("reservations")
      .update(payload)
      .eq("reservation_id", id);

    if (error) {
      console.error("상태/사유 저장 실패:", error);
      setItems(originalItems);
      alert("상태 변경에 실패했습니다. (사유 저장 컬럼이 없을 수 있습니다)");
    }
  };

  if (loading) {
    return <div>예약 데이터를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="text-red-600">오류 발생: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">시설 예약 승인 관리</h2>
        <Badge variant="secondary">대기 {pendingCount}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시설 예약 신청 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>예약 ID</TableHead>
                <TableHead>시설</TableHead>
                <TableHead>신청자</TableHead>
                <TableHead>예약 날짜</TableHead>
                <TableHead>시간</TableHead>
                <TableHead>인원</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
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
                    {item.startTime} ~ {item.endTime}
                  </TableCell>
                  <TableCell>{item.participants}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[item.status]}>
                      {item.status === "PENDING" ? "대기중" : item.status === "APPROVED" ? "승인" : "거절"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={item.status === "APPROVED"}
                          onClick={() => {
                            setActionTarget({ id: item.id, action: "APPROVED" });
                            setReason("");
                          }}
                        >
                          승인
                        </Button>
                      </DialogTrigger>
                      {actionTarget?.id === item.id && actionTarget.action === "APPROVED" && (
                        <DialogContent className="bg-white">
                          <DialogHeader>
                            <DialogTitle>승인 사유 (선택)</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Label className="mb-1">사유</Label>
                            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="선택 입력" />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setActionTarget(null)}>
                              취소
                            </Button>
                            <Button
                              onClick={async () => {
                                await updateStatus(item.id, "APPROVED", reason);
                                setActionTarget(null);
                              }}
                            >
                              저장
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={item.status === "REJECTED"}
                          onClick={() => {
                            setActionTarget({ id: item.id, action: "REJECTED" });
                            setReason("");
                          }}
                        >
                          거절
                        </Button>
                      </DialogTrigger>
                      {actionTarget?.id === item.id && actionTarget.action === "REJECTED" && (
                        <DialogContent className="bg-white">
                          <DialogHeader>
                            <DialogTitle>반려 사유</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Label className="mb-1">사유</Label>
                            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="반려 사유를 입력" />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setActionTarget(null)}>
                              취소
                            </Button>
                            <Button
                              onClick={async () => {
                                if (!reason.trim()) {
                                  alert("반려 사유를 입력하세요");
                                  return;
                                }
                                await updateStatus(item.id, "REJECTED", reason);
                                setActionTarget(null);
                              }}
                            >
                              저장
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
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

