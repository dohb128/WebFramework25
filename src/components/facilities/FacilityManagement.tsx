import { useAuth } from "../../contexts/useAuth"; // ✅ AuthContext에서 user 가져오기
import { ReservationAdmin } from "../facility/ReservationAdmin"; // ✅ 방금 만든 승인 관리 컴포넌트

export default function FacilityManagement() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 text-center text-gray-500">
        로그인 후 접근 가능합니다.
      </div>
    );
  }

  if (user.roleId !== 3) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        관리자 권한이 필요합니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">시설 예약 관리 (관리자 전용)</h1>
      {/* ✅ 예약 승인 관리 UI */}
      <ReservationAdmin />

      {/* 필요하다면 여기 아래에 시설 CRUD(추가/수정/삭제) 기능도 붙일 수 있음 */}
    </div>
  );
}
