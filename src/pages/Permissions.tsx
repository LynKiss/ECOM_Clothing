import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Save, ShieldCheck } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';
import { useToast } from '../hooks/useToast';
import { useAdminSession } from '../hooks/useAdminSession';

type Permission = {
  _id: string;
  key: string;
  name: string;
};

type Role = {
  _id: string;
  name: string;
  permissions: Permission[];
};

type RolePermissionsResponse = {
  role: string;
  permissions: Permission[];
};

export default function Permissions() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';
  const { showToast } = useToast();
  const { session } = useAdminSession();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManagePermissions =
    session?.user.permissions?.some((permission) => permission.key === 'manage_permissions') ??
    false;

  useEffect(() => {
    if (!canManagePermissions) {
      return;
    }

    let cancelled = false;

    async function loadInitialData() {
      setLoading(true);
      setError(null);

      try {
        const [rolesData, permissionsData] = await Promise.all([
          apiClient.get<Role[]>('/roles'),
          apiClient.get<Permission[]>('/permissions'),
        ]);

        if (cancelled) return;

        setRoles(rolesData);
        setPermissions(permissionsData);

        const initialRole = rolesData[0]?.name ?? 'admin';
        setSelectedRole(initialRole);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : isVietnamese
                ? 'Khong tai duoc du lieu phan quyen'
                : 'Unable to load permission data',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [canManagePermissions, isVietnamese]);

  useEffect(() => {
    if (!canManagePermissions || !selectedRole) {
      return;
    }

    let cancelled = false;

    async function loadRolePermissions() {
      try {
        const response = await apiClient.get<RolePermissionsResponse>(
          `/permissions/roles/${selectedRole}`,
        );
        if (!cancelled) {
          setSelectedPermissionIds(response.permissions.map((permission) => permission._id));
        }
      } catch (loadError) {
        if (!cancelled) {
          showToast({
            tone: 'error',
            title: isVietnamese ? 'Khong tai duoc quyen cua vai tro' : 'Unable to load role permissions',
            description: loadError instanceof Error ? loadError.message : '',
          });
        }
      }
    }

    void loadRolePermissions();

    return () => {
      cancelled = true;
    };
  }, [canManagePermissions, selectedRole, isVietnamese, showToast]);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const prefix = permission.key.split('_')[1] ?? 'general';
      const bucket = groups.get(prefix) ?? [];
      bucket.push(permission);
      groups.set(prefix, bucket);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.put(`/permissions/roles/${selectedRole}`, {
        permissionIds: selectedPermissionIds,
      });
      showToast({
        tone: 'success',
        title: isVietnamese ? 'Da cap nhat phan quyen' : 'Permissions updated',
      });
    } catch (saveError) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Cap nhat phan quyen that bai' : 'Failed to update permissions',
        description: saveError instanceof Error ? saveError.message : '',
      });
    } finally {
      setSaving(false);
    }
  }

  if (!canManagePermissions) {
    return (
      <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <h1 className="text-2xl font-black">
          {isVietnamese ? 'Khong du quyen truy cap' : 'Access denied'}
        </h1>
        <p className="mt-2 text-sm">
          {isVietnamese
            ? 'Tai khoan hien tai khong co quyen manage_permissions de vao trang phan quyen.'
            : 'The current account does not have manage_permissions access.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">
            {isVietnamese ? 'Nghiep vu phan quyen' : 'Permission operations'}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {isVietnamese
              ? 'Gan quyen truy cap cho tung vai tro quan tri va nhan vien theo module nghiep vu.'
              : 'Assign role access by business module for admin and staff users.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white disabled:opacity-60"
        >
          {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
          {isVietnamese ? 'Luu phan quyen' : 'Save permissions'}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-on-surface/8 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
              {isVietnamese ? 'Vai tro' : 'Roles'}
            </p>
            {loading ? (
              <div className="rounded-2xl bg-surface px-4 py-6 text-center text-on-surface-variant">
                <LoaderCircle size={18} className="mx-auto animate-spin" />
              </div>
            ) : (
              roles.map((role) => (
                <button
                  key={role._id}
                  type="button"
                  onClick={() => setSelectedRole(role.name)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selectedRole === role.name
                      ? 'border-primary/30 bg-primary/5 text-primary'
                      : 'border-on-surface/8 bg-surface text-on-surface'
                  }`}
                >
                  <span className="font-semibold capitalize">{role.name}</span>
                  <ShieldCheck size={16} />
                </button>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-surface px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                {isVietnamese ? 'Vai tro dang chinh' : 'Editing role'}
              </p>
              <p className="mt-2 text-lg font-black capitalize text-on-surface">{selectedRole}</p>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-surface px-4 py-10 text-center text-on-surface-variant">
                <LoaderCircle size={18} className="mx-auto animate-spin" />
              </div>
            ) : (
              groupedPermissions.map(([groupName, items]) => (
                <div key={groupName} className="rounded-[1.5rem] border border-on-surface/8 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                    {groupName}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {items.map((permission) => (
                      <label
                        key={permission._id}
                        className="flex items-start gap-3 rounded-2xl bg-surface px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissionIds.includes(permission._id)}
                          onChange={() =>
                            setSelectedPermissionIds((current) =>
                              current.includes(permission._id)
                                ? current.filter((item) => item !== permission._id)
                                : [...current, permission._id],
                            )
                          }
                          className="mt-1 h-4 w-4 accent-primary"
                        />
                        <div>
                          <p className="font-semibold text-on-surface">{permission.name}</p>
                          <p className="text-xs text-on-surface-variant">{permission.key}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
