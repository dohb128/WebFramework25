import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { supabase } from "../../utils/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function MyPage() {
  const APPROVAL_REQUIRED = true;
  const { user } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editParticipants, setEditParticipants] = useState<number>(1);
  // Organizations
  const [orgs, setOrgs] = useState<Array<{ org_id: number; org_code: string; org_name: string }>>([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [currentOrgId, setCurrentOrgId] = useState<number | null>(null);
  const [currentOrgName, setCurrentOrgName] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [newOrgCode, setNewOrgCode] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const [orgPage, setOrgPage] = useState(1);
  const orgPageSize = 10;
  const [orgTotal, setOrgTotal] = useState(0);
  // 소속 요청
  const [joinSupport, setJoinSupport] = useState(true);
  const [myJoinRequests, setMyJoinRequests] = useState<Array<{ request_id: number; org_id: number; status: string; reason?: string | null; admin_reason?: string | null; created_at?: string }>>([]);
  const [joinReason, setJoinReason] = useState("");

  const getRoleName = (role: number | string) => {
    const roleNumber = typeof role === "string" ? parseInt(role, 10) : role;
    switch (roleNumber) {
      case 1:
        return "선수";
      case 2:
        return "코치";
      case 3:
        return "관리자";
      case 4:
        return "일반";
      default:
        return "알수없음";
    }
  };

  if (!user) {
    return (
      <div className="rounded-md border p-6 bg-white text-center">
        로그인 후 이용해주세요.
      </div>
    );
  }

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "reservation_id, reservation_type, title, participants, start_time, end_time, status, facility_id, vehicle_id"
        )
        .eq("user_id", user.user_id)
        .order("start_time", { ascending: false })
        .limit(20);
      if (!mounted) return;
      if (error) {
        setError("예약 목록을 불러오지 못했습니다.");
        setReservations([]);
      } else {
        setReservations(data ?? []);
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user.user_id]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setOrgLoading(true);
      const from = (orgPage - 1) * orgPageSize;
      const to = from + orgPageSize - 1;
      const query = supabase
        .from("organizations")
        .select("org_id, org_code, org_name", { count: "exact" })
        .order("org_name", { ascending: true })
        .range(from, to);
      const listQuery = orgSearch.trim()
        ? query.or(`org_name.ilike.%${orgSearch}%,org_code.ilike.%${orgSearch}%`)
        : query;
      const [{ data: orgList, count }, { data: myRow }] = await Promise.all([
        listQuery,
        supabase.from("users").select("org_id").eq("user_id", user.user_id).single(),
      ]);
      if (!alive) return;
      const list = (orgList ?? []) as any;
      setOrgs(list);
      setOrgTotal(count ?? 0);
      const myOrgId = (myRow as any)?.org_id ?? null;
      setCurrentOrgId(myOrgId);
      setSelectedOrgId(myOrgId);
      if (myOrgId) {
        const found = list.find((o: any) => o.org_id === myOrgId);
        if (found) setCurrentOrgName(found.org_name);
        else {
          const { data: one } = await supabase
            .from("organizations")
            .select("org_name")
            .eq("org_id", myOrgId)
            .single();
          setCurrentOrgName((one as any)?.org_name ?? null);
        }
      } else {
        setCurrentOrgName(null);
      }
      setOrgLoading(false);
    };
    run();
    return () => {
      alive = false;
    };
  }, [user.user_id, orgSearch, orgPage]);

  // 실시간: 승인되면 즉시 반영
  useEffect(() => {
    const channel = supabase
      .channel(`org-join-${user.user_id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'org_join_requests', filter: `user_id=eq.${user.user_id}` },
        async (payload: any) => {
          try {
            if (payload?.new?.status === 'APPROVED') {
              const { data } = await supabase
                .from('users')
                .select('org_id')
                .eq('user_id', user.user_id)
                .single();
              const newOrgId = (data as any)?.org_id ?? null;
              setCurrentOrgId(newOrgId);
              setSelectedOrgId(newOrgId);
              if (newOrgId) {
                const found = orgs.find((o) => o.org_id === newOrgId);
                if (found) setCurrentOrgName(found.org_name);
                else {
                  const { data: one } = await supabase
                    .from('organizations')
                    .select('org_name')
                    .eq('org_id', newOrgId)
                    .single();
                  setCurrentOrgName((one as any)?.org_name ?? null);
                }
              } else {
                setCurrentOrgName(null);
              }
            }
          } catch {}
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.user_id, orgs]);

  useEffect(() => {
    let alive = true;
    const loadMyJoin = async () => {
      const { data, error } = await supabase
        .from("org_join_requests")
        .select("request_id, org_id, status, reason, admin_reason, created_at")
        .eq("user_id", user.user_id)
        .order("request_id", { ascending: false })
        .limit(10);
      if (error) {
        setJoinSupport(false);
        setMyJoinRequests([]);
      } else if (alive) {
        setJoinSupport(true);
        setMyJoinRequests((data ?? []) as any);
      }
    };
    loadMyJoin();
    return () => {
      alive = false;
    };
  }, [user.user_id]);

  const cancelReservation = async (id: number) => {
    const ok = typeof window !== "undefined" && window.confirm("이 예약을 취소하시겠습니까?");
    if (!ok) return;
    const { error } = await supabase
      .from("reservations")
      .update({ status: "CANCELLED" })
      .eq("reservation_id", id)
      .in("status", ["PENDING", "APPROVED"]);
    if (error) {
      alert("취소에 실패했습니다.");
      return;
    }
    setReservations((prev) => prev.map((r) => (r.reservation_id === id ? { ...r, status: "CANCELLED" } : r)));
  };

  const openEdit = (r: any) => {
    setEditing(r);
    const start = new Date(r.start_time);
    const end = new Date(r.end_time);
    const ymd = start.toISOString().slice(0, 10);
    setEditDate(ymd);
    setEditStart(start.toISOString().slice(11, 16));
    setEditEnd(end.toISOString().slice(11, 16));
    setEditParticipants(r.participants ?? 1);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const startISO = `${editDate}T${editStart}:00`;
    const endISO = `${editDate}T${editEnd}:00`;
    if (new Date(startISO) >= new Date(endISO)) {
      alert("종료 시간이 시작 시간보다 늦어야 합니다.");
      return;
    }
    const { error } = await supabase
      .from("reservations")
      .update({ start_time: startISO, end_time: endISO, participants: editParticipants })
      .eq("reservation_id", editing.reservation_id)
      .eq("status", "PENDING");
    if (error) {
      alert("수정에 실패했습니다. (승인 전 예약만 변경할 수 있습니다)");
      return;
    }
    setReservations((prev) =>
      prev.map((r) =>
        r.reservation_id === editing.reservation_id
          ? { ...r, start_time: startISO, end_time: endISO, participants: editParticipants }
          : r
      )
    );
    setEditing(null);
  };

  const changeOrganization = async (orgIdStr: string) => {
    const orgId = Number(orgIdStr);
    if (!Number.isFinite(orgId)) return;
    if (APPROVAL_REQUIRED) {
      setSelectedOrgId(orgId);
    } else {
      const { error } = await supabase.from("users").update({ org_id: orgId }).eq("user_id", user.user_id);
      if (error) {
        alert("조직 변경에 실패했습니다.");
        return;
      }
      setSelectedOrgId(orgId);
      setCurrentOrgId(orgId);
      const found = orgs.find((o) => o.org_id === orgId);
      setCurrentOrgName(found ? found.org_name : currentOrgName);
    }
  };

  const registerOrganization = async () => {
    const code = newOrgCode.trim();
    const name = newOrgName.trim();
    if (!code || !name) return;
    const { data, error } = await supabase
      .from("organizations")
      .insert({ org_code: code, org_name: name })
      .select("org_id, org_code, org_name")
      .single();
    if (error) {
      alert("조직 등록에 실패했습니다. (코드 중복 여부 확인)");
      return;
    }
    setOrgs((prev) => [...prev, data as any].sort((a, b) => a.org_name.localeCompare(b.org_name)));
    setNewOrgCode("");
    setNewOrgName("");
    // 선택 및 사용자에 반영
    const newId = (data as any).org_id as number;
    const { error: err2 } = await supabase.from("users").update({ org_id: newId }).eq("user_id", user.user_id);
    if (!err2) setSelectedOrgId(newId);
  };

  const requestJoin = async (targetOrgId?: number) => {
    const orgId = targetOrgId ?? selectedOrgId ?? null;
    if (!orgId) {
      alert("먼저 조직을 선택하세요.");
      return;
    }
    const { data, error } = await supabase
      .from("org_join_requests")
      .insert({ user_id: user.user_id, org_id: orgId, reason: joinReason || null, status: "PENDING" })
      .select("request_id, org_id, status, reason, admin_reason, created_at")
      .single();
    if (error) {
      alert("소속 요청에 실패했습니다. (org_join_requests 테이블이 필요합니다)");
      return;
    }
    // email queue (optional)
    await supabase
      .from("email_queue")
      .insert({
        user_id: user.user_id,
        subject: "소속 요청이 접수되었습니다",
        body: `요청 ID #${(data as any).request_id} / 조직 ID ${(data as any).org_id}`,
        type: "ORG_JOIN_REQUEST",
      })
      .then(() => null)
      .catch(() => null as any);
    setJoinReason("");
    setMyJoinRequests((prev) => [data as any, ...prev].slice(0, 10));
  };

  const cancelJoinRequest = async (request_id: number) => {
    const { error } = await supabase
      .from("org_join_requests")
      .update({ status: "CANCELLED" })
      .eq("request_id", request_id)
      .eq("status", "PENDING");
    if (error) {
      alert("요청 취소에 실패했습니다.");
      return;
    }
    setMyJoinRequests((prev) => prev.map((r) => (r.request_id === request_id ? { ...r, status: "CANCELLED" } : r)));
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">마이페이지</h2>
        <p className="text-sm text-muted-foreground">내 계정 정보와 예약을 확인합니다.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>내 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-medium text-muted-foreground">이름</span> {user.name}
            </p>
            <p>
              <span className="font-medium text-muted-foreground">역할</span> {getRoleName(user.roleId)}
            </p>
            <p className="text-sm text-muted-foreground break-all">User ID: {user.user_id}</p>

            <div className="pt-3 space-y-2">
              <Label className="mb-1">조직 선택</Label>
              {currentOrgId != null && (
                <div className="text-sm">현재 소속: <Badge>{currentOrgName ?? `ID ${currentOrgId}`}</Badge></div>
              )}
              <div className="flex items-center gap-2">
                <Input placeholder="검색(이름/코드)" value={orgSearch} onChange={(e) => { setOrgPage(1); setOrgSearch(e.target.value); }} />
              </div>
              {orgLoading ? (
                <div className="text-sm text-muted-foreground">불러오는 중...</div>
              ) : (
                <Select value={selectedOrgId == null ? "" : String(selectedOrgId)} onValueChange={changeOrganization}>
                  <SelectTrigger className="bg-gray-50 border rounded-md">
                    <SelectValue placeholder="조직 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border rounded-md max-h-60 overflow-auto">
                    {orgs.map((o) => (
                      <SelectItem key={o.org_id} value={String(o.org_id)}>
                        {o.org_name} ({o.org_code})
                        {currentOrgId === o.org_id ? " · 현재" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>총 {orgTotal}건</span>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" disabled={orgPage <= 1} onClick={() => setOrgPage((p) => Math.max(1, p - 1))}>이전</Button>
                  <Button size="sm" variant="outline" disabled={orgPage * orgPageSize >= orgTotal} onClick={() => setOrgPage((p) => p + 1)}>다음</Button>
                </div>
              </div>
              {APPROVAL_REQUIRED && (
                <div className="text-xs text-muted-foreground">조직 변경은 승인 기반으로 처리됩니다. 조직을 선택한 뒤 아래에서 소속 요청을 보내주세요.</div>
              )}
            </div>

            <div className="pt-3 space-y-2">
              <Label className="mb-1">조직 등록</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="코드" value={newOrgCode} onChange={(e) => setNewOrgCode(e.target.value)} />
                <Input placeholder="조직명" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="md:col-span-2" />
              </div>
              <Button onClick={registerOrganization} className="w-full">등록</Button>
            </div>

            <div className="pt-3 space-y-2">
              <Label className="mb-1">소속 요청</Label>
              {!joinSupport && (
                <div className="text-xs text-muted-foreground">
                  org_join_requests 테이블이 없습니다. 아래 SQL로 생성 후 사용하세요.
                  <pre className="mt-2 whitespace-pre-wrap text-[10px] bg-gray-50 p-2 border rounded">{`create table org_join_requests (
  request_id bigserial primary key,
  user_id uuid not null references users(user_id) on delete cascade,
  org_id bigint not null references organizations(org_id) on delete cascade,
  status text check (status in ('PENDING','APPROVED','REJECTED','CANCELLED')) default 'PENDING',
  reason text,
  admin_reason text,
  created_at timestamp default current_timestamp
);
create index on org_join_requests(user_id, status);
`}</pre>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="요청 사유(선택)" value={joinReason} onChange={(e) => setJoinReason(e.target.value)} className="md:col-span-2" />
                <Button variant="outline" onClick={() => requestJoin()}>요청 보내기</Button>
              </div>
              {myJoinRequests.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  내 요청:
                  <ul className="mt-1 space-y-1">
                    {myJoinRequests.map((r) => (
                      <li key={r.request_id} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span>#{r.request_id} · org {r.org_id}</span>
                          <Badge
                            variant={r.status === 'PENDING' ? 'outline' : r.status === 'APPROVED' ? 'secondary' : r.status === 'REJECTED' ? 'destructive' : 'default'}
                          >
                            {r.status}
                          </Badge>
                          {r.admin_reason && <span className="truncate max-w-[180px]" title={r.admin_reason}>사유:{r.admin_reason}</span>}
                        </span>
                        <Button size="sm" variant="outline" disabled={r.status !== 'PENDING'} onClick={() => cancelJoinRequest(r.request_id)}>취소</Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>내 예약</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">로딩 중...</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : reservations.length === 0 ? (
              <div className="text-sm text-muted-foreground">예약이 없습니다.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>시작</TableHead>
                    <TableHead>종료</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((r) => (
                    <TableRow key={r.reservation_id}>
                      <TableCell>#{r.reservation_id}</TableCell>
                      <TableCell>{r.reservation_type}</TableCell>
                      <TableCell>{new Date(r.start_time).toLocaleString()}</TableCell>
                      <TableCell>{new Date(r.end_time).toLocaleString()}</TableCell>
                      <TableCell>{r.participants ?? "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "APPROVED"
                              ? "secondary"
                              : r.status === "PENDING"
                              ? "outline"
                              : r.status === "CANCELLED"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={r.status !== "PENDING"}
                              onClick={() => openEdit(r)}
                            >
                              변경
                            </Button>
                          </DialogTrigger>
                          {editing && editing.reservation_id === r.reservation_id && (
                            <DialogContent className="bg-white">
                              <DialogHeader>
                                <DialogTitle>예약 변경</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-3 py-2">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="mb-1">날짜</Label>
                                    <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                                  </div>
                                  <div>
                                    <Label className="mb-1">인원</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={editParticipants}
                                      onChange={(e) => setEditParticipants(Number(e.target.value))}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="mb-1">시작</Label>
                                    <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                                  </div>
                                  <div>
                                    <Label className="mb-1">종료</Label>
                                    <Input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditing(null)}>
                                  취소
                                </Button>
                                <Button onClick={saveEdit}>저장</Button>
                              </DialogFooter>
                            </DialogContent>
                          )}
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!["PENDING", "APPROVED"].includes(r.status)}
                          onClick={() => cancelReservation(r.reservation_id)}
                        >
                          취소
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
