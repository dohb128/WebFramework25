import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onShowRegister: () => void;
}

export function LoginPage({ onShowRegister }: LoginPageProps) {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    const success = await login(formData);
    if (!success) {
      setError('이메일 또는 비밀번호가 잘못되었습니다.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AuthLayout 
      title="로그인" 
      subtitle="시설 예약 시스템에 로그인하세요"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="이메일을 입력하세요"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={isLoading}
            className="bg-input-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={isLoading}
              className="bg-input-background pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={onShowRegister}
              disabled={isLoading}
            >
              회원가입
            </Button>
          </p>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-md">
          <h4 className="font-medium mb-2">시작하기</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 신규 사용자는 회원가입을 진행해주세요</p>
            <p>• 선수, 코치, 관리자 역할을 선택할 수 있습니다</p>
            <p>• 로그인 후 시설 예약 및 차량 배차 서비스를 이용하세요</p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}