// src/components/facility/FacilityBooking.tsx
import type { Facility } from "./FacilityReservation";
import { Button } from "../ui/button";

interface FacilityBookingProps {
  facility: Facility;
  onBack: () => void;
}

export function FacilityBooking({ facility, onBack }: FacilityBookingProps) {
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        ← 뒤로가기
      </Button>

      <h1 className="text-2xl font-bold">{facility.name} 예약하기</h1>
      <div className="rounded-md border bg-white p-4 space-y-2">
        <p>코드: {facility.code}</p>
        <p>종류: {facility.category}</p>
        <p>수용 인원: {facility.capacity}명</p>
        <p>위치: {facility.location}</p>
      </div>
    </div>
  );
}
