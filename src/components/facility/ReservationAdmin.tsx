import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase/client";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface Reservation {
  reservation_id: number;
  facility_id: number;
  user_id: string;
  participants: number;
  start_time: string;
  end_time: string;
  status: string;
}

export function ReservationAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // 예약 목록 가져오기
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select(
            "reservation_id, facility_id, user_id, participants, start_time, end_time, status"
          )
          .eq("status", "PENDING") // 대기중 예약만 가져오기
          .order("start_time", { ascending: true });

        if (error) throw error;
        setReservations(data || []);
      } catch (err) {
        console.error("예약 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // 상태 업데이트 함수
  const updateStatus = async (id: number, status: "APPROVED" | "REJECTED") => {
    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("reservation_id", id);

    if (error) {
      alert("상태 변경 실패: " + error.message);
    } else {
      alert(`예약이 ${status === "APPROVED" ? "승인" : "거절"}되었습니다.`);
      setReservations((prev) =>
        prev.filter((r) => r.reservation_id !== id) // 리스트에서 제거
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 border rounded-md bg-white">
        대기중인 예약이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">예약 승인 관리</h1>
      <div className="space-y-2">
        {reservations.map((res) => (
          <div
            key={res.reservation_id}
            className="flex justify-between items-center border rounded-md bg-white p-4"
          >
            <div>
              <p className="font-semibold">
                시설 ID: {res.facility_id}, 인원: {res.participants}명
              </p>
              <p className="text-sm text-gray-600">
                시간: {new Date(res.start_time).toLocaleString()} ~{" "}
                {new Date(res.end_time).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">예약자 ID: {res.user_id}</p>
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-green-600 text-white"
                onClick={() => updateStatus(res.reservation_id, "APPROVED")}
              >
                승인
              </Button>
              <Button
                className="bg-red-600 text-white"
                onClick={() => updateStatus(res.reservation_id, "REJECTED")}
              >
                거절
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
