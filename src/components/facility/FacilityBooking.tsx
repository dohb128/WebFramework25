import { useState } from "react";
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
      setSubmitError("해당 시간대는 이미 예약되어 있거나 승인 대기 중입니다. 다른 시간을 선택해주세요.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("reservations").insert({
      reservation_type: "TRAINING",
      user_id: user.user_id,
      facility_id: facility.facility_id,
      title: notes ? notes.slice(0, 200) : `${facility.name} 예약 신청`,
      participants: participantCount,
      start_time: startTimeStr,
      end_time: endTimeStr,
    });

    setSubmitting(false);

    if (error) {
      console.error("예약 신청 실패:", error);
      setSubmitError("예약 신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setSubmitSuccess("예약 신청이 완료되었습니다. 관리자의 승인을 기다려주세요.");
    setNotes("");
    setParticipants("1");
    setStartTime("");
    setEndTime("");
    setDate("");
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
