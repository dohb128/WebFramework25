import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { supabase } from "../../utils/supabase/client";
import { useAuth } from "../../contexts/useAuth";

type UserRow = { user_id: string; name: string; role_id: number; status?: string | null };

export function AccessControl() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  // IP 접근 제어 제거됨
  const [joinSupport, setJoinSupport] = useState(true);
  const [joinItems, setJoinItems] = useState<Array<{ request_id: number; user_id: string; org_id: number; user_name?: string; org_name?: string; status: string; reason?: string | null }>>([]);
  const [adminReason, setAdminReason] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: usersData } = await supabase
        .from("users")
        .select("user_id, name, role_id, status")
        .order("name", { ascending: true });
      setUsers((usersData ?? []) as UserRow[]);

      // ip_whitelist 제거됨
      // org join requests
      const { data: joins, error: joinErr } = await supabase
        .from("org_join_requests")
        .select("request_id, user_id, org_id, status, reason")
        .eq("status", "PENDING")
        .order("request_id", { ascending: true });
      if (joinErr) {
        setJoinSupport(false);
        setJoinItems([]);
      } else {
        setJoinSupport(true);
        // try to enrich with names
        const userIds = Array.from(new Set((joins ?? []).map((j: any) => j.user_id)));
        const orgIds = Array.from(new Set((joins ?? []).map((j: any) => j.org_id)));
        const [{ data: urows }, { data: orows }] = await Promise.all([
          userIds.length ? supabase.from("users").select("user_id, name").in("user_id", userIds) : Promise.resolve({ data: [] as any }),
          orgIds.length ? supabase.from("organizations").select("org_id, org_name").in("org_id", orgIds) : Promise.resolve({ data: [] as any }),
        ] as any);
        const umap = new Map((urows ?? []).map((u: any) => [u.user_id, u.name]));
        const omap = new Map((orows ?? []).map((o: any) => [o.org_id, o.org_name]));
        setJoinItems(
          (joins ?? []).map((j: any) => ({
            ...j,
            user_name: umap.get(j.user_id),
            org_name: omap.get(j.org_id),
          })) as any
        );
      }

      setLoading(false);
    };
    if (user?.roleId === 3) load();
  }, [user?.roleId]);

  const setRole = async (uid: string, roleId: number) => {
    const prev = [...users];
    setUsers((list) => list.map((u) => (u.user_id === uid ? { ...u, role_id: roleId } : u)));
    const { error } = await supabase.from("users").update({ role_id: roleId }).eq("user_id", uid);
    if (error) {
      alert("역할 변경에 실패했습니다.");
      setUsers(prev);
    }
  };

  // IP 기능 제거됨

  const decideJoin = async (request_id: number, status: "APPROVED" | "REJECTED") => {
    const reason = adminReason.trim();
    if (status === "REJECTED" && !reason) {
      alert("반려 사유를 입력하세요.");
      return;
    }
    const { data, error } = await supabase
      .from("org_join_requests")
      .update({ status, admin_reason: reason || null })
      .eq("request_id", request_id)
      .select("user_id, org_id")
      .single();
    if (error) {
      alert("처리에 실패했습니다.");
      return;
    }
    // 승인 시 사용자 org_id 업데이트
    if (status === "APPROVED" && data) {
      await supabase.from("users").update({ org_id: (data as any).org_id }).eq("user_id", (data as any).user_id);
    }
    // 이메일 큐(옵션) 생성
    await supabase
      .from("email_queue")
      .insert({
        user_id: (data as any)?.user_id,
        subject: status === "APPROVED" ? "소속 요청 승인" : "소속 요청 반려",
        body: status === "APPROVED" ? "소속 요청이 승인되었습니다." : `반려 사유: ${reason}`,
        type: "ORG_JOIN_DECISION",
      })
      .then(() => null)
      .catch(() => null as any);
    setJoinItems((prev) => prev.filter((i) => i.request_id !== request_id));
    setAdminReason("");
  };

  if (user?.roleId !== 3) {
    return <div className="text-center text-sm text-muted-foreground">관리자만 접근할 수 있습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>사용자 역할 관리</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">로딩 중...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>역할</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="break-all">{u.user_id}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>
                      <Select value={String(u.role_id)} onValueChange={(v) => setRole(u.user_id, Number(v))}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="4">일반</SelectItem>
                          <SelectItem value="1">선수</SelectItem>
                          <SelectItem value="2">코치</SelectItem>
                          <SelectItem value="3">관리자</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>소속 요청 승인</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {!joinSupport && (
        <div className="text-sm text-muted-foreground">
          org_join_requests 테이블이 없습니다. 아래 SQL로 생성 후 사용하세요.
          <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 p-2 border rounded">{`create table org_join_requests (
  request_id bigserial primary key,
  user_id uuid not null references users(user_id) on delete cascade,
  org_id bigint not null references organizations(org_id) on delete cascade,
  status text check (status in ('PENDING','APPROVED','REJECTED','CANCELLED')) default 'PENDING',
  reason text,
  admin_reason text,
  created_at timestamp default current_timestamp
);
create index on org_join_requests(status);
`}</pre>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Label className="mb-1">사유(반려 필수)</Label>
        <Input value={adminReason} onChange={(e) => setAdminReason(e.target.value)} className="md:col-span-2" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>사용자</TableHead>
            <TableHead>조직</TableHead>
            <TableHead>요청사유</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {joinItems.map((row) => (
            <TableRow key={row.request_id}>
              <TableCell>#{row.request_id}</TableCell>
              <TableCell>{row.user_name ?? row.user_id}</TableCell>
              <TableCell>{row.org_name ?? row.org_id}</TableCell>
              <TableCell className="max-w-[240px] truncate" title={row.reason ?? ''}>{row.reason ?? '-'}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => decideJoin(row.request_id, "APPROVED")}>
                  승인
                </Button>
                <Button variant="outline" size="sm" onClick={() => decideJoin(row.request_id, "REJECTED")}>
                  반려
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  {/* IP 접근 제어 섹션 제거됨 */}
    </div>
  );
}
