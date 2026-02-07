/**
 * RBAC (Role-Based Access Control) Utility
 * Session 11: Permission system implementation
 */

// Role hierarchy (higher = more permissions)
const ROLE_HIERARCHY = {
  admin: 3,
  supervisor: 2,
  operator: 1
};

// Permission definitions
const PERMISSIONS = {
  // Batches
  batches: {
    view: ['admin', 'supervisor', 'operator'],
    create: ['admin', 'supervisor'],
    edit: ['admin', 'supervisor'],
    delete: ['admin'],
    move_phase: ['admin', 'supervisor', 'operator'],
    record_loss: ['admin', 'supervisor', 'operator']
  },
  
  // Containers
  containers: {
    view: ['admin', 'supervisor', 'operator'],
    create: ['admin', 'supervisor'],
    edit: ['admin', 'supervisor'],
    delete: ['admin']
  },
  
  // Suppliers
  suppliers: {
    view: ['admin', 'supervisor'],
    create: ['admin', 'supervisor'],
    edit: ['admin', 'supervisor'],
    delete: ['admin']
  },
  
  // Varieties
  varieties: {
    view: ['admin', 'supervisor'],
    create: ['admin', 'supervisor'],
    edit: ['admin', 'supervisor'],
    delete: ['admin']
  },
  
  // Greenhouses
  greenhouses: {
    view: ['admin', 'supervisor'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin'],
    assign_batch: ['admin', 'supervisor']
  },
  
  // Users
  users: {
    view: ['admin'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin'],
    reset_password: ['admin']
  },
  
  // Reports
  reports: {
    view: ['admin', 'supervisor'],
    export: ['admin', 'supervisor', 'operator']
  },
  
  // Import/Export
  import: {
    view: ['admin', 'supervisor'],
    execute: ['admin', 'supervisor']
  },
  export: {
    view: ['admin', 'supervisor', 'operator'],
    execute: ['admin', 'supervisor', 'operator']
  },
  
  // Dashboard
  dashboard: {
    view: ['admin', 'supervisor', 'operator']
  }
};

/**
 * Check if user has permission for a specific action on a resource
 * @param {Object} user - User object with role property
 * @param {string} resource - Resource name (e.g., 'batches', 'users')
 * @param {string} action - Action name (e.g., 'view', 'create', 'delete')
 * @returns {boolean}
 */
export function can(user, resource, action) {
  if (!user || !user.role) return false;
  
  const resourcePermissions = PERMISSIONS[resource];
  if (!resourcePermissions) return false;
  
  const allowedRoles = resourcePermissions[action];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(user.role);
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object with role property
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export function hasRole(user, role) {
  if (!user || !user.role) return false;
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object with role property
 * @param {Array<string>} roles - Array of roles to check
 * @returns {boolean}
 */
export function hasAnyRole(user, roles) {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
}

/**
 * Check if user has at least the minimum role level
 * @param {Object} user - User object with role property
 * @param {string} minRole - Minimum role required
 * @returns {boolean}
 */
export function hasMinRole(user, minRole) {
  if (!user || !user.role) return false;
  
  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Get all permissions for a user's role
 * @param {Object} user - User object with role property
 * @returns {Object} - Object with resource keys and action arrays
 */
export function getUserPermissions(user) {
  if (!user || !user.role) return {};
  
  const userPermissions = {};
  
  for (const [resource, actions] of Object.entries(PERMISSIONS)) {
    userPermissions[resource] = {};
    for (const [action, roles] of Object.entries(actions)) {
      userPermissions[resource][action] = roles.includes(user.role);
    }
  }
  
  return userPermissions;
}

/**
 * Check if user is admin
 * @param {Object} user - User object with role property
 * @returns {boolean}
 */
export function isAdmin(user) {
  return hasRole(user, 'admin');
}

/**
 * Check if user is supervisor or higher
 * @param {Object} user - User object with role property
 * @returns {boolean}
 */
export function isSupervisorOrAbove(user) {
  return hasMinRole(user, 'supervisor');
}

export default {
  can,
  hasRole,
  hasAnyRole,
  hasMinRole,
  getUserPermissions,
  isAdmin,
  isSupervisorOrAbove,
  PERMISSIONS,
  ROLE_HIERARCHY
};
