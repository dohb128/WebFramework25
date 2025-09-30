import { useAuth } from '../contexts/useAuth';
import type { Permission, NavigationItem, FacilityType } from '../types/permissions';
import { ROLE_PERMISSIONS, NAVIGATION_PERMISSIONS, FACILITY_ACCESS } from '../types/permissions';
import type { UserRole } from '../types/auth';

const ROLE_ID_TO_ROLE: Record<number, UserRole> = {
  1: 'athlete',
  2: 'coach',
  3: 'admin',
  4: 'civilian',
};

export function usePermissions() {
  const { user } = useAuth();
  const roleKey = user ? ROLE_ID_TO_ROLE[user.roleId] ?? null : null;

  const hasPermission = (permission: Permission): boolean => {
    if (!roleKey) return false;
    return ROLE_PERMISSIONS[roleKey].includes(permission);
  };

  const canAccessNavigation = (navItem: NavigationItem): boolean => {
    if (!roleKey) return false;
    const requiredPermission = NAVIGATION_PERMISSIONS[navItem];
    return hasPermission(requiredPermission);
  };

  const canAccessFacility = (facilityType: FacilityType): boolean => {
    if (!roleKey) return false;
    return FACILITY_ACCESS[roleKey].includes(facilityType);
  };

  const getAccessibleNavigationItems = (): NavigationItem[] => {
    if (!roleKey) return [];

    const items: NavigationItem[] = ['home', 'facility-reservation', 'vehicle-dispatch', 'dashboard'];
    return items.filter(item => canAccessNavigation(item));
  };

  const getAccessibleFacilities = (): FacilityType[] => {
    if (!roleKey) return [];
    return FACILITY_ACCESS[roleKey];
  };

  return {
    hasPermission,
    canAccessNavigation,
    canAccessFacility,
    getAccessibleNavigationItems,
    getAccessibleFacilities,
    userRole: roleKey,
  };
}
