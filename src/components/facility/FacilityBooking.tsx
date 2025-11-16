import { useEffect, useState } from "react";
import type { Facility } from "./FacilityReservation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { supabase } from "../../utils/supabase/client";
import { useAuth } from "../../contexts/useAuth";

interface Equipment {
  equipment_id: number;
  name: string;
  description?: string | null;
  total_quantity: number;
  available_quantity: number;
}

interface SelectedEquipment {
  equipment_id: number;
  quantity: number;
}

interface FacilityBookingProps {
  facility: Facility;
  onBack: () => void;
}

export function FacilityBooking({ facility, onBack }: FacilityBookingProps) {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("11:00");
  const [participants, setParticipants] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState([540, 660]); // 9:00 ~ 11:00
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadEquipment = async () => {
      setEquipmentError(null);
      const { data, error } = await supabase
        .from("equipment")
        .select("equipment_id, name, description, total_quantity, available_quantity")
        .order("name", { ascending: true });
      if (!mounted) return;
      if (error) {
        console.error("장비 목록 조회 실패:", error);
        setEquipmentError("장비 정보를 불러오지 못했습니다.");
        setEquipment([]);
      } else {
        setEquipment((data ?? []) as Equipment[]);
      }
    };
    loadEquipment();
    return () => {
      mounted = false;
    };
  }, []);

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const handleTimeRangeChange = (value: number[]) => {
    setTimeRange(value);
    setStartTime(minutesToTime(value[0]));
    setEndTime(minutesToTime(value[1]));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user) {
      setSubmitError("예약을 하려면 로그인해야 합니다.");
      return;
    }

    if (!date || !startTime || !endTime) {
      setSubmitError("날짜와 시간을 모두 선택해주세요.");
      return;
    }

    const participantCount = Number(participants);

    if (!Number.isFinite(participantCount) || participantCount < 1) {
      setSubmitError("인원은 최소 1명 이상이어야 합니다.");
      return;
    }

    if (participantCount > facility.capacity) {
      setSubmitError(`인원은 시설 최대 수용 인원(${facility.capacity}명)을 초과할 수 없습니다.`);
      return;
    }

    setSubmitting(true);

    const startTimeStr = `${date}T${startTime}:00`;
    const endTimeStr = `${date}T${endTime}:00`;

    // 중복 예약 확인
    const { data: overlappingReservations, error: overlapError } = await supabase
      .from("reservations")
      .select("reservation_id")
      .eq("facility_id", facility.facility_id)
      .in("status", ["PENDING", "APPROVED"])
      .lt("start_time", endTimeStr)
      .gt("end_time", startTimeStr);

    if (overlapError) {
      console.error("예약 중복 확인 실패:", overlapError);
      setSubmitError("예약 중복 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
      return;
    }

    if (overlappingReservations && overlappingReservations.length > 0) {
      setSubmitError("??? ?????? ??? ?????? ???? ???? ??? ??????. ??? ????? ???????????.");
      setSubmitting(false);
      return;
    }

    for (const selection of selectedEquipment) {
      const eq = equipment.find((item) => item.equipment_id === selection.equipment_id);
      if (!eq) {
        setSubmitError("??? ?? ??? ?? ? ????.");
        setSubmitting(false);
        return;
      }
      if (selection.quantity < 1 || selection.quantity > eq.available_quantity) {
        setSubmitError(`??? ?? '${eq.name}'? ??? ?????.`);
        setSubmitting(false);
        return;
      }
    }

    const { data: reservationData, error } = await supabase
      .from("reservations")
      .insert({
        reservation_type: facility.category,
        user_id: user.user_id,
        facility_id: facility.facility_id,
        title: notes ? notes.slice(0, 200) : `${facility.name} ???? ???`,
        participants: participantCount,
        start_time: startTimeStr,
        end_time: endTimeStr,
      })
      .select("reservation_id")
      .single();

    if (error || !reservationData) {
      console.error("???? ??? ????:", error);
      setSubmitError("???? ????? ??????????. ??? ?? ??? ??????????.");
      setSubmitting(false);
      return;
    }

    if (selectedEquipment.length > 0) {
      const rows = selectedEquipment
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          reservation_id: reservationData.reservation_id,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
        }));

      if (rows.length > 0) {
        const { error: equipmentError } = await supabase.from("reservation_equipment").insert(rows);
        if (equipmentError) {
          console.error("?? ?? ??:", equipmentError);
          setSubmitError("?? ?? ? ??? ??????. ????? ??????.");
          setSubmitting(false);
          return;
        }
        setEquipment((prev) =>
          prev.map((eq) => {
            const used = rows.find((row) => row.equipment_id === eq.equipment_id);
            if (!used) return eq;
            return { ...eq, available_quantity: Math.max(eq.available_quantity - used.quantity, 0) };
          }),
        );
      }
    }

    setSubmitting(false);

    setSubmitSuccess("???? ????? ??????????. ???????? ?????? ?????????.");
    setNotes("");
    setParticipants("1");
    setStartTime("");
    setEndTime("");
    setDate("");
    setSelectedEquipment([]);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        ← 시설 목록으로 돌아가기
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{facility.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>코드: {facility.code}</div>
          <div>종류: {facility.category}</div>
          <div>수용 인원: {facility.capacity}명</div>
          <div>위치: {facility.location}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>예약 신청</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            {submitSuccess && (
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <AlertDescription>{submitSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">날짜</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participants">인원</Label>
                <Input
                  id="participants"
                  type="number"
                  min={1}
                  max={facility.capacity}
                  value={participants}
                  onChange={(event) => setParticipants(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="time-range">예약 시간</Label>
                <span className="text-sm font-medium">
                  {minutesToTime(timeRange[0])} - {minutesToTime(timeRange[1])}
                </span>
              </div>
              <Slider
                id="time-range"
                value={timeRange}
                onValueChange={handleTimeRangeChange}
                min={0}
                max={1440 - 30}
                step={30}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>??? ????</Label>
                {equipmentError && <span className="text-xs text-red-500">{equipmentError}</span>}
              </div>
              <div className="space-y-3 rounded-md border p-4">
                {equipment.length === 0 ? (
                  <p className="text-sm text-muted-foreground">??? ?????? ??? ???????.</p>
                ) : (
                  equipment.map((eq) => {
                    const quantity = selectedEquipment.find((item) => item.equipment_id === eq.equipment_id)?.quantity ?? 0;
                    return (
                      <div key={eq.equipment_id} className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>{eq.name}</span>
                          <span className="text-xs text-muted-foreground">???? ????: {eq.available_quantity}</span>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={eq.available_quantity}
                          value={quantity}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setSelectedEquipment((prev) => {
                              const existing = prev.find((item) => item.equipment_id === eq.equipment_id);
                              if (existing) {
                                if (!value) {
                                  return prev.filter((item) => item.equipment_id !== eq.equipment_id);
                                }
                                return prev.map((item) =>
                                  item.equipment_id === eq.equipment_id ? { ...item, quantity: value } : item,
                                );
                              }
                              if (value > 0) {
                                return [...prev, { equipment_id: eq.equipment_id, quantity: value }];
                              }
                              return prev;
                            });
                          }}
                          className="w-24"
                          disabled={eq.available_quantity === 0}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">상세 설명</Label>
              <Textarea
                id="notes"
                placeholder="자세한 설명이나 요청 사항이 있으면 적어주세요."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "신청 중..." : "예약 신청"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={submitting}
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
