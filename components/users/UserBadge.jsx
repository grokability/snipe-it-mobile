import { useTranslation } from "react-i18next";
import Badge from "@/components/ui/Badge";

// The badges Snipe-IT shows for a user: role (superadmin / admin, sent by newer servers only),
// VIP and Login Disabled. Renders a fragment so the caller's row lays them out.
export default function UserBadge({ user }) {
    const { t } = useTranslation();

    return (
        <>
            {user.role === 'superadmin' && <Badge type="danger">{t('general.superuser')}</Badge>}
            {user.role === 'admin' && <Badge type="warning">{t('general.admin_user')}</Badge>}
            {user.vip && <Badge type="primary">{t('admin.users.general.vip_label')}</Badge>}
            {!user.activated && <Badge type="danger">{t('general.login_disabled')}</Badge>}
        </>
    );
}
