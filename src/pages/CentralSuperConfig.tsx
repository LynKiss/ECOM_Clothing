import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LoaderCircle,
  LogOut,
  Monitor,
  MoonStar,
  Plus,
  Save,
  Shield,
  Shirt,
  SunMedium,
  Users,
  X,
} from 'lucide-react';
import { useCentralSuperSession } from '../hooks/useCentralSuperSession';
import {
  centralSuperApi,
  logoutCentralSuper,
  type Project,
  type ProjectAdmin,
  type ProjectPermission,
} from '../lib/central-super-api';
import { useTheme } from '../theme/theme-context';

type AdminPermState = {
  keys: Set<string>;
  saving: boolean;
  saved: boolean;
  error: string | null;
};

export default function CentralSuperConfigPage() {
  const { session } = useCentralSuperSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { themeMode, resolvedTheme, toggleTheme } = useTheme();

  // Project list
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Register form
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    projectId: '',
    name: '',
    baseUrl: 'http://localhost:8000',
    syncSecret: '',
  });
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Selected project detail
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [permissions, setPermissions] = useState<ProjectPermission[]>([]);
  const [admins, setAdmins] = useState<ProjectAdmin[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);
  const [adminPermStates, setAdminPermStates] = useState<Record<string, AdminPermState>>({});

  useEffect(() => {
    if (!session) return;
    loadProjects();
  }, [session]);

  function loadProjects() {
    setLoadingProjects(true);
    setProjectsError(null);
    centralSuperApi
      .listProjects()
      .then(setProjects)
      .catch((err: Error) => setProjectsError(err.message))
      .finally(() => setLoadingProjects(false));
  }

  async function openProject(project: Project) {
    setSelectedProject(project);
    setExpandedAdmin(null);
    setAdminPermStates({});
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const [perms, admsList] = await Promise.all([
        centralSuperApi.listPermissions(project.projectId),
        centralSuperApi.listAdmins(project.projectId),
      ]);
      setPermissions(perms);
      setAdmins(admsList);
      const states: Record<string, AdminPermState> = {};
      for (const adm of admsList) {
        states[adm.userId] = {
          keys: new Set(adm.permissionKeys ?? []),
          saving: false,
          saved: false,
          error: null,
        };
      }
      setAdminPermStates(states);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!registerForm.syncSecret) {
      setRegisterError('Sync Secret không được bỏ trống.');
      return;
    }
    setRegistering(true);
    setRegisterError(null);
    try {
      const created = await centralSuperApi.createProject(registerForm);
      setProjects((prev) => [...prev, created]);
      setShowRegisterForm(false);
      setRegisterForm({ projectId: '', name: '', baseUrl: 'http://localhost:8000', syncSecret: '' });
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Không thể đăng ký.');
    } finally {
      setRegistering(false);
    }
  }

  function toggleKey(userId: string, key: string) {
    setAdminPermStates((prev) => {
      const state = prev[userId];
      if (!state) return prev;
      const keys = new Set(state.keys);
      keys.has(key) ? keys.delete(key) : keys.add(key);
      return { ...prev, [userId]: { ...state, keys, saved: false, error: null } };
    });
  }

  async function savePermissions(userId: string) {
    if (!selectedProject) return;
    const state = adminPermStates[userId];
    if (!state) return;
    setAdminPermStates((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], saving: true, error: null, saved: false },
    }));
    try {
      await centralSuperApi.applyPermissions(selectedProject.projectId, userId, [...state.keys]);
      setAdminPermStates((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], saving: false, saved: true },
      }));
      setAdmins((prev) =>
        prev.map((a) =>
          a.userId === userId
            ? { ...a, hasOverride: true, permissionKeys: [...state.keys] }
            : a,
        ),
      );
    } catch (err) {
      setAdminPermStates((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          saving: false,
          error: err instanceof Error ? err.message : 'Lỗi lưu quyền',
        },
      }));
    }
  }

  async function handleLogout() {
    await logoutCentralSuper();
    navigate('/central-super/login', { replace: true });
  }

  if (!session) {
    return <Navigate to="/central-super/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="central-super-page min-h-screen bg-[#F4F7FB] text-[#0B0F19]">
      {/* Header */}
      <header className="central-super-header sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-5 py-3">
          <div className="flex items-center gap-3">
            {selectedProject ? (
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="central-super-icon-button flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] text-gray-500 transition hover:bg-[#F8FAFC]"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-white">
                <Shirt size={18} />
              </span>
            )}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#2563EB]">
                {selectedProject ? selectedProject.name : 'Central Super Admin'}
              </p>
              <p className="text-sm font-bold text-[#0B0F19]">
                {selectedProject ? `Phân quyền · ${selectedProject.projectId}` : session.user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            title={`Theme: ${themeMode}`}
            className="central-super-icon-button ml-auto flex items-center gap-2 rounded-full border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-[#F8FAFC]"
          >
            {themeMode === 'system' ? (
              <Monitor size={15} />
            ) : resolvedTheme === 'dark' ? (
              <SunMedium size={15} />
            ) : (
              <MoonStar size={15} />
            )}
            {themeMode === 'system' ? 'System' : resolvedTheme === 'dark' ? 'Toi' : 'Sang'}
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="central-super-icon-button flex items-center gap-2 rounded-full border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={15} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">

        {/* ── Project list ───────────────────────────────────────────── */}
        {!selectedProject && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-[#0B0F19]">Dự án đã đăng ký</h1>
                <p className="text-sm text-gray-500">Click vào dự án để quản lý phân quyền admin</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterForm((v) => !v)}
                className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1D4ED8]"
              >
                {showRegisterForm ? <X size={15} /> : <Plus size={15} />}
                {showRegisterForm ? 'Hủy' : 'Thêm dự án'}
              </button>
            </div>

            {/* Register form */}
            {showRegisterForm && (
              <section className="central-super-card rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-6">
                <h2 className="mb-4 text-sm font-black text-[#1D4ED8]">Đăng ký dự án mới</h2>
                {registerError ? <ErrorBox message={registerError} /> : null}
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Project ID" value={registerForm.projectId} onChange={(v) => setRegisterForm((f) => ({ ...f, projectId: v }))} placeholder="da-quanaosop" />
                    <Field label="Tên dự án" value={registerForm.name} onChange={(v) => setRegisterForm((f) => ({ ...f, name: v }))} placeholder="Quan Ao Shop" />
                    <Field label="Base URL" value={registerForm.baseUrl} onChange={(v) => setRegisterForm((f) => ({ ...f, baseUrl: v }))} placeholder="http://localhost:8000" />
                    <Field label="Sync Secret" value={registerForm.syncSecret} onChange={(v) => setRegisterForm((f) => ({ ...f, syncSecret: v }))} placeholder="Khớp với SUPER_ADMIN_SYNC_SECRET" />
                  </div>
                  <button type="submit" disabled={registering} className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#1D4ED8] disabled:opacity-60">
                    {registering ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
                    {registering ? 'Đang đăng ký...' : 'Đăng ký'}
                  </button>
                </form>
              </section>
            )}

            {/* Project cards */}
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
                <LoaderCircle size={18} className="animate-spin" />
                Đang tải...
              </div>
            ) : projectsError ? (
              <ErrorBox message={projectsError} />
            ) : projects.length === 0 ? (
              <div className="central-super-card rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center">
                <Shield size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-400">Chưa có dự án nào được đăng ký</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((p) => (
                  <button
                    key={p.projectId}
                    type="button"
                    onClick={() => void openProject(p)}
                    className="central-super-card group flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 text-left shadow-sm transition hover:border-[#93C5FD] hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DBEAFE]">
                        <Shield size={18} className="text-[#2563EB]" />
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.status === 'active' ? 'Hoạt động' : 'Tắt'}
                      </span>
                    </div>
                    <div>
                      <p className="font-black text-[#0B0F19]">{p.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{p.projectId}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <ExternalLink size={12} />
                        {p.baseUrl}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] opacity-0 transition group-hover:opacity-100">
                        Quản lý <ChevronRight size={13} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Project detail ─────────────────────────────────────────── */}
        {selectedProject && (
          <section className="central-super-card rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DBEAFE]">
                <Users size={18} className="text-[#2563EB]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#0B0F19]">Admin / Staff</h2>
                <p className="text-xs text-gray-500">Tích chọn quyền → Lưu để áp dụng ngay</p>
              </div>
            </div>

            {loadingDetail ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
                <LoaderCircle size={16} className="animate-spin" />
                Đang tải...
              </div>
            ) : detailError ? (
              <ErrorBox message={detailError} />
            ) : admins.length === 0 ? (
              <p className="py-4 text-sm text-gray-400">Chưa có admin/staff nào.</p>
            ) : (
              <div className="space-y-2">
                {admins.map((adm) => {
                  const state = adminPermStates[adm.userId];
                  const isExpanded = expandedAdmin === adm.userId;
                  return (
                    <div key={adm.userId} className="central-super-card overflow-hidden rounded-xl border border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => setExpandedAdmin(isExpanded ? null : adm.userId)}
                        className="central-super-admin-row flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#F8FAFC]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-black text-[#2563EB]">
                            {(adm.fullName ?? adm.username).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0B0F19]">{adm.fullName ?? adm.username}</p>
                            <p className="text-xs text-gray-500">
                              {adm.email} · {adm.role}
                              {adm.hasOverride ? (
                                <span className="ml-2 rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-black text-[#1D4ED8]">
                                  Override: {(adm.permissionKeys ?? []).length} quyền
                                </span>
                              ) : (
                                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                                  Theo role
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {isExpanded
                          ? <ChevronDown size={16} className="shrink-0 text-gray-400" />
                          : <ChevronRight size={16} className="shrink-0 text-gray-400" />}
                      </button>

                      {isExpanded && state && (
                        <div className="border-t border-[#E2E8F0] px-4 py-4">
                          {state.error ? <div className="mb-3"><ErrorBox message={state.error} /></div> : null}
                          {state.saved ? (
                            <div className="mb-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                              <Check size={15} />
                              Đã lưu thành công
                            </div>
                          ) : null}
                          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {permissions.map((perm) => {
                              const checked = state.keys.has(perm.permissionKey);
                              return (
                                <label key={perm.permissionKey} className={`central-super-permission-tile flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-xs transition ${checked ? 'central-super-permission-tile-selected border-[#2563EB] bg-[#EFF6FF]' : 'central-super-permission-tile-empty border-[#E2E8F0] hover:border-[#93C5FD]'}`}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleKey(adm.userId, perm.permissionKey)}
                                    className="mt-0.5 shrink-0 accent-[#2563EB]"
                                  />
                                  <span className="font-medium text-[#0B0F19]">{perm.permissionName}</span>
                                </label>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => void savePermissions(adm.userId)}
                            disabled={state.saving}
                            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
                          >
                            {state.saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                            {state.saving ? 'Đang lưu...' : 'Lưu quyền'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-[#0B0F19]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm outline-none transition focus:border-[#2563EB]"
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
