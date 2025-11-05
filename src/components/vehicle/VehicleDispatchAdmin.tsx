import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Info } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import { supabase } from "../../utils/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Input } from "../ui/input";

type DbStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

type ReservationRow = {
  reservation_id: number;
  reservation_type: string;
  user_id: string;
  org_id: number | null;
  facility_id: number | null;
  vehicle_id: number | null;
  title: string | null;
  participants: number | null;
  start_time: string; // ISO
  end_time: string; // ISO
  status: DbStatus | null;
  departure?: string | null;
  destination?: string | null;
};

type DriverRow = {
  driver_id: number;
  name: string;
  phone?: string | null;
  status?: string | null;
};

type VehicleRow = {
  vehicle_id: number;
  plate_no: string;
  model?: string | null;
  capacity?: number | null;
  status?: string | null;
};

type DispatchRow = {
  dispatch_id: number;
  reservation_id: number;
  driver_id: number | null;
  vehicle_id: number;
  status: string | null;
  created_at?: string | null;
  reservations?: ReservationRow | ReservationRow[] | null;
  drivers?: { name?: string | null; phone?: string | null } | { name?: string | null; phone?: string | null }[] | null;
  vehicles?: { plate_no?: string | null; model?: string | null } | { plate_no?: string | null; model?: string | null }[] | null;
};

