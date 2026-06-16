export function convertUnicode(input) {
    return input.replace(/\\+u([0-9a-fA-F]{4})/g, (a,b) =>
        String.fromCharCode(parseInt(b, 16)));
}

export function formatActionDate(actionDate) {
    const raw = actionDate?.datetime ?? actionDate?.formatted;
    if (!raw) return '';
    const date = new Date(raw);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${month}/${day} - ${hour12}:${minutes} ${ampm}`;
}

export function getActionBadgeColor(colors, actionType) {
    switch (actionType) {
        case 'checkout':
        case 'checkin from':
        case 'force checkin':
        case 'requested':
            return colors.primary;
        case 'create':
        case 'restore':
        case 'accepted':
        case 'add seats':
        case 'token unrevoked':
            return colors.success;
        case 'delete':
        case 'delete seats':
        case 'declined':
        case 'request canceled':
        case 'token revoked':
        case 'upload deleted':
            return colors.danger;
        case 'update':
        case 'audit':
        case 'note added':
        case '2FA reset':
        case 'merged':
        case 'uploaded':
            return colors.warning;
        default:
            return colors.textSecondary;
    }
}