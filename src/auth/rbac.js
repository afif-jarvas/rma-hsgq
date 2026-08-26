/**
 * src/auth/rbac.js
 * Role-Based Access Control (RBAC) System & Permissions Matrix for HSGQ RMA
 *
 * 3 Roles:
 * 1. Administrator - Full Access + User Management & Account Admin
 * 2. Engineer      - Full Operational CRUD (RMA, WA, PCBA, Unit History, Reports)
 * 3. Viewer        - Read Only (Dashboard, View Data, View Details, Export Reports)
 */

export const ROLES = {
  ADMINISTRATOR: "Administrator",
  ENGINEER: "Engineer",
  VIEWER: "Viewer",
};

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

export const PERMISSIONS = {
  // Navigation & Menus
  MENU_DASHBOARD: "menu:dashboard",
  MENU_RMA: "menu:rma",
  MENU_WA: "menu:wa",
  MENU_UNIT_HISTORY: "menu:unithistory",
  MENU_WEEKLY_REPORT: "menu:report",
  MENU_PCBA: "menu:pcba",
  MENU_SETTINGS: "menu:settings",
  MENU_USERS: "menu:users", // Admin only

  // RMA Log
  RMA_READ: "rma:read",
  RMA_CREATE: "rma:create",
  RMA_UPDATE: "rma:update",
  RMA_DELETE: "rma:delete",
  RMA_IMPORT: "rma:import",
  RMA_EXPORT: "rma:export",
  RMA_UPLOAD_PHOTO: "rma:upload_photo",

  // WhatsApp Log
  WA_READ: "wa:read",
  WA_CREATE: "wa:create",
  WA_UPDATE: "wa:update",
  WA_DELETE: "wa:delete",
  WA_IMPORT: "wa:import",
  WA_EXPORT: "wa:export",

  // PCBA Inventory
  PCBA_READ: "pcba:read",
  PCBA_CREATE: "pcba:create",
  PCBA_UPDATE: "pcba:update",
  PCBA_DELETE: "pcba:delete",
  PCBA_EXPORT: "pcba:export",

  // Master Data & Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // User Management
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_CHANGE_ROLE: "user:change_role",
  USER_TOGGLE_STATUS: "user:toggle_status",
};

/**
 * Permission Matrix Definition
 */
const ROLE_PERMISSIONS = {
  [ROLES.ADMINISTRATOR]: Object.values(PERMISSIONS),

  [ROLES.ENGINEER]: [
    // Menus
    PERMISSIONS.MENU_DASHBOARD,
    PERMISSIONS.MENU_RMA,
    PERMISSIONS.MENU_WA,
    PERMISSIONS.MENU_UNIT_HISTORY,
    PERMISSIONS.MENU_WEEKLY_REPORT,
    PERMISSIONS.MENU_PCBA,
    PERMISSIONS.MENU_SETTINGS,

    // RMA Full CRUD
    PERMISSIONS.RMA_READ,
    PERMISSIONS.RMA_CREATE,
    PERMISSIONS.RMA_UPDATE,
    PERMISSIONS.RMA_DELETE,
    PERMISSIONS.RMA_IMPORT,
    PERMISSIONS.RMA_EXPORT,
    PERMISSIONS.RMA_UPLOAD_PHOTO,

    // WhatsApp Full CRUD
    PERMISSIONS.WA_READ,
    PERMISSIONS.WA_CREATE,
    PERMISSIONS.WA_UPDATE,
    PERMISSIONS.WA_DELETE,
    PERMISSIONS.WA_IMPORT,
    PERMISSIONS.WA_EXPORT,

    // PCBA Full CRUD
    PERMISSIONS.PCBA_READ,
    PERMISSIONS.PCBA_CREATE,
    PERMISSIONS.PCBA_UPDATE,
    PERMISSIONS.PCBA_DELETE,
    PERMISSIONS.PCBA_EXPORT,

    // Settings
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
  ],

  [ROLES.VIEWER]: [
    // Read-Only Menus
    PERMISSIONS.MENU_DASHBOARD,
    PERMISSIONS.MENU_RMA,
    PERMISSIONS.MENU_WA,
    PERMISSIONS.MENU_UNIT_HISTORY,
    PERMISSIONS.MENU_WEEKLY_REPORT,
    PERMISSIONS.MENU_PCBA,
    PERMISSIONS.MENU_SETTINGS,

    // Read Only Operations
    PERMISSIONS.RMA_READ,
    PERMISSIONS.RMA_EXPORT,
    PERMISSIONS.WA_READ,
    PERMISSIONS.WA_EXPORT,
    PERMISSIONS.PCBA_READ,
    PERMISSIONS.PCBA_EXPORT,
    PERMISSIONS.SETTINGS_READ,
  ],
};

/**
 * Normalize role string
 */
export function normalizeRole(role) {
  if (!role) return ROLES.VIEWER;
  const r = String(role).trim().toLowerCase();
  if (r === "admin" || r === "administrator") return ROLES.ADMINISTRATOR;
  if (r === "engineer" || r === "teknisi") return ROLES.ENGINEER;
  if (r === "viewer" || r === "guest") return ROLES.VIEWER;
  return ROLES.VIEWER;
}

/**
 * Check if a role has a given permission
 */
export function hasPermission(role, permission) {
  const norm = normalizeRole(role);
  const perms = ROLE_PERMISSIONS[norm] || [];
  return perms.includes(permission);
}

/**
 * Check if a user profile has a given permission
 */
export function canUser(profile, permission) {
  if (!profile) return false;
  // If inactive, cannot do anything
  if (profile.status === USER_STATUS.INACTIVE || profile.status === "Inactive") {
    return false;
  }
  return hasPermission(profile.role, permission);
}

/**
 * Server-side / Data-layer Authorization Assertion
 * Throws an Error with 403 status if unauthorized
 */
export function assertAuthorized(profile, permission, actionName = "operasi ini") {
  if (!profile) {
    const err = new Error("401 Unauthorized: Sesi tidak valid atau belum login.");
    err.statusCode = 401;
    throw err;
  }

  if (profile.status === USER_STATUS.INACTIVE || profile.status === "Inactive") {
    const err = new Error("403 Forbidden: Akun Anda dinonaktifkan. Hubungi Administrator.");
    err.statusCode = 403;
    throw err;
  }

  if (!canUser(profile, permission)) {
    const err = new Error(`403 Forbidden: Anda (${profile.role || "Viewer"}) tidak memiliki izin untuk ${actionName}.`);
    err.statusCode = 403;
    throw err;
  }

  return true;
}

/**
 * Secure Password Hashing with Web Crypto API (SHA-256 with Salt)
 * For cryptographic integrity and fallback authorization verification
 */
export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const actualSalt = salt || Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const keyMaterial = enc.encode(`${password}:${actualSalt}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyMaterial);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return {
    hash: hashHex,
    salt: actualSalt,
  };
}

/**
 * Verify password against stored hash and salt
 */
export async function verifyPassword(password, storedHash, salt) {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}
