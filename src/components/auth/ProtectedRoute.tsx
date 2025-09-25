import type { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../types/permissions';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, permission, fallback }: ProtectedRouteProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="container mx-auto px-6 py-8">
        <Alert className="max-w-md mx-auto border-destructive bg-destructive/10">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-destructive">
            이 페이지에 접근할 권한이 없습니다.
            <br />
            관리자에게 문의하시기 바랍니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}