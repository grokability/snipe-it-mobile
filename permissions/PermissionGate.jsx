import { usePermission } from './PermissionContext';

/**
 *
 * Renders children when the permission is ALLOWED or UNKNOWN.
 * Renders fallback when the permission is DENIED.
 *
 * <PermissionGate permission={PERMISSIONS.ASSETS_CREATE} fallback={null}>
 *   <CreateButton />
 * </PermissionGate>
 */
export const PermissionGate = ({ permission, children, fallback = null }) => {
    const { denied } = usePermission(permission);
    return denied ? fallback : children;
};
