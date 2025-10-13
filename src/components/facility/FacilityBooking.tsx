import { useState } from "react";
import type { Facility } from "./FacilityReservation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
  const [endTime, setEndTime] = useState("");
  const [participants, setParticipants] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user) {
      setSubmitError("You must be signed in to create a reservation.");
      return;
    }

    if (!date || !startTime || !endTime) {
      setSubmitError("Date and time are required.");
      return;
    }

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setSubmitError("Invalid date or time format.");
      return;
    }

    if (start >= end) {
      setSubmitError("End time must be after start time.");
      return;
    }

    const participantCount = Number(participants);

    if (!Number.isFinite(participantCount) || participantCount < 1) {
      setSubmitError("Participants must be at least 1.");
      return;
    }

    if (participantCount > facility.capacity) {
      setSubmitError(`Participants cannot exceed facility capacity (${facility.capacity}).`);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("reservations").insert({
      reservation_type: "TRAINING",
      user_id: user.user_id,
      facility_id: facility.facility_id,
      title: notes ? notes.slice(0, 200) : `Reservation for ${facility.name}`,
      participants: participantCount,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });

    setSubmitting(false);

    if (error) {
      console.error("예약 신청을 실패하였습니다", error);
      setSubmitError("예약 신청에 실패하였습니다. 다시 시도해주세요.");
      return;
    }

    setSubmitSuccess("예약이 성공적으로 신청되었습니다. 관리자의 승인을 기다려주세요.");
    setNotes("");
    setParticipants("1");
    setStartTime("");
    setEndTime("");
    setDate("");
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        Back to facilities
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{facility.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>Code: {facility.code}</div>
          <div>Category: {facility.category}</div>
          <div>Capacity: {facility.capacity}</div>
          <div>Location: {facility.location}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create reservation</CardTitle>
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
              <div className="space-y-2">
                <Label htmlFor="startTime">시작 시간</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">종료 시간</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  required
                />
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
                {submitting ? "신청중..." : "예약 신청"}
              </Button>
              <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
