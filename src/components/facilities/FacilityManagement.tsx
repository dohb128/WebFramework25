import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { supabase } from "../../utils/supabase/client";

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
      <h1 className="text-2xl font-bold">관리자 센터</h1>

      {/* 시설/차량/기사 등록 */}
      <AdminRegistration />

      {/* 시설 예약 승인 관리는 제거됨 */}
    </div>
  );
}

function AdminRegistration() {
  // Facilities
  const [facilityName, setFacilityName] = useState("");
  const [facilities, setFacilities] = useState<Array<{ facility_id: number; name: string }>>([]);

  // Vehicles
  const [plateNo, setPlateNo] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleCapacity, setVehicleCapacity] = useState<number | "">("");
  const [vehicles, setVehicles] = useState<Array<{ vehicle_id: number; plate_no: string; model?: string | null; capacity?: number | null; status?: string | null }>>([]);

  // Drivers
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [drivers, setDrivers] = useState<Array<{ driver_id: number; name: string; phone?: string | null; status?: string | null }>>([]);

  const loadLists = async () => {
    try {
      const [{ data: fac }, { data: veh }, { data: drv }] = await Promise.all([
        supabase.from("facilities").select("facility_id, name").order("facility_id", { ascending: true }).limit(10),
        supabase.from("vehicles").select("vehicle_id, plate_no, model, capacity, status").order("vehicle_id", { ascending: true }).limit(10),
        supabase.from("drivers").select("driver_id, name, phone, status").order("driver_id", { ascending: true }).limit(10),
      ]);
      setFacilities((fac ?? []) as any);
      setVehicles((veh ?? []) as any);
      setDrivers((drv ?? []) as any);
    } catch (e) {
      console.error("관리 목록 로드 실패", e);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const addFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = facilityName.trim();
    if (!name) return;
    const { error } = await supabase.from("facilities").insert({ name });
    if (error) {
      console.error("시설 등록 실패", error);
      alert("시설 등록에 실패했습니다.");
      return;
    }
    setFacilityName("");
    await loadLists();
  };

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const plate_no = plateNo.trim();
    if (!plate_no) return;
    const cap = vehicleCapacity === "" ? null : Number(vehicleCapacity);
    const { error } = await supabase
      .from("vehicles")
      .insert({ plate_no, model: vehicleModel || null, capacity: cap, status: "AVAILABLE" });
    if (error) {
      console.error("차량 등록 실패", error);
      alert("차량 등록에 실패했습니다.");
      return;
    }
    setPlateNo("");
    setVehicleModel("");
    setVehicleCapacity("");
    await loadLists();
  };

  const addDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = driverName.trim();
    if (!name) return;
    const phone = driverPhone.trim() || null;
    const { error } = await supabase.from("drivers").insert({ name, phone, status: "ACTIVE" });
    if (error) {
      console.error("기사 등록 실패", error);
      alert("기사 등록에 실패했습니다.");
      return;
    }
    setDriverName("");
    setDriverPhone("");
    await loadLists();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 시설 등록 */}
      <Card>
        <CardHeader>
          <CardTitle>시설 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addFacility} className="space-y-4">
            <div>
              <Label htmlFor="facilityName" className="mb-2">시설명</Label>
              <Input id="facilityName" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="예: 대강당 A" required />
            </div>
            <Button type="submit" className="w-full">등록</Button>
          </form>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>시설명</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.map((f) => (
                  <TableRow key={f.facility_id}>
                    <TableCell>{f.facility_id}</TableCell>
                    <TableCell>{f.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 차량 등록 */}
      <Card>
        <CardHeader>
          <CardTitle>차량 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addVehicle} className="space-y-4">
            <div>
              <Label htmlFor="plateNo" className="mb-2">차량 번호</Label>
              <Input id="plateNo" value={plateNo} onChange={(e) => setPlateNo(e.target.value)} placeholder="예: 12가3456" required />
            </div>
            <div>
              <Label htmlFor="vehicleModel" className="mb-2">차량 모델</Label>
              <Input id="vehicleModel" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="예: 그랜저" />
            </div>
            <div>
              <Label htmlFor="vehicleCapacity" className="mb-2">정원</Label>
              <Input id="vehicleCapacity" type="number" min={1} value={vehicleCapacity} onChange={(e) => setVehicleCapacity(e.target.value === "" ? "" : Number(e.target.value))} placeholder="예: 5" />
            </div>
            <Button type="submit" className="w-full">등록</Button>
          </form>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>번호</TableHead>
                  <TableHead>모델</TableHead>
                  <TableHead>정원</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.vehicle_id}>
                    <TableCell>{v.vehicle_id}</TableCell>
                    <TableCell>{v.plate_no}</TableCell>
                    <TableCell>{v.model ?? "-"}</TableCell>
                    <TableCell>{v.capacity ?? "-"}</TableCell>
                    <TableCell>{v.status ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 기사 등록 */}
      <Card>
        <CardHeader>
          <CardTitle>기사 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addDriver} className="space-y-4">
            <div>
              <Label htmlFor="driverName" className="mb-2">이름</Label>
              <Input id="driverName" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="예: 홍길동" required />
            </div>
            <div>
              <Label htmlFor="driverPhone" className="mb-2">연락처</Label>
              <Input id="driverPhone" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="예: 010-1234-5678" />
            </div>
            <Button type="submit" className="w-full">등록</Button>
          </form>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>전화</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => (
                  <TableRow key={d.driver_id}>
                    <TableCell>{d.driver_id}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>{d.phone ?? "-"}</TableCell>
                    <TableCell>{d.status ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
