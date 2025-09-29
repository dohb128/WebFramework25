import type { UserRole } from './auth';

export type Permission = 
  | 'view_home'
  | 'view_facility_reservation'
  | 'view_vehicle_dispatch'
  | 'view_dashboard'
  | 'reserve_all_facilities'
  | 'reserve_public_facilities'
  | 'manage_bookings'
  | 'view_all_stats'
  | 'manage_users'
  | 'approve_reservations';

export type NavigationItem = 'home' | 'facility-reservation' | 'vehicle-dispatch' | 'dashboard';

// 역할별 권한 매트릭스
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  civilian: [
    'view_home',
    'view_facility_reservation',
    'reserve_public_facilities',
  ],
  athlete: [
    'view_home',
    'view_facility_reservation',
    'view_vehicle_dispatch',
    'reserve_all_facilities',
  ],
  coach: [
    'view_home',
    'view_facility_reservation',
    'view_vehicle_dispatch',
    'view_dashboard',
    'reserve_all_facilities',
    'manage_bookings',
  ],
  admin: [
    'view_home',
    'view_facility_reservation',
    'view_vehicle_dispatch',
    'view_dashboard',
    'reserve_all_facilities',
    'reserve_public_facilities',
    'manage_bookings',
    'view_all_stats',
    'manage_users',
    'approve_reservations',
  ],
};

// 네비게이션 항목별 필요 권한
export const NAVIGATION_PERMISSIONS: Record<NavigationItem, Permission> = {
  home: 'view_home',
  'facility-reservation': 'view_facility_reservation',
  'vehicle-dispatch': 'view_vehicle_dispatch',
  dashboard: 'view_dashboard',
};

// 역할별 한국어 라벨
export const ROLE_LABELS: Record<UserRole, string> = {
  civilian: '일반인',
  athlete: '선수',
  coach: '코치',
  admin: '관리자',
};

// 시설 타입별 접근 권한
export type FacilityType = 'training' | 'gym' | 'pool' | 'restaurant' | 'meeting' | 'accommodation';

export const FACILITY_ACCESS: Record<UserRole, FacilityType[]> = {
  civilian: ['restaurant', 'meeting'], // 일반인은 식당, 회의실만 이용 가능
  athlete: ['training', 'gym', 'pool', 'restaurant', 'accommodation'], // 선수는 숙박시설까지
  coach: ['training', 'gym', 'pool', 'restaurant', 'meeting', 'accommodation'], // 코치는 회의실까지
  admin: ['training', 'gym', 'pool', 'restaurant', 'meeting', 'accommodation'], // 관리자는 모든 시설
};