import { useAuth } from "../../contexts/useAuth";

export function MyPage() {
  const { user } = useAuth();

  const getRoleName = (role: number | string) => {
    const roleNumber = typeof role === 'string' ? parseInt(role, 10) : role;
    switch (roleNumber) {
      case 1:
        return "선수";
      case 2:
        return "코치";
      case 3:
        return "관리자";
      case 4:
        return "일반인";
      default:
        return "알 수 없음";
    }
  };

  if (!user) {
    return (
      <div className="rounded-md border p-6 bg-white text-center">
        로그인 후 이용할 수 있습니다.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">마이페이지</h2>
        <p className="text-sm text-muted-foreground">
          내 계정 정보를 확인할 수 있습니다.
        </p>
      </header>
      <div className="rounded-lg border bg-white p-6 space-y-3">
        <p>
          <span className="font-medium text-muted-foreground">이름</span>{" "}
          {user.name}
        </p>
        <p>
          <span className="font-medium text-muted-foreground">역할</span>{" "}
          {getRoleName(user.roleId)}
        </p>
        <p className="text-sm text-muted-foreground break-all">
          User ID: {user.user_id}
        </p>
      </div>
    </section>
  );
}
