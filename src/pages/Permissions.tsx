import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { superApiClient } from '../lib/super-admin-api';
import { useLanguage } from '../i18n/language-context';
import { useToast } from '../hooks/useToast';
import { useAdminSession } from '../hooks/useAdminSession';
import { useSuperAdminSession } from '../hooks/useSuperAdminSession';

type Permission = {
  _id: string;
  key: string;
  name: string;
};

type PermissionUser = {
  _id: string;
  username: string;
  email: string;
  fullName?: string | null;
  role: { _id: string; name: string };
  isActive: boolean;
  isSelf?: boolean;
  permissions: Permission[];
};

type UserPermissionsResponse = {
  user: Omit<PermissionUser, 'permissions' | 'isSelf'>;
  source: 'user' | 'role';
  permissions: Permission[];
};

type PermissionApiClient = {
  get: <T>(path: string) => Promise<T>;
  put: <T>(path: string, body?: unknown) => Promise<T>;
};

const GROUP_LABELS: Record<string, { vi: string; en: string }> = {
  products: { vi: 'Sản phẩm', en: 'Products' },
  orders: { vi: 'Đơn hàng', en: 'Orders' },
  permissions: { vi: 'Phân quyền', en: 'Permissions' },
  news: { vi: 'Bài viết', en: 'News' },
  reports: { vi: 'Báo cáo', en: 'Reports' },
  users: { vi: 'Người dùng', en: 'Users' },
  general: { vi: 'Chung', en: 'General' },
  inventory: { vi: 'Kho hàng', en: 'Inventory' },
  settings: { vi: 'Cài đặt', en: 'Settings' },
  interface: { vi: 'Giao diện', en: 'Interface' },
  discounts: { vi: 'Khuyến mãi', en: 'Discounts' },
  delivery: { vi: 'Vận chuyển', en: 'Delivery' },
};

