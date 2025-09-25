import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '../../types/auth';
import { ROLE_LABELS } from '../../types/permissions';

interface RegisterPageProps {
  onShowLogin: () => void;
}

export function RegisterPage({ onShowLogin }: RegisterPageProps) {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: '' as UserRole | '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name || !formData.role) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    const success = await register({
      ...formData,
      role: formData.role as UserRole,
    });

    if (!success) {
      setError('회원가입에 실패했습니다. 이미 등록된 이메일일 수 있습니다.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AuthLayout 
      title="회원가입" 
      subtitle="새 계정을 만들어 시설 예약 시스템을 이용하세요"
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
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            type="text"
            placeholder="이름을 입력하세요"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={isLoading}
            className="bg-input-background"
          />
        </div>

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
          <Label htmlFor="role">역할</Label>
          <Select
            value={formData.role}
            onValueChange={(value: UserRole) => handleChange('role', value)}
            disabled={isLoading}
          >
            <SelectTrigger className="bg-input-background">
              <SelectValue placeholder="역할을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="civilian">{ROLE_LABELS.civilian}</SelectItem>
              <SelectItem value="athlete">{ROLE_LABELS.athlete}</SelectItem>
              <SelectItem value="coach">{ROLE_LABELS.coach}</SelectItem>
              <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요 (최소 6자)"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">비밀번호 확인</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              disabled={isLoading}
              className="bg-input-background pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
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
              회원가입 중...
            </>
          ) : (
            '회원가입'
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={onShowLogin}
              disabled={isLoading}
            >
              로그인
            </Button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}