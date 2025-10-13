import { useAuth } from "../../contexts/useAuth";
import { ReservationAdmin } from "../facility/ReservationAdmin";

export default function FacilityManagement() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please sign in to view facility administration.
      </div>
    );
  }

  if (user.roleId !== 3) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Administrator access required.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Facility reservation management</h1>
      <ReservationAdmin />
    </div>
  );
}
