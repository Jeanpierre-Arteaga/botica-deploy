import {
  Search, Plus, Edit2, Trash2, Lock, Unlock, Shield, UserCheck, Users,
  X, Loader2, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, MapPin,
  KeyRound, Copy, RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { Segmented } from "../../components/Segmented";
import type { User, Location } from "../../lib/types";

const PER_PAGE = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Genera una contraseña aleatoria segura (12 chars, sin caracteres ambiguos).
function genPassword(len = 12): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

// ============================================================
// Helpers de presentación
// ============================================================

function roleMeta(role: User["role"]) {
  return role === "admin"
    ? { label: "Administrador", cls: "bg-violet-soft text-violet", avatar: "bg-violet", Icon: Shield }
    : { label: "Trabajador", cls: "bg-info-soft text-info", avatar: "bg-cool", Icon: UserCheck };
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "U";
}

function fmtLastLogin(v?: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ============================================================
// Página
// ============================================================

export function GestionUsuarios() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "emp">("all");
  const [sedeFilter, setSedeFilter] = useState<string>("all"); // "all" | location_id
  const [page, setPage] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const [confirm, setConfirm] = useState<null | { kind: "lock" | "delete"; user: User }>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    Promise.all([api.users.getAll(), api.locations.getAll()])
      .then(([u, locs]) => {
        if (cancelled) return;
        setUsers(u);
        setLocations(locs.filter((l) => l.is_active).sort((a, b) => a.location_id - b.location_id));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error cargando usuarios:", err);
        setLoadError("No se pudieron cargar los usuarios.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (sedeFilter !== "all" && String(u.location_id ?? "") !== sedeFilter) return false;
      if (term) {
        const hay = [u.full_name, u.user_code, `#${u.user_id}`].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [users, searchTerm, roleFilter, sedeFilter]);

  useEffect(() => { setPage(0); }, [searchTerm, roleFilter, sedeFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const stats = useMemo(() => ({
    total: users.length,
    activos: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    trabajadores: users.filter((u) => u.role === "emp").length,
  }), [users]);

  const hasFilters = searchTerm.trim() !== "" || roleFilter !== "all" || sedeFilter !== "all";

  const handleConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === "lock") {
        await api.users.update(confirm.user.user_id, { is_active: !confirm.user.is_active });
        toast.success(confirm.user.is_active ? "Acceso bloqueado." : "Acceso reactivado.");
      } else {
        await api.users.delete(confirm.user.user_id);
        toast.success(`"${confirm.user.full_name}" se eliminó (desactivó).`);
      }
      setConfirm(null);
      refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { message?: string })?.message || err.message) : "No se pudo completar la acción.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text mb-1">Gestión de Usuarios</h1>
          <p className="text-sm text-muted">Administra los accesos y permisos del personal</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Plus className="w-5 h-5" /> Nuevo Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <UserStat icon={Users} label="Total usuarios" value={stats.total} accent="var(--c-brand)" index={0} loading={isLoading} />
        <UserStat icon={UserCheck} label="Usuarios activos" value={stats.activos} accent="var(--c-success)" index={1} loading={isLoading} />
        <UserStat icon={Shield} label="Administradores" value={stats.admins} accent="var(--c-violet)" index={2} loading={isLoading} />
        <UserStat icon={UserCheck} label="Trabajadores" value={stats.trabajadores} accent="var(--c-cool)" index={3} loading={isLoading} />
      </div>

      {/* Filtros: buscador + rol + sede */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line p-3 sm:p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, acceso o código"
              className="w-full h-11 pl-11 pr-3 bg-surface border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Segmented
              ariaLabel="Rol"
              value={roleFilter}
              onChange={(v) => setRoleFilter(v as typeof roleFilter)}
              options={[{ value: "all", label: "Todos" }, { value: "admin", label: "Admins" }, { value: "emp", label: "Trabajadores" }]}
            />
            <span className="hidden sm:block w-px h-6 bg-line" />
            <Segmented
              ariaLabel="Sede"
              value={sedeFilter}
              onChange={setSedeFilter}
              options={[{ value: "all", label: "Todas" }, ...locations.map((l) => ({ value: String(l.location_id), label: l.location_name.replace(/^Botica\s+Central\s+/i, "") }))]}
            />
          </div>
        </div>
      </div>

      {/* Tabla / estados */}
      {loadError ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-12 text-center">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">No pudimos cargar los usuarios</h3>
          <p className="text-sm text-muted mb-5">{loadError}</p>
          <button onClick={refresh} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors">Reintentar</button>
        </div>
      ) : isLoading ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line overflow-hidden"><TableSkeleton /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-12 text-center">
          <Users className="w-12 h-12 text-faint mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">{hasFilters ? "Sin resultados" : "Aún no hay usuarios"}</h3>
          <p className="text-sm text-muted">{hasFilters ? "Prueba ajustando la búsqueda o los filtros." : "Crea el primer usuario del personal."}</p>
        </div>
      ) : (
        <>
          <UsersTable items={pageItems} meId={me?.id} onEdit={(u) => { setEditing(u); setModalOpen(true); }} onLock={(u) => setConfirm({ kind: "lock", user: u })} onDelete={(u) => setConfirm({ kind: "delete", user: u })} />
          <Pager page={safePage} pageCount={pageCount} perPage={PER_PAGE} total={filtered.length} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))} />
        </>
      )}

      {modalOpen && (
        <UserModal user={editing} locations={locations} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); refresh(); }} />
      )}

      {confirm && (
        <ConfirmDialog
          kind={confirm.kind}
          user={confirm.user}
          loading={busy}
          onCancel={() => (busy ? null : setConfirm(null))}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

// ============================================================
// Tabla (desktop) + tarjetas (móvil)
// ============================================================

function UsersTable({ items, meId, onEdit, onLock, onDelete }: {
  items: User[]; meId?: number; onEdit: (u: User) => void; onLock: (u: User) => void; onDelete: (u: User) => void;
}) {
  return (
    <>
      <div className="hidden md:block bg-surface rounded-2xl shadow-soft border border-line overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[18%]" /><col className="w-[24%]" /><col className="w-[13%]" /><col className="w-[13%]" />
            <col className="w-[10%]" /><col className="w-[14%]" /><col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="bg-surface-2 text-center text-[11px] font-semibold uppercase tracking-wider text-faint border-b border-line">
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Sede asignada</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Último acceso</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((u) => {
              const rm = roleMeta(u.role);
              const last = fmtLastLogin(u.last_login);
              const isSelf = meId === u.user_id;
              return (
                <tr key={u.user_id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-left">
                      {u.photo_url ? (
                        <img src={u.photo_url} alt="" className="w-10 h-10 shrink-0 rounded-full object-cover border border-line" />
                      ) : (
                        <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold ${rm.avatar}`}>{initials(u.full_name)}</span>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-text truncate">{u.full_name}</p>
                        <p className="text-xs text-muted font-mono">#{u.user_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-muted truncate" title={u.user_code}>{u.user_code}</td>
                  <td className="px-4 py-3 text-center"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 text-center"><SedeBadge name={u.location_name} role={u.role} /></td>
                  <td className="px-4 py-3 text-center"><ActiveBadge active={u.is_active} /></td>
                  <td className="px-4 py-3 text-center text-muted whitespace-nowrap text-xs">{last ?? <span className="text-faint">Nunca</span>}</td>
                  <td className="px-4 py-3">
                    <RowActions user={u} isSelf={isSelf} onEdit={onEdit} onLock={onLock} onDelete={onDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Móvil */}
      <div className="md:hidden space-y-2.5">
        {items.map((u) => {
          const rm = roleMeta(u.role);
          const last = fmtLastLogin(u.last_login);
          const isSelf = meId === u.user_id;
          return (
            <div key={u.user_id} className="bg-surface rounded-2xl shadow-soft border border-line p-4">
              <div className="flex items-start gap-3">
                {u.photo_url ? (
                  <img src={u.photo_url} alt="" className="w-11 h-11 shrink-0 rounded-full object-cover border border-line" />
                ) : (
                  <span className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white font-bold ${rm.avatar}`}>{initials(u.full_name)}</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text truncate">{u.full_name}</p>
                      <p className="text-xs text-muted truncate">{u.user_code}</p>
                    </div>
                    <ActiveBadge active={u.is_active} />
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <RoleBadge role={u.role} />
                    <SedeBadge name={u.location_name} role={u.role} />
                  </div>
                  <p className="text-xs text-muted mt-2">Último acceso: {last ?? "Nunca"}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-line-2">
                <RowActions user={u} isSelf={isSelf} onEdit={onEdit} onLock={onLock} onDelete={onDelete} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RowActions({ user, isSelf, onEdit, onLock, onDelete }: {
  user: User; isSelf: boolean; onEdit: (u: User) => void; onLock: (u: User) => void; onDelete: (u: User) => void;
}) {
  const LockIcon = user.is_active ? Lock : Unlock;
  return (
    <div className="flex items-center justify-center gap-1">
      <button onClick={() => onEdit(user)} aria-label={`Editar ${user.full_name}`} title="Editar" className="p-2 hover:bg-info-soft rounded-lg transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info">
        <Edit2 className="w-4 h-4 text-muted group-hover:text-info" />
      </button>
      <button onClick={() => onLock(user)} disabled={isSelf} aria-label={user.is_active ? `Bloquear acceso de ${user.full_name}` : `Reactivar acceso de ${user.full_name}`} title={isSelf ? "No puedes bloquear tu propia cuenta" : user.is_active ? "Bloquear acceso" : "Reactivar acceso"} className="p-2 hover:bg-warning-soft rounded-lg transition-colors group disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning">
        <LockIcon className="w-4 h-4 text-muted group-hover:text-warning" />
      </button>
      <button onClick={() => onDelete(user)} disabled={isSelf} aria-label={`Eliminar ${user.full_name}`} title={isSelf ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"} className="p-2 hover:bg-error-soft rounded-lg transition-colors group disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error">
        <Trash2 className="w-4 h-4 text-muted group-hover:text-error" />
      </button>
    </div>
  );
}

function RoleBadge({ role }: { role: User["role"] }) {
  const rm = roleMeta(role);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${rm.cls}`}>
      <rm.Icon className="w-3 h-3" /> {rm.label}
    </span>
  );
}

function SedeBadge({ name, role }: { name?: string | null; role: User["role"] }) {
  if (!name) {
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${role === "admin" ? "bg-success-soft text-success" : "bg-line-2 text-muted"}`}>{role === "admin" ? "Ambas sedes" : "—"}</span>;
  }
  const santa = /santa/i.test(name);
  const short = name.replace(/^Botica\s+Central\s+/i, "");
  return (
    <span title={name} className={`inline-flex items-center gap-1 max-w-full px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${santa ? "bg-cool-soft text-cool" : "bg-brand-soft text-brand"}`}>
      <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{short}</span>
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${active ? "bg-success-soft text-success" : "bg-line-2 text-muted"}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" /> {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function Pager({ page, pageCount, perPage, total, onPrev, onNext }: { page: number; pageCount: number; perPage: number; total: number; onPrev: () => void; onNext: () => void }) {
  const from = total === 0 ? 0 : page * perPage + 1;
  const to = Math.min((page + 1) * perPage, total);
  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <p className="text-xs text-muted">Mostrando <span className="font-semibold text-text">{from}–{to}</span> de <span className="font-semibold text-text">{total}</span></p>
      <div className="flex items-center gap-2">
        <PagerButton label="Página anterior" disabled={page === 0} onClick={onPrev}><ChevronLeft size={18} /></PagerButton>
        <span className="text-sm font-semibold text-text tabular-nums min-w-[4.5rem] text-center">{page + 1} / {pageCount}</span>
        <PagerButton label="Página siguiente" disabled={page >= pageCount - 1} onClick={onNext}><ChevronRight size={18} /></PagerButton>
      </div>
    </div>
  );
}

function PagerButton({ children, label, disabled, onClick }: { children: React.ReactNode; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className="w-10 h-10 flex items-center justify-center rounded-xl border border-line bg-surface text-ink-2 hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{children}</button>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-line-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 rounded-full bg-line-2 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2"><div className="h-3.5 w-1/3 bg-line-2 rounded animate-pulse" /><div className="h-3 w-1/4 bg-line-2 rounded animate-pulse" /></div>
          <div className="h-6 w-24 bg-line-2 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function UserStat({ icon: Icon, label, value, accent, index, loading }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent: string; index: number; loading?: boolean }) {
  return (
    <div className="animate-panel relative overflow-hidden bg-surface rounded-2xl shadow-soft border border-line p-5 hover:shadow-card hover:-translate-y-0.5 transition-all" style={{ animationDelay: `${index * 60}ms` }}>
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ backgroundColor: accent }} />
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}>
        <Icon className="w-[22px] h-[22px]" />
      </div>
      <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      {loading ? <div className="h-7 w-10 bg-line-2 rounded animate-pulse" /> : <p className="text-[26px] lg:text-[28px] leading-none font-bold text-text tabular-nums">{value}</p>}
    </div>
  );
}

// ============================================================
// Modal Crear / Editar usuario — validación en vivo
// ============================================================

const LABEL = "block text-sm font-semibold mb-1.5 text-text";
const fieldCls = (err: boolean) =>
  `w-full px-4 py-2.5 bg-page border rounded-xl text-sm text-text focus:outline-none focus:ring-2 transition-colors ${err ? "border-error focus:ring-error/30 focus:border-error" : "border-line focus:ring-brand/30 focus:border-brand"}`;

function ErrText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 flex items-center gap-1 text-xs font-medium text-error"><AlertCircle className="w-3 h-3 shrink-0" /> {msg}</p>;
}

type FieldKey = "full_name" | "user_code" | "sede" | "password";

function UserModal({ user, locations, onClose, onSaved }: { user: User | null; locations: Location[]; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!user;
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [userCode, setUserCode] = useState(user?.user_code ?? "");
  const [role, setRole] = useState<User["role"]>(user?.role ?? "emp");
  const [locationId, setLocationId] = useState<number | null>(user?.location_id ?? null);
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  // Edición: contraseña nueva generada (se persiste al guardar). "" = sin cambio.
  const [genPwd, setGenPwd] = useState("");

  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  const touch = (k: FieldKey) => setTouched((t) => new Set(t).add(k));

  useEffect(() => {
    firstRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [saving, onClose]);

  // Si cambia a Administrador, por defecto "Ambas sedes" (location null).
  const onRoleChange = (r: User["role"]) => { setRole(r); if (r === "admin") setLocationId(null); };

  // El acceso (user_code) se valida como email. Excepción: en edición, si NO se
  // cambió respecto al original (códigos heredados tipo ADMIN01), no se exige.
  const codeUnchangedLegacy = isEdit && userCode.trim() === (user?.user_code ?? "");

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!fullName.trim()) e.full_name = "El nombre completo es obligatorio.";
    if (!userCode.trim()) e.user_code = "El email/acceso es obligatorio.";
    else if (!codeUnchangedLegacy && !EMAIL_RE.test(userCode.trim())) e.user_code = "Ingresa un email válido (ej. nombre@boticas.pe).";
    if (role === "emp" && locationId == null) e.sede = "Asigna una sede al trabajador.";
    if (!isEdit && password.length < 8) e.password = "Mínimo 8 caracteres.";
    return e;
  }, [fullName, userCode, codeUnchangedLegacy, role, locationId, password, isEdit]);

  const isValid = Object.keys(errors).length === 0;
  const showErr = (k: FieldKey) => ((submitAttempted || touched.has(k)) ? errors[k] : undefined);

  const submit = async () => {
    setSubmitAttempted(true);
    if (saving || !isValid) return;
    setSaving(true);
    try {
      if (isEdit && user) {
        await api.users.update(user.user_id, {
          user_code: userCode.trim(),
          full_name: fullName.trim(),
          location_id: locationId,
          is_active: isActive,
        });
        if (role !== user.role) await api.users.updateRole(user.user_id, role);
        if (genPwd) await api.users.updatePassword(user.user_id, genPwd);
        toast.success(genPwd ? "Usuario actualizado y nueva contraseña guardada." : "Usuario actualizado.");
      } else {
        await api.users.create({
          user_code: userCode.trim(),
          user_password: password,
          full_name: fullName.trim(),
          role,
          location_id: locationId,
        });
        toast.success("Usuario creado.");
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { message?: string })?.message || err.message) : "No se pudo guardar el usuario.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={isEdit ? "Editar usuario" : "Nuevo usuario"} className="bg-surface rounded-2xl shadow-pop border border-line w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0"><UserCheck className="w-5 h-5" /></span>
            <h2 className="text-lg font-bold text-text">{isEdit ? "Editar usuario" : "Nuevo usuario"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 text-muted hover:bg-page rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className={LABEL} htmlFor="uf-name">Nombre completo *</label>
            <input ref={firstRef} id="uf-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={() => touch("full_name")} className={fieldCls(!!showErr("full_name"))} placeholder="Ej: Ana Torres" />
            <ErrText msg={showErr("full_name")} />
          </div>
          <div>
            <label className={LABEL} htmlFor="uf-code">Email corporativo (acceso) *</label>
            <input id="uf-code" type="email" value={userCode} onChange={(e) => setUserCode(e.target.value)} onBlur={() => touch("user_code")} className={fieldCls(!!showErr("user_code"))} placeholder="usuario@boticascentral.pe" autoComplete="off" />
            {showErr("user_code") ? <ErrText msg={showErr("user_code")} /> : <p className="mt-1 text-xs text-muted">Con este correo inicia sesión el usuario.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="uf-role">Rol *</label>
              <select id="uf-role" value={role} onChange={(e) => onRoleChange(e.target.value as User["role"])} className={fieldCls(false)}>
                <option value="emp">Trabajador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="uf-sede">Sede {role === "emp" ? "*" : ""}</label>
              <select id="uf-sede" value={locationId ?? ""} onChange={(e) => setLocationId(e.target.value === "" ? null : Number(e.target.value))} onBlur={() => touch("sede")} className={fieldCls(!!showErr("sede"))}>
                <option value="">Ambas sedes</option>
                {locations.map((l) => <option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
              </select>
              <ErrText msg={showErr("sede")} />
            </div>
          </div>

          {!isEdit ? (
            <div>
              <label className={LABEL} htmlFor="uf-pass">Contraseña inicial *</label>
              <input id="uf-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch("password")} className={fieldCls(!!showErr("password"))} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
              <ErrText msg={showErr("password")} />
            </div>
          ) : (
            <div>
              <label className={LABEL}>Contraseña de acceso</label>
              {genPwd ? (
                <div className="rounded-xl border border-brand/30 bg-brand-soft p-3">
                  <p className="text-xs text-text font-medium mb-2">
                    Nueva contraseña — <b>reemplaza la anterior</b>. Cópiala y compártela con el usuario; no se mostrará de nuevo.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={genPwd}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 min-w-0 px-3 py-2 bg-surface border border-line rounded-lg text-sm font-mono text-text tracking-wide"
                    />
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(genPwd); toast.success("Contraseña copiada."); }} title="Copiar" aria-label="Copiar contraseña" className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-line text-muted hover:text-brand hover:border-brand transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setGenPwd(genPassword())} title="Regenerar" aria-label="Regenerar contraseña" className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-line text-muted hover:text-brand hover:border-brand transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted">Se guardará al pulsar “Guardar cambios”.</p>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => setGenPwd(genPassword())} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-page text-sm font-semibold text-text hover:border-brand hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                    <KeyRound className="w-4 h-4" /> Generar nueva contraseña
                  </button>
                  <p className="mt-1.5 text-xs text-muted">Úsalo solo para restablecer el acceso del usuario.</p>
                </>
              )}
            </div>
          )}

          <button type="button" role="switch" aria-checked={isActive} onClick={() => setIsActive((v) => !v)} className="flex items-center justify-between gap-3 w-full bg-page border border-line rounded-xl px-4 py-3 text-left hover:border-line-2 transition-colors">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-text">Usuario activo</span>
              <span className="block text-xs text-muted">Puede iniciar sesión en el sistema</span>
            </span>
            <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isActive ? "bg-brand" : "bg-line-2"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isActive ? "translate-x-5" : ""}`} />
            </span>
          </button>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <button type="button" onClick={submit} disabled={saving || !isValid} className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 bg-page text-muted border border-line py-3 rounded-xl font-semibold hover:bg-line-2 transition-colors disabled:opacity-60">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Diálogo de confirmación (bloquear / eliminar) — accesible
// ============================================================

function ConfirmDialog({ kind, user, loading, onCancel, onConfirm }: { kind: "lock" | "delete"; user: User; loading?: boolean; onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [loading, onCancel]);

  const blocking = kind === "lock" && user.is_active;
  const unblocking = kind === "lock" && !user.is_active;
  const title = kind === "delete" ? "Eliminar usuario" : blocking ? "Bloquear acceso" : "Reactivar acceso";
  const desc = kind === "delete"
    ? "El usuario se desactivará y no podrá iniciar sesión. Su historial se conserva."
    : blocking
      ? "El usuario no podrá iniciar sesión hasta que lo reactives."
      : "El usuario podrá volver a iniciar sesión.";
  const confirmLabel = kind === "delete" ? "Eliminar" : blocking ? "Bloquear" : "Reactivar";
  const danger = kind === "delete" || blocking;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}>
      <div role="alertdialog" aria-modal="true" aria-label={title} className="bg-surface rounded-2xl shadow-pop border border-line p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-3">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-error-soft text-error" : "bg-success-soft text-success"}`}>
            {kind === "delete" ? <Trash2 className="w-5 h-5" /> : blocking ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </span>
          <h2 className="text-lg font-bold text-text">{title}</h2>
        </div>
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-page border border-line">
          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold ${roleMeta(user.role).avatar}`}>{initials(user.full_name)}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text truncate">{user.full_name}</p>
            <p className="text-xs text-muted truncate">{user.user_code}</p>
          </div>
        </div>
        <p className="text-sm text-muted mb-6">{desc}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onConfirm} disabled={loading} className={`flex-1 inline-flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-semibold active:scale-[0.99] transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${danger ? "bg-error hover:bg-[color-mix(in_srgb,var(--c-error)_85%,black)] focus-visible:ring-error" : "bg-success hover:bg-[color-mix(in_srgb,var(--c-success)_85%,black)] focus-visible:ring-success"}`}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Procesando…" : confirmLabel}
          </button>
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="flex-1 bg-page text-muted border border-line py-2.5 rounded-xl font-semibold hover:bg-line-2 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