export function VehicleDispatchAdmin() {
  const { user } = useAuth();

  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRow[]>([]);
  const [pendingReservations, setPendingReservations] = useState<ReservationRow[]>([]);
  const [selection, setSelection] = useState<Record<number, { driver_id?: number; vehicle_id?: number }>>({});
  const [returnMinutes, setReturnMinutes] = useState<Record<number, string>>({});
  const formatNaiveLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const HH = pad(date.getHours());
    const MM = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${HH}:${MM}:00`;
  };
  
  type AssignedCard = {
    dispatch_id: number;
    reservation_id: number;
    vehicle_id: number;
    driver_id: number | null;
    status: string | null;
    start_time: string;
    end_time: string;
    departure: string | null;
    destination: string | null;
    title?: string | null;
  };

  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : "");
  const fmtTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }) : "";

  useEffect(() => {
    if (user?.roleId !== 3) return;
    let alive = true;
    const run = async () => {
      try {
        const [{ data: d1 }, { data: d2 }] = await Promise.all([
          supabase.from("drivers").select("driver_id, name, phone, status").order("driver_id", { ascending: true }),
          supabase
            .from("vehicles")
            .select("vehicle_id, plate_no, model, capacity, status")
            .order("vehicle_id", { ascending: true }),
        ]);

        const { data: disp } = await supabase
          .from("dispatches")
          .select(
            `dispatch_id, reservation_id, driver_id, vehicle_id, status, created_at,
             reservations ( reservation_id, start_time, end_time, departure, destination ),
             drivers ( name, phone ),
             vehicles ( plate_no, model )`
          )
          .order("dispatch_id", { ascending: true });

        const { data: pending } = await supabase
          .from("reservations")
          .select(
            "reservation_id, reservation_type, user_id, org_id, facility_id, vehicle_id, title, participants, start_time, end_time, status, departure, destination"
          )
          .eq("reservation_type", "VEHICLE")
          .in("status", ["PENDING", "APPROVED"]) // 처리 대상
          .order("start_time", { ascending: true });

        if (!alive) return;
        setDrivers((d1 ?? []) as DriverRow[]);
        setVehicles((d2 ?? []) as VehicleRow[]);
        setDispatches((disp ?? []) as DispatchRow[]);
        setPendingReservations(((pending ?? []) as ReservationRow[]).filter((r) => !!r.start_time && !!r.end_time));
      } catch (err) {
        console.error("관리자 배차 데이터 로드 실패", err);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [user?.roleId]);

  const hasOverlap = (startA: Date, endA: Date, startB: Date, endB: Date) => startA < endB && endA > startB;
  const extractResTimes = (d: DispatchRow) => {
    const r = Array.isArray(d.reservations) ? d.reservations[0] : d.reservations;
    return r ? { start: new Date(r.start_time), end: new Date(r.end_time) } : null;
  };

  const dispatchesByDriver = useMemo(() => {
    const m = new Map<number, DispatchRow[]>();
    for (const d of dispatches) {
      if (d.driver_id == null) continue;
      const arr = m.get(d.driver_id) ?? [];
      arr.push(d);
      m.set(d.driver_id, arr);
    }
    return m;
  }, [dispatches]);

  const dispatchesByVehicle = useMemo(() => {
    const m = new Map<number, DispatchRow[]>();
    for (const d of dispatches) {
      const arr = m.get(d.vehicle_id) ?? [];
      arr.push(d);
      m.set(d.vehicle_id, arr);
    }
    return m;
  }, [dispatches]);

  const availableDriversFor = (startISO: string, endISO: string) => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    return drivers
      .filter((drv) => (drv.status ?? "ACTIVE") === "ACTIVE")
      .filter((drv) => {
        const items = dispatchesByDriver.get(drv.driver_id) ?? [];
        return !items.some((it) => {
          const t = extractResTimes(it);
          return t ? hasOverlap(start, end, t.start, t.end) : false;
        });
      });
  };

  const availableVehiclesFor = (startISO: string, endISO: string, minCapacity?: number | null) => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    return vehicles
      .filter((veh) => (veh.status ?? "AVAILABLE") === "AVAILABLE")
      .filter((veh) => (minCapacity == null ? true : (veh.capacity == null || veh.capacity >= minCapacity)))
      .filter((veh) => {
        const items = dispatchesByVehicle.get(veh.vehicle_id) ?? [];
        return !items.some((it) => {
          const t = extractResTimes(it);
          return t ? hasOverlap(start, end, t.start, t.end) : false;
        });
      });
  };

  const driverDisableReason = (drv: DriverRow, startISO: string, endISO: string) => {
    if ((drv.status ?? "ACTIVE") !== "ACTIVE") return "비활성 기사";
    const start = new Date(startISO);
    const end = new Date(endISO);
    const items = dispatchesByDriver.get(drv.driver_id) ?? [];
    const overlap = items.some((it) => {
      const t = extractResTimes(it);
      return t ? hasOverlap(start, end, t.start, t.end) : false;
    });
    if (overlap) return "해당 시간에 다른 배차가 있습니다.";
    return null;
  };

  const vehicleDisableReason = (veh: VehicleRow, startISO: string, endISO: string, minCapacity?: number | null) => {
    if ((veh.status ?? "AVAILABLE") !== "AVAILABLE") return "비가용 차량";
    if (minCapacity != null && veh.capacity != null && veh.capacity < minCapacity) return "정원 부족";
    const start = new Date(startISO);
    const end = new Date(endISO);
    const items = dispatchesByVehicle.get(veh.vehicle_id) ?? [];
    const overlap = items.some((it) => {
      const t = extractResTimes(it);
      return t ? hasOverlap(start, end, t.start, t.end) : false;
    });
    if (overlap) return "해당 시간에 다른 배차가 있습니다.";
    return null;
  };

  const refreshAdminData = async () => {
    const [{ data: disp }, { data: pending }] = await Promise.all([
      supabase
        .from("dispatches")
        .select(
          `dispatch_id, reservation_id, driver_id, vehicle_id, status, created_at,
           reservations ( reservation_id, start_time, end_time, departure, destination ),
           drivers ( name, phone ),
           vehicles ( plate_no, model )`
        )
        .order("dispatch_id", { ascending: true }),
      supabase
        .from("reservations")
        .select(
          "reservation_id, reservation_type, user_id, org_id, facility_id, vehicle_id, title, participants, start_time, end_time, status, departure, destination"
        )
        .eq("reservation_type", "VEHICLE")
        .in("status", ["PENDING", "APPROVED"]) // 처리 대상
        .order("start_time", { ascending: true }),
    ]);
    setDispatches((disp ?? []) as DispatchRow[]);
    setPendingReservations(((pending ?? []) as ReservationRow[]).filter((x) => !!x.start_time && !!x.end_time));
  };

  // 현재/미래의 배차 완료(ASSIGNED) 목록을 카드용으로 구성
  const assignedCards: AssignedCard[] = useMemo(() => {
    const now = new Date();
    const list: AssignedCard[] = [];
    for (const d of dispatches) {
      if ((d.status ?? "") !== "ASSIGNED") continue;
      const r = Array.isArray(d.reservations) ? d.reservations[0] : d.reservations;
      if (!r) continue;
      const start = new Date(r.start_time);
      if (start < now) continue;
      list.push({
        dispatch_id: d.dispatch_id,
        reservation_id: d.reservation_id,
        vehicle_id: d.vehicle_id,
        driver_id: d.driver_id,
        status: d.status,
        start_time: r.start_time,
        end_time: r.end_time,
        departure: r.departure ?? null,
        destination: r.destination ?? null,
        title: r.title ?? null,
      });
    }
    // sort by start time asc
    return list.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [dispatches]);

  // 배차 요청 테이블에서 이미 배차(ASSIGNED)된 예약은 숨김
  const assignedReservationIds = useMemo(() => {
    const s = new Set<number>();
    for (const d of dispatches) {
      if ((d.status ?? "") === "ASSIGNED") s.add(d.reservation_id);
    }
    return s;
  }, [dispatches]);

  const assign = async (r: ReservationRow) => {
    const sel = selection[r.reservation_id] || {};
    if (!sel.driver_id || !sel.vehicle_id) {
      alert("기사와 차량을 모두 선택하세요.");
      return;
    }

    const start = new Date(r.start_time);
    const fallbackMinutes = Math.max(1, Math.round((new Date(r.end_time).getTime() - start.getTime()) / 60000));
    const raw = returnMinutes[r.reservation_id];
    const parsed = raw != null && raw !== "" ? parseInt(raw, 10) : NaN;
    const minutes = Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMinutes;
    const end = new Date(start.getTime() + minutes * 60000);
    const endISO = formatNaiveLocal(end);
    if (!(end > start)) {
      alert("복귀 시간이 출발 시간보다 이후여야 합니다.");
      return;
    }
    const drvItems = dispatchesByDriver.get(sel.driver_id) ?? [];
    const vehItems = dispatchesByVehicle.get(sel.vehicle_id) ?? [];
    const chosenVehicle = vehicles.find((v) => v.vehicle_id === sel.vehicle_id);
    if (chosenVehicle && r.participants != null && chosenVehicle.capacity != null && chosenVehicle.capacity < r.participants) {
      alert(`선택한 차량 정원(${chosenVehicle.capacity})이 요청 인원(${r.participants})보다 적습니다.`);
      return;
    }
    const driverConflict = drvItems.some((it) => {
      const t = extractResTimes(it);
      return t ? hasOverlap(start, end, t.start, t.end) : false;
    });
    const vehicleConflict = vehItems.some((it) => {
      const t = extractResTimes(it);
      return t ? hasOverlap(start, end, t.start, t.end) : false;
    });

    if (driverConflict || vehicleConflict) {
      const candidates = availableDriversFor(r.start_time, r.end_time).slice(0, 5);
      const suggestion = candidates.map((c) => `${c.name}(${c.driver_id})`).join(", ");
      alert(
        `배차 시간이 겹칩니다.\n` +
          `${driverConflict ? "선택한 기사 시간 중복" : ""}${driverConflict && vehicleConflict ? ", " : ""}${
            vehicleConflict ? "선택한 차량 시간 중복" : ""
          }\n` +
          (suggestion ? `가능한 다른 기사: ${suggestion}` : "다른 가능한 기사가 없습니다.")
      );
      return;
    }

    const { error: e1 } = await supabase.from("dispatches").insert({
      reservation_id: r.reservation_id,
      driver_id: sel.driver_id,
      vehicle_id: sel.vehicle_id,
      status: "ASSIGNED",
    });
    if (e1) {
      console.error("배차 등록 실패", e1);
      alert("배차 등록에 실패했습니다.");
      return;
    }

    const { error: e2 } = await supabase
      .from("reservations")
      .update({ status: "APPROVED", vehicle_id: sel.vehicle_id, end_time: endISO })
      .eq("reservation_id", r.reservation_id);

    if (e2) {
      console.error("예약 상태 갱신 실패", e2);
      alert("예약 갱신에 실패했습니다.");
      return;
    }

    await refreshAdminData();
  };

  const rejectReservation = async (reservation_id: number) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "REJECTED" })
      .eq("reservation_id", reservation_id);
    if (error) {
      console.error("거절 실패", error);
      alert("거절 처리 실패");
      return;
    }
    await refreshAdminData();
  };

  const setDispatchStatus = async (
    dispatch_id: number,
    reservation_id: number,
    status: "DONE" | "CANCELLED"
  ) => {
    const { error: e1 } = await supabase
      .from("dispatches")
      .update({ status })
      .eq("dispatch_id", dispatch_id);
    if (e1) {
      console.error("배차 상태 변경 실패", e1);
      alert("배차 상태 변경에 실패했습니다.");
      return;
    }

    // 관리자에서만 재배차 가능: 배차 취소 시 예약은 PENDING으로 되돌리고 vehicle_id를 비웁니다.
    const nextRes =
      status === "DONE"
        ? { status: "COMPLETED" as const }
        : { status: "PENDING" as const, vehicle_id: null as number | null };
    const { error: e2 } = await supabase.from("reservations").update(nextRes).eq("reservation_id", reservation_id);
    if (e2) {
      console.error("예약 상태 변경 실패", e2);
    }
    await refreshAdminData();
  };

  const cancelAssignedCard = async (item: AssignedCard) => {
    const ok = typeof window !== "undefined" && window.confirm("해당 배차를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
    if (!ok) return;
    await setDispatchStatus(item.dispatch_id, item.reservation_id, "CANCELLED");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>차량 배차 관리</h2>
        <p className="text-muted-foreground">예약을 기사/차량과 연결하고 상태를 관리합니다.</p>
      </div>

      {user?.roleId === 3 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>기사별 배차 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
                {drivers.map((drv) => {
                  const items = (dispatchesByDriver.get(drv.driver_id) ?? [])
                    .slice()
                    .sort((a, b) => {
                      const ra = Array.isArray(a.reservations) ? a.reservations[0] : a.reservations;
                      const rb = Array.isArray(b.reservations) ? b.reservations[0] : b.reservations;
                      return new Date(ra?.start_time ?? 0).getTime() - new Date(rb?.start_time ?? 0).getTime();
                    });
                  return (
                    <div key={drv.driver_id} className="border rounded-md p-3">
                      <div className="font-semibold">
                        {drv.name} <span className="text-xs text-muted-foreground">#{drv.driver_id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{drv.phone ?? "연락처 없음"}</div>
                      {items.length === 0 ? (
                        <div className="text-sm text-muted-foreground">배차 내역 없음</div>
                      ) : (
                        <div className="space-y-2">
                          {items.map((it) => {
                            const r = Array.isArray(it.reservations) ? it.reservations[0] : it.reservations;
                            return (
                              <div key={it.dispatch_id} className="text-sm border rounded p-2">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div>
                                      {fmtDate(r?.start_time)} {fmtTime(r?.start_time)} ~ {fmtTime(r?.end_time)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      차량 #{it.vehicle_id} · 예약 #{it.reservation_id}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {r?.departure ?? "-"} → {r?.destination ?? "-"}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge variant="secondary">{it.status ?? "PENDING"}</Badge>
                                    {(it.status === "ASSIGNED" || it.status === "PENDING") && (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setDispatchStatus(it.dispatch_id, it.reservation_id, "DONE")}
                                        >
                                          완료
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setDispatchStatus(it.dispatch_id, it.reservation_id, "CANCELLED")}
                                        >
                                          취소
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>배차 요청 처리</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>예약</TableHead>
                    <TableHead>일시</TableHead>
                    <TableHead>경로</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>기사 배정</TableHead>
                    <TableHead>차량 배정</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReservations.filter((r) => !assignedReservationIds.has(r.reservation_id)).map((r) => {
                    const sel = selection[r.reservation_id] || {};
                    const allDrivers = drivers.slice();
                    const allVehicles = vehicles.slice();
                    const minCap = r.participants ?? null;
                    return (
                      <TableRow key={r.reservation_id}>
                        <TableCell>
                          #{r.reservation_id}
                          <div className="text-xs text-muted-foreground">{r.title ?? "-"}</div>
                        </TableCell>
                        <TableCell>
                          <div>{fmtDate(r.start_time)}</div>
                          <div className="text-xs text-muted-foreground">
                            {fmtTime(r.start_time)} ~ {fmtTime(r.end_time)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{r.departure ?? "-"} → {r.destination ?? "-"}</div>
                        </TableCell>
                        <TableCell>{r.participants ?? 0}</TableCell>
                        <TableCell className="min-w-[220px]">
                          <Select
                            value={sel.driver_id ? String(sel.driver_id) : undefined}
                            onValueChange={(v) =>
                              setSelection((prev) => ({ ...prev, [r.reservation_id]: { ...prev[r.reservation_id], driver_id: Number(v) } }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="기사 선택" />
                            </SelectTrigger>
                            <SelectContent className="bg-white max-h-72 overflow-auto">
                              {allDrivers
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((d) => {
                                  const reason = driverDisableReason(d, r.start_time, r.end_time);
                                  const label = (
                                    <span className="inline-flex items-center gap-2">
                                      <span>
                                        {d.name} #{d.driver_id}
                                      </span>
                                      {reason ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="text-xs text-red-600 inline-flex items-center gap-1">
                                              <Info className="size-3" />
                                              {reason.includes("배차") ? "겹침" : reason}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>{reason}</TooltipContent>
                                        </Tooltip>
                                      ) : null}
                                    </span>
                                  );
                                  return (
                                    <SelectItem key={d.driver_id} value={String(d.driver_id)} disabled={!!reason}>
                                      {label}
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="min-w-[260px]">
                          <Select
                            value={sel.vehicle_id ? String(sel.vehicle_id) : undefined}
                            onValueChange={(v) =>
                              setSelection((prev) => ({ ...prev, [r.reservation_id]: { ...prev[r.reservation_id], vehicle_id: Number(v) } }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="차량 선택" />
                            </SelectTrigger>
                            <SelectContent className="bg-white max-h-72 overflow-auto">
                              {allVehicles
                                .sort((a, b) => (a.model ?? "").localeCompare(b.model ?? "") || a.plate_no.localeCompare(b.plate_no))
                                .map((v) => {
                                  const reason = vehicleDisableReason(v, r.start_time, r.end_time, minCap);
                                  const label = (
                                    <span className="inline-flex items-center gap-2">
                                      <span>
                                        {v.model ? `${v.model} (${v.plate_no})` : v.plate_no}
                                        {v.capacity ? ` · ${v.capacity}인승` : ""}
                                      </span>
                                      {reason ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="text-xs text-red-600 inline-flex items-center gap-1">
                                              <Info className="size-3" />
                                              {reason.includes("배차") ? "겹침" : reason}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>{reason}</TooltipContent>
                                        </Tooltip>
                                      ) : null}
                                    </span>
                                  );
                                  return (
                                    <SelectItem key={v.vehicle_id} value={String(v.vehicle_id)} disabled={!!reason}>
                                      {label}
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <div className="inline-flex items-center gap-2 mr-2 align-middle">
                            <span className="text-xs text-muted-foreground">소요(분)</span>
                            <Input
                              type="number"
                              min={1}
                              placeholder="예: 30"
                              className="h-8 w-[120px]"
                              value={(returnMinutes[r.reservation_id] ?? "") as string}
                              onChange={(e) => setReturnMinutes((prev) => ({ ...prev, [r.reservation_id]: e.target.value }))}
                            />
                          </div>
                          <Button size="sm" variant="outline" onClick={() => assign(r)}>
                            배차 완료
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectReservation(r.reservation_id)}>
                            거절
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 하단: 배차 완료된 요청 카드 (현재/미래) */}
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>배차 완료된 요청</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedCards.length === 0 ? (
                <div className="text-sm text-muted-foreground">현재/미래 일정의 배차 완료된 요청이 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedCards.map((it) => (
                    <div key={it.dispatch_id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">예약 #{it.reservation_id}</div>
                        <Badge variant="secondary">{it.status ?? "ASSIGNED"}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>
                          {fmtDate(it.start_time)} {fmtTime(it.start_time)} ~ {fmtTime(it.end_time)}
                        </div>
                        <div>{it.departure ?? "-"} → {it.destination ?? "-"}</div>
                        <div className="text-xs">차량 #{it.vehicle_id}{it.driver_id ? ` · 기사 #${it.driver_id}` : ""}</div>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" onClick={() => cancelAssignedCard(it)}>
                          배차 취소
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
