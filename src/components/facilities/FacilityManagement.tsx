import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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

      <Tabs defaultValue="facility">
        <TabsList>
          <TabsTrigger value="facility">시설</TabsTrigger>
          <TabsTrigger value="vehicle">차량</TabsTrigger>
          <TabsTrigger value="driver">기사</TabsTrigger>
          <TabsTrigger value="equipment">장비</TabsTrigger>
        </TabsList>
        <TabsContent value="facility">
          <AdminRegistration section="facility" />
        </TabsContent>
        <TabsContent value="vehicle">
          <AdminRegistration section="vehicle" />
        </TabsContent>
        <TabsContent value="driver">
          <AdminRegistration section="driver" />
        </TabsContent>
        <TabsContent value="equipment">
          <AdminRegistration section="equipment" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminRegistration({ section }: { section: "facility" | "vehicle" | "driver" | "equipment" }) {
  // Facilities state
  const [facilityCode, setFacilityCode] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [facilityCategory, setFacilityCategory] = useState<"TRAINING" | "AUXILIARY">("TRAINING");
  const [facilityCapacity, setFacilityCapacity] = useState<number | "">("");
  const [facilityLocation, setFacilityLocation] = useState("");
  const [facilityActive, setFacilityActive] = useState(true);
  const [facilities, setFacilities] = useState<Array<{ facility_id: number; code: string; name: string; category: string; capacity: number | null; location: string | null; is_active: boolean }>>([]);
  const [facilityEditingId, setFacilityEditingId] = useState<number | null>(null);

  // Vehicles state
  const [plateNo, setPlateNo] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleCapacity, setVehicleCapacity] = useState<number | "">("");
  const [vehicleStatus, setVehicleStatus] = useState<"AVAILABLE" | "IN_SERVICE" | "MAINTENANCE">("AVAILABLE");
  const [vehicles, setVehicles] = useState<Array<{ vehicle_id: number; plate_no: string; model?: string | null; capacity?: number | null; status: "AVAILABLE" | "IN_SERVICE" | "MAINTENANCE" }>>([]);
  const [vehicleEditingId, setVehicleEditingId] = useState<number | null>(null);

  // Drivers state
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverStatus, setDriverStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [drivers, setDrivers] = useState<Array<{ driver_id: number; name: string; phone?: string | null; status: "ACTIVE" | "INACTIVE" }>>([]);
  const [driverEditingId, setDriverEditingId] = useState<number | null>(null);

  // Equipments state
  const [equipmentFacilityId, setEquipmentFacilityId] = useState<number | "">("");
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentQty, setEquipmentQty] = useState<number | "">("");
  const [equipments, setEquipments] = useState<Array<{ equipment_id: number; facility_id: number; name: string; quantity: number }>>([]);
  const [equipmentEditingId, setEquipmentEditingId] = useState<number | null>(null);

  const loadLists = async () => {
    try {
      const [{ data: fac }, { data: veh }, { data: drv }] = await Promise.all([
        supabase
          .from("facilities")
          .select("facility_id, code, name, category, capacity, location, is_active")
          .order("facility_id", { ascending: true })
          .limit(10),
        supabase
          .from("vehicles")
          .select("vehicle_id, plate_no, model, capacity, status")
          .order("vehicle_id", { ascending: true })
          .limit(10),
        supabase
          .from("drivers")
          .select("driver_id, name, phone, status")
          .order("driver_id", { ascending: true })
          .limit(10),
      ]);
      setFacilities((fac ?? []) as any);
      setVehicles((veh ?? []) as any);
      setDrivers((drv ?? []) as any);
    } catch (e) {
      console.error("목록 로드 실패", e);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  // Load equipments when facility changes or when entering equipment section
  useEffect(() => {
    const loadEquipments = async () => {
      if (!equipmentFacilityId) return;
      const { data, error } = await supabase
        .from("facility_equipments")
        .select("equipment_id, facility_id, name, quantity")
        .eq("facility_id", equipmentFacilityId)
        .order("equipment_id", { ascending: true })
        .limit(50);
      if (error) {
        console.error("장비 목록 로드 실패", error);
        setEquipments([]);
      } else {
        setEquipments((data ?? []) as any);
      }
    };
    loadEquipments();
  }, [equipmentFacilityId]);

  const saveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = facilityCode.trim();
    const name = facilityName.trim();
    if (!code || !name) return;
    const cap = facilityCapacity === "" ? null : Number(facilityCapacity);
    const location = facilityLocation.trim() || null;
    let error;
    if (facilityEditingId) {
      ({ error } = await supabase
        .from("facilities")
        .update({ code, name, category: facilityCategory, capacity: cap, location, is_active: facilityActive })
        .eq("facility_id", facilityEditingId));
    } else {
      ({ error } = await supabase
        .from("facilities")
        .insert({ code, name, category: facilityCategory, capacity: cap, location, is_active: facilityActive }));
    }
    if (error) {
      console.error("시설 저장 실패", error);
      alert("시설 저장에 실패했습니다.");
      return;
    }
    setFacilityCode("");
    setFacilityName("");
    setFacilityCategory("TRAINING");
    setFacilityCapacity("");
    setFacilityLocation("");
    setFacilityActive(true);
    setFacilityEditingId(null);
    await loadLists();
  };

  const editFacility = (f: { facility_id: number; code: string; name: string; category: string; capacity: number | null; location: string | null; is_active: boolean }) => {
    setFacilityEditingId(f.facility_id);
    setFacilityCode(f.code);
    setFacilityName(f.name);
    setFacilityCategory(f.category as any);
    setFacilityCapacity(f.capacity ?? "");
    setFacilityLocation(f.location ?? "");
    setFacilityActive(Boolean(f.is_active));
  };

  const deleteFacility = async (facility_id: number) => {
    if (!confirm("해당 시설을 삭제하시겠습니까? 관련 예약이 있으면 실패할 수 있습니다.")) return;
    const { error } = await supabase.from("facilities").delete().eq("facility_id", facility_id);
    if (error) {
      console.error("시설 삭제 실패", error);
      alert("시설 삭제에 실패했습니다. 관련 데이터가 있을 수 있습니다.");
    } else {
      if (facilityEditingId === facility_id) setFacilityEditingId(null);
      await loadLists();
    }
  };

  const saveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const plate_no = plateNo.trim();
    if (!plate_no) return;
    const cap = vehicleCapacity === "" ? null : Number(vehicleCapacity);
    let error;
    if (vehicleEditingId) {
      ({ error } = await supabase
        .from("vehicles")
        .update({ plate_no, model: vehicleModel || null, capacity: cap, status: vehicleStatus })
        .eq("vehicle_id", vehicleEditingId));
    } else {
      ({ error } = await supabase
        .from("vehicles")
        .insert({ plate_no, model: vehicleModel || null, capacity: cap, status: vehicleStatus }));
    }
    if (error) {
      console.error("차량 저장 실패", error);
      alert("차량 저장에 실패했습니다.");
      return;
    }
    setPlateNo("");
    setVehicleModel("");
    setVehicleCapacity("");
    setVehicleStatus("AVAILABLE");
    setVehicleEditingId(null);
    await loadLists();
  };

  const editVehicle = (v: { vehicle_id: number; plate_no: string; model?: string | null; capacity?: number | null; status: "AVAILABLE" | "IN_SERVICE" | "MAINTENANCE" }) => {
    setVehicleEditingId(v.vehicle_id);
    setPlateNo(v.plate_no);
    setVehicleModel(v.model ?? "");
    setVehicleCapacity(v.capacity ?? "");
    setVehicleStatus(v.status);
  };

  const deleteVehicle = async (vehicle_id: number) => {
    if (!confirm("해당 차량을 삭제하시겠습니까? 관련 예약/배차가 있으면 실패할 수 있습니다.")) return;
    const { error } = await supabase.from("vehicles").delete().eq("vehicle_id", vehicle_id);
    if (error) {
      console.error("차량 삭제 실패", error);
      alert("차량 삭제에 실패했습니다. 관련 데이터가 있을 수 있습니다.");
    } else {
      if (vehicleEditingId === vehicle_id) setVehicleEditingId(null);
      await loadLists();
    }
  };

  const saveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = driverName.trim();
    if (!name) return;
    const phone = driverPhone.trim() || null;
    let error;
    if (driverEditingId) {
      ({ error } = await supabase
        .from("drivers")
        .update({ name, phone, status: driverStatus })
        .eq("driver_id", driverEditingId));
    } else {
      ({ error } = await supabase.from("drivers").insert({ name, phone, status: driverStatus }));
    }
    if (error) {
      console.error("기사 저장 실패", error);
      alert("기사 저장에 실패했습니다.");
      return;
    }
    setDriverName("");
    setDriverPhone("");
    setDriverStatus("ACTIVE");
    setDriverEditingId(null);
    await loadLists();
  };

  const updateFacilityActive = async (facility_id: number, next: boolean) => {
    const original = [...facilities];
    setFacilities((prev) => prev.map((f) => (f.facility_id === facility_id ? { ...f, is_active: next } : f)));
    const { error } = await supabase.from("facilities").update({ is_active: next }).eq("facility_id", facility_id);
    if (error) {
      console.error("시설 활성화 변경 실패", error);
      setFacilities(original);
      alert("시설 활성화 상태 변경에 실패했습니다.");
    }
  };

  const updateVehicleStatus = async (vehicle_id: number, status: "AVAILABLE" | "IN_SERVICE" | "MAINTENANCE") => {
    const original = [...vehicles];
    setVehicles((prev) => prev.map((v) => (v.vehicle_id === vehicle_id ? { ...v, status } : v)));
    const { error } = await supabase.from("vehicles").update({ status }).eq("vehicle_id", vehicle_id);
    if (error) {
      console.error("차량 상태 변경 실패", error);
      setVehicles(original);
      alert("차량 상태 변경에 실패했습니다.");
    }
  };

  const updateDriverStatus = async (driver_id: number, status: "ACTIVE" | "INACTIVE") => {
    const original = [...drivers];
    setDrivers((prev) => prev.map((d) => (d.driver_id === driver_id ? { ...d, status } : d)));
    const { error } = await supabase.from("drivers").update({ status }).eq("driver_id", driver_id);
    if (error) {
      console.error("기사 상태 변경 실패", error);
      setDrivers(original);
      alert("기사 상태 변경에 실패했습니다.");
    }
  };

  const editDriver = (d: { driver_id: number; name: string; phone?: string | null; status: "ACTIVE" | "INACTIVE" }) => {
    setDriverEditingId(d.driver_id);
    setDriverName(d.name);
    setDriverPhone(d.phone ?? "");
    setDriverStatus(d.status);
  };

  const deleteDriver = async (driver_id: number) => {
    if (!confirm("해당 기사를 삭제하시겠습니까? 관련 배차가 있으면 실패할 수 있습니다.")) return;
    const { error } = await supabase.from("drivers").delete().eq("driver_id", driver_id);
    if (error) {
      console.error("기사 삭제 실패", error);
      alert("기사 삭제에 실패했습니다. 관련 데이터가 있을 수 있습니다.");
    } else {
      if (driverEditingId === driver_id) setDriverEditingId(null);
      await loadLists();
    }
  };

  return (
    <div className="space-y-6">
      {/* 시설 등록 */}
      {section === "facility" && (
      <Card>
        <CardHeader>
          <CardTitle>시설 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveFacility} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facilityCode" className="mb-2">시설 코드</Label>
                <Input id="facilityCode" value={facilityCode} onChange={(e) => setFacilityCode(e.target.value)} placeholder="GYM-A-001" required />
              </div>
              <div>
                <Label htmlFor="facilityName" className="mb-2">시설명</Label>
                <Input id="facilityName" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="체육관 A" required />
              </div>
              <div>
                <Label className="mb-2">카테고리</Label>
                <Select value={facilityCategory} onValueChange={(v) => setFacilityCategory(v as any)}>
                  <SelectTrigger className="bg-gray-50 border rounded-md">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border rounded-md">
                    <SelectItem value="TRAINING">TRAINING</SelectItem>
                    <SelectItem value="AUXILIARY">AUXILIARY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="facilityCapacity" className="mb-2">수용인원</Label>
                <Input id="facilityCapacity" type="number" min={1} value={facilityCapacity} onChange={(e) => setFacilityCapacity(e.target.value === "" ? "" : Number(e.target.value))} placeholder="예: 30" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="facilityLocation" className="mb-2">위치</Label>
                <Input id="facilityLocation" value={facilityLocation} onChange={(e) => setFacilityLocation(e.target.value)} placeholder="예: 본관 2층 체육관" />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <Switch id="facilityActive" checked={facilityActive} onCheckedChange={setFacilityActive} />
                <Label htmlFor="facilityActive">활성화</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{facilityEditingId ? "수정 저장" : "등록"}</Button>
              {facilityEditingId && (
                <Button type="button" variant="outline" onClick={() => { setFacilityEditingId(null); setFacilityCode(""); setFacilityName(""); setFacilityCategory("TRAINING"); setFacilityCapacity(""); setFacilityLocation(""); setFacilityActive(true); }}>취소</Button>
              )}
            </div>
          </form>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>코드</TableHead>
                  <TableHead>시설명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>수용인원</TableHead>
                  <TableHead>위치</TableHead>
                  <TableHead>활성화</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.map((f) => (
                  <TableRow key={f.facility_id}>
                    <TableCell>{f.facility_id}</TableCell>
                    <TableCell>{f.code}</TableCell>
                    <TableCell>{f.name}</TableCell>
                    <TableCell>{f.category}</TableCell>
                    <TableCell>{f.capacity ?? "-"}</TableCell>
                    <TableCell>{f.location ?? "-"}</TableCell>
                    <TableCell>
                      <Switch checked={f.is_active} onCheckedChange={(v) => updateFacilityActive(f.facility_id, v)} />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => editFacility(f)}>수정</Button>
                      <Button variant="outline" size="sm" onClick={() => deleteFacility(f.facility_id)}>삭제</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 차량 등록 */}
      {section === "vehicle" && (
      <Card>
        <CardHeader>
          <CardTitle>차량 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveVehicle} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plateNo" className="mb-2">차량 번호</Label>
                <Input id="plateNo" value={plateNo} onChange={(e) => setPlateNo(e.target.value)} placeholder="예: 12가3456" required />
              </div>
              <div>
                <Label htmlFor="vehicleModel" className="mb-2">차량 모델</Label>
                <Input id="vehicleModel" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="예: 스타리아" />
              </div>
              <div>
                <Label htmlFor="vehicleCapacity" className="mb-2">정원</Label>
                <Input id="vehicleCapacity" type="number" min={1} value={vehicleCapacity} onChange={(e) => setVehicleCapacity(e.target.value === "" ? "" : Number(e.target.value))} placeholder="예: 5" />
              </div>
              <div>
                <Label className="mb-2">상태</Label>
                <Select value={vehicleStatus} onValueChange={(v) => setVehicleStatus(v as any)}>
                  <SelectTrigger className="bg-gray-50 border rounded-md">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border rounded-md">
                    <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                    <SelectItem value="IN_SERVICE">IN_SERVICE</SelectItem>
                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{vehicleEditingId ? "수정 저장" : "등록"}</Button>
              {vehicleEditingId && (
                <Button type="button" variant="outline" onClick={() => { setVehicleEditingId(null); setPlateNo(""); setVehicleModel(""); setVehicleCapacity(""); setVehicleStatus("AVAILABLE"); }}>취소</Button>
              )}
            </div>
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
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.vehicle_id}>
                    <TableCell>{v.vehicle_id}</TableCell>
                    <TableCell>{v.plate_no}</TableCell>
                    <TableCell>{v.model ?? "-"}</TableCell>
                    <TableCell>{v.capacity ?? "-"}</TableCell>
                    <TableCell>
                      <Select value={v.status} onValueChange={(val) => updateVehicleStatus(v.vehicle_id, val as any)}>
                        <SelectTrigger className="bg-gray-50 border rounded-md h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border rounded-md">
                          <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                          <SelectItem value="IN_SERVICE">IN_SERVICE</SelectItem>
                          <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => editVehicle(v)}>수정</Button>
                      <Button variant="outline" size="sm" onClick={() => deleteVehicle(v.vehicle_id)}>삭제</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 기사 등록 */}
      {section === "driver" && (
      <Card>
        <CardHeader>
          <CardTitle>기사 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveDriver} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="driverName" className="mb-2">이름</Label>
                <Input id="driverName" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="예: 홍길동" required />
              </div>
              <div>
                <Label htmlFor="driverPhone" className="mb-2">연락처</Label>
                <Input id="driverPhone" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="예: 010-1234-5678" />
              </div>
              <div>
                <Label className="mb-2">상태</Label>
                <Select value={driverStatus} onValueChange={(v) => setDriverStatus(v as any)}>
                  <SelectTrigger className="bg-gray-50 border rounded-md">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border rounded-md">
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{driverEditingId ? "수정 저장" : "등록"}</Button>
              {driverEditingId && (
                <Button type="button" variant="outline" onClick={() => { setDriverEditingId(null); setDriverName(""); setDriverPhone(""); setDriverStatus("ACTIVE"); }}>취소</Button>
              )}
            </div>
          </form>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>전화</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => (
                  <TableRow key={d.driver_id}>
                    <TableCell>{d.driver_id}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>{d.phone ?? "-"}</TableCell>
                    <TableCell>
                      <Select value={d.status} onValueChange={(val) => updateDriverStatus(d.driver_id, val as any)}>
                        <SelectTrigger className="bg-gray-50 border rounded-md h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border rounded-md">
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => editDriver(d)}>수정</Button>
                      <Button variant="outline" size="sm" onClick={() => deleteDriver(d.driver_id)}>삭제</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 장비 관리 */}
      {section === "equipment" && (
      <Card>
        <CardHeader>
          <CardTitle>장비 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!equipmentFacilityId) {
              alert("먼저 시설을 선택하세요.");
              return;
            }
            const name = equipmentName.trim();
            if (!name) return;
            const qty = equipmentQty === "" ? 1 : Number(equipmentQty);
            let error;
            if (equipmentEditingId) {
              ({ error } = await supabase
                .from("facility_equipments")
                .update({ facility_id: equipmentFacilityId, name, quantity: qty })
                .eq("equipment_id", equipmentEditingId));
            } else {
              ({ error } = await supabase
                .from("facility_equipments")
                .insert({ facility_id: equipmentFacilityId, name, quantity: qty }));
            }
            if (error) {
              console.error("장비 저장 실패", error);
              alert("장비 저장에 실패했습니다. (시설별 장비명은 중복될 수 없어요)");
              return;
            }
            setEquipmentEditingId(null);
            setEquipmentName("");
            setEquipmentQty("");
            // reload
            const { data } = await supabase
              .from("facility_equipments")
              .select("equipment_id, facility_id, name, quantity")
              .eq("facility_id", equipmentFacilityId)
              .order("equipment_id", { ascending: true })
              .limit(50);
            setEquipments((data ?? []) as any);
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2">시설 선택</Label>
                <Select value={equipmentFacilityId === "" ? "" : String(equipmentFacilityId)} onValueChange={(v) => setEquipmentFacilityId(v === "" ? "" : Number(v))}>
                  <SelectTrigger className="bg-gray-50 border rounded-md">
                    <SelectValue placeholder="시설 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border rounded-md max-h-60 overflow-auto">
                    {facilities.map((f) => (
                      <SelectItem key={f.facility_id} value={String(f.facility_id)}>
                        {f.code} - {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="equipmentName" className="mb-2">장비명</Label>
                <Input id="equipmentName" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} placeholder="예: 매트" />
              </div>
              <div>
                <Label htmlFor="equipmentQty" className="mb-2">수량</Label>
                <Input id="equipmentQty" type="number" min={1} value={equipmentQty} onChange={(e) => setEquipmentQty(e.target.value === "" ? "" : Number(e.target.value))} placeholder="예: 10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{equipmentEditingId ? "수정 저장" : "등록"}</Button>
              {equipmentEditingId && (
                <Button type="button" variant="outline" onClick={() => { setEquipmentEditingId(null); setEquipmentName(""); setEquipmentQty(""); }}>취소</Button>
              )}
            </div>
          </form>

          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>장비명</TableHead>
                  <TableHead>수량</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipments.map((e) => (
                  <TableRow key={e.equipment_id}>
                    <TableCell>{e.equipment_id}</TableCell>
                    <TableCell>{e.name}</TableCell>
                    <TableCell>{e.quantity}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => { setEquipmentEditingId(e.equipment_id); setEquipmentName(e.name); setEquipmentQty(e.quantity); }}>수정</Button>
                      <Button variant="outline" size="sm" onClick={async () => {
                        if (!confirm("해당 장비를 삭제하시겠습니까?")) return;
                        const { error } = await supabase.from("facility_equipments").delete().eq("equipment_id", e.equipment_id);
                        if (error) {
                          console.error("장비 삭제 실패", error);
                          alert("장비 삭제에 실패했습니다.");
                        } else {
                          setEquipments((prev) => prev.filter((x) => x.equipment_id !== e.equipment_id));
                          if (equipmentEditingId === e.equipment_id) { setEquipmentEditingId(null); setEquipmentName(""); setEquipmentQty(""); }
                        }
                      }}>삭제</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