function getGroupLabel(key: string, isVietnamese: boolean): string {
  const entry = GROUP_LABELS[key];
  if (entry) return isVietnamese ? entry.vi : entry.en;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function getPermissionGroup(key: string) {
  const parts = key.split('_');
  return parts[1] ?? parts[0] ?? 'general';
}

export default function Permissions() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';
  const { showToast } = useToast();
  const { session: adminSession } = useAdminSession();
  const { session: superSession } = useSuperAdminSession();

  const isSuperAdmin = Boolean(superSession);
  const activeClient: PermissionApiClient = isSuperAdmin ? superApiClient : apiClient;
  const currentAdminPermissionIds = new Set(
    adminSession?.user.permissions?.map((permission) => permission._id).filter(Boolean) ??
      [],
  );
  const currentAdminPermissionKeys = new Set(
    adminSession?.user.permissions?.map((permission) => permission.key).filter(Boolean) ??
      [],
  );

  const canManagePermissions =
    isSuperAdmin ||
    (adminSession?.user.permissions?.some(
      (permission) => permission.key === 'manage_permissions',
    ) ??
      false);

  const [users, setUsers] = useState<PermissionUser[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [permissionSource, setPermissionSource] = useState<'user' | 'role'>('role');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedUser = users.find((user) => user._id === selectedUserId);
  const isSelfSelection = !isSuperAdmin && Boolean(selectedUser?.isSelf);

  useEffect(() => {
    if (!canManagePermissions) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadInitialData() {
      setLoading(true);
      setError(null);

      try {
        const [usersData, permissionsData] = await Promise.all([
          activeClient.get<PermissionUser[]>('/permissions/users'),
          activeClient.get<Permission[]>('/permissions'),
        ]);

        if (cancelled) return;

        setUsers(usersData);
        setPermissions(permissionsData);
        setSelectedUserId((current) => current || usersData[0]?._id || '');
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : isVietnamese
                ? 'Không tải được dữ liệu phân quyền'
                : 'Unable to load permission data',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [activeClient, canManagePermissions, isVietnamese]);

  useEffect(() => {
    if (!canManagePermissions || !selectedUserId) return;

    let cancelled = false;

    async function loadUserPermissions() {
      try {
        const response = await activeClient.get<UserPermissionsResponse>(
          `/permissions/users/${selectedUserId}`,
        );
        if (!cancelled) {
          setSelectedPermissionIds(response.permissions.map((permission) => permission._id));
          setPermissionSource(response.source);
        }
      } catch (loadError) {
        if (!cancelled) {
          showToast({
            tone: 'error',
            title: isVietnamese
              ? 'Không tải được quyền của tài khoản'
              : 'Unable to load user permissions',
            description: loadError instanceof Error ? loadError.message : '',
          });
        }
      }
    }

    void loadUserPermissions();
    return () => {
      cancelled = true;
    };
  }, [activeClient, canManagePermissions, selectedUserId, isVietnamese, showToast]);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const group = getPermissionGroup(permission.key);
      const bucket = groups.get(group) ?? [];
      bucket.push(permission);
      groups.set(group, bucket);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  function canGrant(permission: Permission) {
    if (isSuperAdmin) return true;
    return (
      currentAdminPermissionIds.has(permission._id) ||
      currentAdminPermissionKeys.has(permission.key)
    );
  }

  function togglePermission(permission: Permission) {
    if (isSelfSelection || !canGrant(permission)) return;
    setSelectedPermissionIds((current) =>
      current.includes(permission._id)
        ? current.filter((item) => item !== permission._id)
        : [...current, permission._id],
    );
  }

  function toggleGroup(items: Permission[]) {
    if (isSelfSelection) return;
    const grantableIds = items
      .filter((permission) => canGrant(permission))
      .map((permission) => permission._id);
    const allSelected = grantableIds.every((id) => selectedPermissionIds.includes(id));
    setSelectedPermissionIds((current) =>
      allSelected
        ? current.filter((id) => !grantableIds.includes(id))
        : [...new Set([...current, ...grantableIds])],
    );
  }

  async function handleSave() {
    if (!selectedUserId || isSelfSelection) return;

    setSaving(true);
    try {
      const response = await activeClient.put<UserPermissionsResponse>(
        `/permissions/users/${selectedUserId}`,
        { permissionIds: selectedPermissionIds },
      );
      setSelectedPermissionIds(response.permissions.map((permission) => permission._id));
      setPermissionSource(response.source);
      setUsers((current) =>
        current.map((user) =>
          user._id === selectedUserId
            ? { ...user, permissions: response.permissions }
            : user,
        ),
      );
      showToast({
        tone: 'success',
        title: isVietnamese ? 'Đã cập nhật phân quyền' : 'Permissions updated',
      });
    } catch (saveError) {
      showToast({
        tone: 'error',
        title: isVietnamese
          ? 'Cập nhật phân quyền thất bại'
          : 'Failed to update permissions',
        description: saveError instanceof Error ? saveError.message : '',
      });
    } finally {
      setSaving(false);
    }
  }

  if (!canManagePermissions) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-amber-800">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100">
          <ShieldCheck size={24} />
        </div>
        <h1 className="mt-4 text-2xl font-black">
          {isVietnamese ? 'Không đủ quyền truy cập' : 'Access denied'}
        </h1>
        <p className="mt-2 text-sm">
          {isVietnamese
            ? 'Tài khoản hiện tại không có quyền manage_permissions để vào trang phân quyền.'
            : 'The current account does not have manage_permissions access.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 p-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-on-surface">
            {isVietnamese ? 'Phân quyền theo tài khoản' : 'User Permissions'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            {isVietnamese
              ? 'Chọn từng admin hoặc nhân viên để cấp quyền vận hành. Admin thường không thể tự phân quyền và không thể cấp quyền vượt quá quyền đang có.'
              : 'Assign permissions to each admin or staff account. Regular admins cannot edit themselves or grant permissions they do not own.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loading || !selectedUserId || isSelfSelection}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-white shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
          {isVietnamese ? 'Lưu phân quyền' : 'Save permissions'}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isSelfSelection ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>
            {isVietnamese
              ? 'Không thể tự phân quyền cho chính mình. Hãy dùng Super Admin hoặc một admin khác có quyền phù hợp.'
              : 'You cannot edit your own permissions. Use Super Admin or another authorized admin.'}
          </span>
        </div>
      ) : null}

      <section className="rounded-xl border border-on-surface-variant/10 bg-white p-6 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
              {isVietnamese ? 'Admin / nhân viên' : 'Admins / staff'}
            </p>
            {loading ? (
              <div className="rounded-xl bg-surface px-4 py-6 text-center text-on-surface-variant">
                <LoaderCircle size={18} className="mx-auto animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-xl bg-surface px-4 py-6 text-center text-sm text-on-surface-variant">
                {isVietnamese ? 'Chưa có admin/staff' : 'No admin/staff users'}
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => setSelectedUserId(user._id)}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    selectedUserId === user._id
                      ? 'border-primary/40 bg-primary/5 text-primary'
                      : 'border-on-surface/8 bg-surface text-on-surface hover:border-primary/20'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {user.fullName || user.username}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-on-surface-variant/70">
                      {user.email}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black uppercase text-on-surface-variant">
                        {user.role.name}
                      </span>
                      {user.isSelf ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
                          {isVietnamese ? 'Chính bạn' : 'You'}
                        </span>
                      ) : null}
                      {!user.isActive ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-black text-red-700">
                          {isVietnamese ? 'Đã khóa' : 'Inactive'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <UserRoundCog
                    size={18}
                    className={
                      selectedUserId === user._id
                        ? 'text-primary'
                        : 'text-on-surface-variant/35'
                    }
                  />
                </button>
              ))
            )}
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 rounded-xl bg-primary/5 px-5 py-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                  {isVietnamese ? 'Đang chỉnh' : 'Editing'}
                </p>
                <p className="mt-1 truncate text-lg font-black text-primary">
                  {selectedUser?.fullName || selectedUser?.username || '-'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                  {isVietnamese ? 'Nguồn quyền' : 'Permission source'}
                </p>
                <p className="mt-1 text-lg font-black text-primary">
                  {permissionSource === 'user'
                    ? isVietnamese
                      ? 'Theo tài khoản'
                      : 'User override'
                    : isVietnamese
                      ? 'Theo vai trò'
                      : 'Role fallback'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                  {isVietnamese ? 'Số quyền' : 'Selected'}
                </p>
                <p className="mt-1 text-lg font-black text-primary">
                  {selectedPermissionIds.length}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl bg-surface px-4 py-10 text-center text-on-surface-variant">
                <LoaderCircle size={18} className="mx-auto animate-spin" />
              </div>
            ) : groupedPermissions.length === 0 ? (
              <div className="rounded-xl bg-surface px-4 py-10 text-center text-sm text-on-surface-variant">
                {isVietnamese
                  ? 'Chưa có quyền nào trong hệ thống'
                  : 'No permissions in the system'}
              </div>
            ) : (
              groupedPermissions.map(([groupName, items]) => {
                const grantableItems = items.filter((permission) => canGrant(permission));
                const allSelected =
                  grantableItems.length > 0 &&
                  grantableItems.every((permission) =>
                    selectedPermissionIds.includes(permission._id),
                  );

                return (
                  <div
                    key={groupName}
                    className="overflow-hidden rounded-xl border border-on-surface/8"
                  >
                    <div className="flex items-center justify-between bg-surface/70 px-5 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                        {getGroupLabel(groupName, isVietnamese)}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleGroup(items)}
                        disabled={isSelfSelection || grantableItems.length === 0}
                        className="text-[11px] font-bold text-primary/70 hover:text-primary disabled:cursor-not-allowed disabled:text-on-surface-variant/35"
                      >
                        {allSelected
                          ? isVietnamese
                            ? 'Bỏ chọn quyền có thể cấp'
                            : 'Deselect grantable'
                          : isVietnamese
                            ? 'Chọn quyền có thể cấp'
                            : 'Select grantable'}
                      </button>
                    </div>
                    <div className="grid gap-3 p-4 md:grid-cols-2">
                      {items.map((permission) => {
                        const disabled = isSelfSelection || !canGrant(permission);
                        return (
                          <label
                            key={permission._id}
                            className={`flex items-start gap-3 rounded-xl px-4 py-3 transition ${
                              disabled
                                ? 'cursor-not-allowed bg-surface/60 opacity-60'
                                : 'cursor-pointer bg-surface hover:bg-primary/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissionIds.includes(permission._id)}
                              disabled={disabled}
                              onChange={() => togglePermission(permission)}
                              className="mt-1 h-4 w-4 accent-primary"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-on-surface">
                                {permission.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-on-surface-variant/60">
                                {permission.key}
                              </p>
                              {!isSuperAdmin && !canGrant(permission) ? (
                                <p className="mt-1 text-[11px] font-bold text-amber-700">
                                  {isVietnamese
                                    ? 'Bạn không có quyền này nên không thể cấp.'
                                    : 'You do not own this permission.'}
                                </p>
                              ) : null}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
