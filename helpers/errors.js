export class PermissionDeniedError extends Error {
    constructor(permissionKey, status) {
        super(`Permission denied: ${permissionKey}`);
        this.name = 'PermissionDeniedError';
        this.permissionKey = permissionKey;
        this.status = status;
    }
}
