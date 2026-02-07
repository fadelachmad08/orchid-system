import { useAuth } from '../contexts/AuthContext';
import { can, hasRole, hasAnyRole, hasMinRole } from '../utils/rbac';

/**
 * Can component - conditionally render children based on permissions
 * Session 11: RBAC implementation
 * 
 * Usage:
 * <Can resource="batches" action="delete">
 *   <button>Delete Batch</button>
 * </Can>
 * 
 * <Can role="admin">
 *   <AdminPanel />
 * </Can>
 * 
 * <Can minRole="supervisor">
 *   <SupervisorFeatures />
 * </Can>
 */
export default function Can({ 
  resource, 
  action, 
  role, 
  anyRole, 
  minRole,
  fallback = null,
  children 
}) {
  const { user } = useAuth();

  // Check permission
  if (resource && action) {
    if (!can(user, resource, action)) {
      return fallback;
    }
  }

  // Check specific role
  if (role) {
    if (!hasRole(user, role)) {
      return fallback;
    }
  }

  // Check any of multiple roles
  if (anyRole) {
    if (!hasAnyRole(user, anyRole)) {
      return fallback;
    }
  }

  // Check minimum role level
  if (minRole) {
    if (!hasMinRole(user, minRole)) {
      return fallback;
    }
  }

  return <>{children}</>;
}
