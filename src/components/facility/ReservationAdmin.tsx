import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { supabase } from "../../utils/supabase/client";

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
          .order("reservation_id", { ascending: false }); // ✅ id 내림차순 정렬

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

  const updateStatus = async (id: number, status: PendingBooking["status"]) => {
    const originalItems = [...items];
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));

    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("reservation_id", id);

    if (error) {
      console.error("상태 변경 실패:", error);
      setItems(originalItems);
      alert("상태 변경에 실패했습니다. 다시 시도해 주세요.");
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
        <Badge variant="secondary">대기 중: {pendingCount}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시설 예약 요청 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>예약 ID</TableHead>
                <TableHead>시설명</TableHead>
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
                      {item.status === "PENDING"
                        ? "대기중"
                        : item.status === "APPROVED"
                        ? "승인됨"
                        : "거절됨"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.status === "APPROVED"}
                      onClick={() => updateStatus(item.id, "APPROVED")}
                    >
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.status === "REJECTED"}
                      onClick={() => updateStatus(item.id, "REJECTED")}
                    >
                      거절
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
