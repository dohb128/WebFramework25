import { useAuth } from '../contexts/AuthContext';
import type { Permission, NavigationItem, FacilityType } from '../types/permissions';
import { ROLE_PERMISSIONS, NAVIGATION_PERMISSIONS, FACILITY_ACCESS } from '../types/permissions';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role].includes(permission);
  };

  const canAccessNavigation = (navItem: NavigationItem): boolean => {
    if (!user) return false;
    const requiredPermission = NAVIGATION_PERMISSIONS[navItem];
    return hasPermission(requiredPermission);
  };

  const canAccessFacility = (facilityType: FacilityType): boolean => {
    if (!user) return false;
    return FACILITY_ACCESS[user.role].includes(facilityType);
  };

  const getAccessibleNavigationItems = (): NavigationItem[] => {
    if (!user) return [];
    
    const items: NavigationItem[] = ['home', 'facility-reservation', 'vehicle-dispatch', 'dashboard'];
    return items.filter(item => canAccessNavigation(item));
  };

  const getAccessibleFacilities = (): FacilityType[] => {
    if (!user) return [];
    return FACILITY_ACCESS[user.role];
  };

  return {
    hasPermission,
    canAccessNavigation,
    canAccessFacility,
    getAccessibleNavigationItems,
    getAccessibleFacilities,
    userRole: user?.role,
  };
}