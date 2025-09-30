import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase/client";
import { Card } from "../ui/card";
import { Loader2 } from "lucide-react";

// ✅ 다른 컴포넌트에서도 쓰일 수 있도록 export
export type Facility = {
  facility_id: number;
  code: string;
  name: string;
  category: string;
  capacity: number;
  location: string;
  is_active: boolean;
  created_at?: string;
};

// ✅ props 타입 정의
interface FacilityReservationProps {
  onSelectFacility: (facility: Facility) => void;
}

const FacilityReservation = ({ onSelectFacility }: FacilityReservationProps) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("facilities")
          .select(
            "facility_id, code, name, category, capacity, location, is_active, created_at"
          )
          .order("name");

        if (error) {
          console.error("시설 불러오기 실패:", error.message);
        } else {
          setFacilities(data || []);
        }
      } catch (err) {
        console.error("알 수 없는 오류:", err);
      } finally {
        setLoading(false); // ✅ 무조건 로딩 해제
      }
    };

    fetchFacilities();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 border rounded-md bg-white">
        등록된 시설이 없습니다.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">시설 목록</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((facility) => (
          <Card
            key={facility.facility_id}
            className="p-4 hover:shadow-md transition rounded-lg border bg-white cursor-pointer"
            onClick={() => onSelectFacility(facility)} // ✅ 카드 클릭 시 전달
          >
            <h3 className="font-semibold text-lg">{facility.name}</h3>
            <p className="text-sm text-gray-600">코드: {facility.code}</p>
            <p className="text-sm text-gray-600">종류: {facility.category}</p>
            <p className="text-sm text-gray-600">
              수용 인원: {facility.capacity}명
            </p>
            <p className="text-sm text-gray-500">위치: {facility.location}</p>
            {!facility.is_active && (
              <p className="text-sm text-red-600 font-medium">[비활성화됨]</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FacilityReservation;
