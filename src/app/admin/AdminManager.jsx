"use client";
import React, { useState, useMemo } from "react";
import {
  UserPlus, Pencil, Trash2, X, Check, Shield, CreditCard,
  Plus, Search, ChevronDown, ChevronUp, Users, Package,
  AlertCircle, Calendar, Mail, Lock, RefreshCw
} from "lucide-react";

// ── Shared styles ─────────────────────────────────────────────────────
const input = {
  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--text)",
  outline: "none", fontFamily: "inherit",
};
const lbl = {
  fontSize: 11, color: "var(--text-d)", textTransform: "uppercase",
  letterSpacing: "0.5px", marginBottom: 5, display: "block",
};
const tag = (color, bg, bd) => ({
  display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 700,
  padding: "2px 8px", borderRadius: 4, color, background: bg,
  border: `1px solid ${bd || "transparent"}`,
});
const iconBtn = (bg, color) => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 28, height: 28, borderRadius: 6, border: "none",
  background: bg, color, cursor: "pointer", flexShrink: 0,
});

// ── Modal wrapper ─────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, width = 480 }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: width, width: "95%" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: "var(--text-d)", marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ ...iconBtn("transparent", "var(--text-d)"), marginLeft: 12 }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <div>
      <label style={lbl}>
        {icon && <span style={{ marginRight: 4, verticalAlign: "middle" }}>{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Save button ───────────────────────────────────────────────────────
function SaveBtn({ loading, label, disabled }) {
  return (
    <button type="submit" disabled={loading || disabled}
      style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, background: "var(--accent)", color: "#fff", cursor: loading || disabled ? "default" : "pointer", opacity: loading || disabled ? 0.6 : 1, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {loading ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : label}
    </button>
  );
}

// ── Subscription status helper ────────────────────────────────────────
function subStatus(user) {
  const sub = user.subscriptions?.[0];
  if (!sub) return { label: "No Sub", color: "var(--text-d)", bg: "var(--bg3)", bd: "var(--border)", sub: null, active: false };
  const active = sub.status === "ACTIVE" && new Date(sub.endDate) > new Date();
  const expired = sub.status === "ACTIVE" && !active;
  return {
    label: active ? "Active" : expired ? "Expired" : sub.status,
    color: active ? "var(--green)" : expired ? "var(--amber)" : "var(--text-d)",
    bg: active ? "var(--green-bg)" : expired ? "var(--amber-bg)" : "var(--bg3)",
    bd: active ? "var(--green-bd)" : expired ? "var(--amber-bd)" : "var(--border)",
    sub, active,
  };
}

// ─────────────────────────────────────────────────────────────────────
export default function AdminManager({ users: initUsers, plans: initPlans }) {
  const [users, setUsers] = useState(initUsers);
  const [plans, setPlans] = useState(initPlans);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSub, setFilterSub] = useState("all"); // all | active | none
  const [activeTab, setActiveTab] = useState("users"); // users | plans
  const [expandedUser, setExpandedUser] = useState(null);

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };
  const close = () => setModal(null);
  const api = async (url, method, body) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return { ok: res.ok, data };
  };

  // ── Filtered users ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.email.toLowerCase().includes(search.toLowerCase());
      const st = subStatus(u);
      const matchSub = filterSub === "all" || (filterSub === "active" && st.active) || (filterSub === "none" && !st.active);
      return matchSearch && matchSub;
    });
  }, [users, search, filterSub]);

  // ── Stats ────────────────────────────────────────────────────────
  const activeCount = users.filter(u => subStatus(u).active).length;
  const adminCount = users.filter(u => u.role === "ADMIN").length;

  // ── User CRUD ────────────────────────────────────────────────────
  const [userForm, setUserForm] = useState({ email: "", password: "", role: "USER" });

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const isEdit = modal?.type === "editUser";
    const url = isEdit ? `/api/admin/users/${modal.data.id}` : "/api/admin/users";
    const body = isEdit
      ? { action: "updateUser", email: userForm.email, role: userForm.role, ...(userForm.password ? { password: userForm.password } : {}) }
      : { email: userForm.email, password: userForm.password, role: userForm.role };
    const { ok, data } = await api(url, isEdit ? "PATCH" : "POST", body);
    setLoading(false);
    if (!ok) { flash(data.error || "Failed", false); return; }
    if (isEdit) {
      setUsers(u => u.map(u2 => u2.id === modal.data.id ? { ...u2, email: data.user.email, role: data.user.role } : u2));
      flash("User updated.");
    } else {
      setUsers(u => [{ ...data.user, subscriptions: [] }, ...u]);
      flash("User created.");
    }
    close();
  };

  const deleteUser = async (userId, email) => {
    if (!confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    const { ok, data } = await api(`/api/admin/users/${userId}`, "DELETE");
    if (!ok) { flash(data.error || "Failed", false); return; }
    setUsers(u => u.filter(u2 => u2.id !== userId));
    flash("User deleted.");
  };

  const toggleRole = async (user) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const { ok } = await api(`/api/admin/users/${user.id}`, "PATCH", { action: "setRole", role: newRole });
    if (ok) { setUsers(u => u.map(u2 => u2.id === user.id ? { ...u2, role: newRole } : u2)); flash(`Role → ${newRole}`); }
  };

  // ── Subscription ─────────────────────────────────────────────────
  const [subForm, setSubForm] = useState({ planId: "", durationDays: "30" });

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { ok, data } = await api(`/api/admin/users/${modal.data.id}`, "PATCH", {
      action: "assignSubscription",
      planId: subForm.planId,
      durationDays: parseInt(subForm.durationDays),
    });
    setLoading(false);
    if (!ok) { flash(data.error || "Failed", false); return; }
    setUsers(u => u.map(u2 => u2.id === modal.data.id
      ? { ...u2, subscriptions: [data.subscription, ...u2.subscriptions.filter(s => s.status !== "ACTIVE")] }
      : u2
    ));
    flash("Subscription assigned!");
    close();
  };

  const cancelSub = async (subId, userId) => {
    if (!confirm("Cancel this subscription?")) return;
    const { ok } = await api(`/api/admin/subscriptions/${subId}`, "PATCH", { status: "CANCELLED" });
    if (ok) {
      setUsers(u => u.map(u2 => u2.id === userId
        ? { ...u2, subscriptions: u2.subscriptions.map(s => s.id === subId ? { ...s, status: "CANCELLED" } : s) }
        : u2
      ));
      flash("Subscription cancelled.");
    }
  };

  // ── Plans CRUD ────────────────────────────────────────────────────
  const [planForm, setPlanForm] = useState({ name: "", durationDiv: "MONTH", price: "", description: "" });

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const isEdit = modal?.type === "editPlan";
    const url = isEdit ? `/api/admin/plans/${modal.data.id}` : "/api/admin/plans";
    const { ok, data } = await api(url, isEdit ? "PATCH" : "POST", planForm);
    setLoading(false);
    if (!ok) { flash(data.error || "Failed", false); return; }
    if (isEdit) setPlans(p => p.map(pl => pl.id === modal.data.id ? data.plan : pl));
    else setPlans(p => [...p, data.plan]);
    flash(isEdit ? "Plan updated." : "Plan created.");
    close();
  };

  const deletePlan = async (planId) => {
    if (!confirm("Delete this plan?")) return;
    const { ok } = await api(`/api/admin/plans/${planId}`, "DELETE");
    if (ok) { setPlans(p => p.filter(pl => pl.id !== planId)); flash("Plan deleted."); }
  };

  // ── Render ────────────────────────────────────────────────────────
  const tabStyle = (id) => ({
    padding: "8px 18px", borderRadius: 7, fontSize: 12, fontWeight: 600,
    border: "none", cursor: "pointer", transition: "all 0.15s",
    background: activeTab === id ? "var(--accent)" : "transparent",
    color: activeTab === id ? "#fff" : "var(--text-d)",
  });

  return (
    <>
      {/* ── Toast ── */}
      {msg && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", background: msg.ok ? "var(--green-bg)" : "var(--red-bg)", border: `1px solid ${msg.ok ? "var(--green-bd)" : "var(--red-bd)"}`, color: msg.ok ? "var(--green)" : "var(--red)" }}>
          {msg.ok ? <Check size={14} /> : <AlertCircle size={14} />} {msg.text}
        </div>
      )}

      <div style={{ background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 20, overflow: "hidden" }}>

        {/* ── Header bar ── */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: 9, padding: 3 }}>
            <button style={tabStyle("users")} onClick={() => setActiveTab("users")}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={13} /> Users ({users.length})</span>
            </button>
            <button style={tabStyle("plans")} onClick={() => setActiveTab("plans")}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Package size={13} /> Plans ({plans.length})</span>
            </button>
          </div>

          {/* Stats chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={tag("var(--green)", "var(--green-bg)", "var(--green-bd)")}>{activeCount} active subs</span>
            <span style={tag("var(--amber)", "var(--amber-bg)", "var(--amber-bd)")}>{adminCount} admins</span>
          </div>

          {/* Action button */}
          {activeTab === "users" ? (
            <button onClick={() => { setUserForm({ email: "", password: "", role: "USER" }); setModal({ type: "newUser" }); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}>
              <UserPlus size={13} /> Add User
            </button>
          ) : (
            <button onClick={() => { setPlanForm({ name: "", durationDiv: "MONTH", price: "", description: "" }); setModal({ type: "newPlan" }); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "var(--green)", color: "#fff", border: "none", cursor: "pointer" }}>
              <Plus size={13} /> New Plan
            </button>
          )}
        </div>

        {/* ── Users tab ── */}
        {activeTab === "users" && (
          <>
            {/* Search + filter row */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-d)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email…"
                  style={{ ...input, paddingLeft: 30, height: 36, fontSize: 12 }} />
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[["all", "All"], ["active", "Active Sub"], ["none", "No Sub"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilterSub(val)}
                    style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "1px solid var(--border)", cursor: "pointer", background: filterSub === val ? "var(--bg4)" : "transparent", color: filterSub === val ? "var(--text)" : "var(--text-d)" }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Users table */}
            <div style={{ overflowX: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-d)", fontSize: 13 }}>No users match your search.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["User", "Role", "Subscription", "Joined", "Actions"].map(h => (
                        <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--text-d)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(user => {
                      const st = subStatus(user);
                      const isExpanded = expandedUser === user.id;
                      return (
                        <React.Fragment key={user.id}>
                          <tr style={{ borderBottom: "1px solid var(--border)", background: isExpanded ? "var(--bg3)" : "transparent", transition: "background 0.15s" }}>
                            {/* User */}
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: 600, color: "var(--text)" }}>{user.email}</div>
                              <div style={{ fontSize: 10, color: "var(--text-d)", marginTop: 1 }}>ID: {user.id.slice(0, 8)}…</div>
                            </td>
                            {/* Role */}
                            <td style={{ padding: "12px 16px" }}>
                              <span style={tag(user.role === "ADMIN" ? "var(--amber)" : "var(--blue)", user.role === "ADMIN" ? "var(--amber-bg)" : "var(--blue-bg)", user.role === "ADMIN" ? "var(--amber-bd)" : "var(--blue-bd)")}>
                                {user.role}
                              </span>
                            </td>
                            {/* Subscription */}
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={tag(st.color, st.bg, st.bd)}>{st.label}</span>
                                {st.sub && <span style={{ fontSize: 10, color: "var(--text-d)" }}>{st.sub.plan?.name}</span>}
                              </div>
                              {st.active && st.sub?.endDate && (
                                <div style={{ fontSize: 10, color: "var(--text-d)", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                  <Calendar size={9} /> expires {new Date(st.sub.endDate).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            {/* Joined */}
                            <td style={{ padding: "12px 16px", color: "var(--text-d)", whiteSpace: "nowrap" }}>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            {/* Actions */}
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <button title="Edit user" onClick={() => { setUserForm({ email: user.email, password: "", role: user.role }); setModal({ type: "editUser", data: user }); }}
                                  style={iconBtn("var(--blue-bg)", "var(--blue)")}><Pencil size={12} /></button>
                                <button title="Assign subscription" onClick={() => { setSubForm({ planId: plans[0]?.id || "", durationDays: "30" }); setModal({ type: "assignSub", data: user }); }}
                                  style={iconBtn("var(--purple-bg)", "var(--accent)")}><CreditCard size={12} /></button>
                                <button title={user.role === "ADMIN" ? "Demote to User" : "Promote to Admin"} onClick={() => toggleRole(user)}
                                  style={iconBtn("var(--amber-bg)", "var(--amber)")}><Shield size={12} /></button>
                                <button title="Delete user" onClick={() => deleteUser(user.id, user.email)}
                                  style={iconBtn("var(--red-bg)", "var(--red)")}><Trash2 size={12} /></button>
                                <button title={isExpanded ? "Collapse" : "Expand history"} onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                  style={iconBtn("var(--bg4)", "var(--text-m)")}>
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded row — subscription history */}
                          {isExpanded && (
                            <tr key={`${user.id}-exp`} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td colSpan={5} style={{ padding: "0 16px 12px 16px", background: "var(--bg3)" }}>
                                <div style={{ fontSize: 10, color: "var(--text-d)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "10px 0 6px" }}>Subscription History</div>
                                {user.subscriptions?.length === 0 ? (
                                  <div style={{ fontSize: 12, color: "var(--text-d)" }}>No subscriptions.</div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {user.subscriptions.map(sub => {
                                      const isAct = sub.status === "ACTIVE" && new Date(sub.endDate) > new Date();
                                      return (
                                        <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "var(--bg2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                                          <span style={tag(isAct ? "var(--green)" : "var(--text-d)", isAct ? "var(--green-bg)" : "var(--bg3)", isAct ? "var(--green-bd)" : "var(--border)")}>{sub.status}</span>
                                          <span style={{ fontSize: 11, fontWeight: 600 }}>{sub.plan?.name || "—"}</span>
                                          <span style={{ fontSize: 10, color: "var(--text-d)" }}>
                                            {new Date(sub.startDate).toLocaleDateString()} → {new Date(sub.endDate).toLocaleDateString()}
                                          </span>
                                          {isAct && (
                                            <button onClick={() => cancelSub(sub.id, user.id)}
                                              style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, border: "none", background: "var(--red-bg)", color: "var(--red)", cursor: "pointer" }}>
                                              Cancel
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── Plans tab ── */}
        {activeTab === "plans" && (
          <div style={{ padding: 20 }}>
            {plans.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-d)", fontSize: 13 }}>No plans yet. Create one to get started.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {plans.map(plan => (
                  <div key={plan.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{plan.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-d)", marginTop: 2 }}>{plan.durationDiv}</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}>KES {Number(plan.price).toLocaleString()}</div>
                    </div>
                    {plan.description && <div style={{ fontSize: 12, color: "var(--text-m)", marginBottom: 12, lineHeight: 1.5 }}>{plan.description}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button onClick={() => { setPlanForm({ name: plan.name, durationDiv: plan.durationDiv, price: String(plan.price), description: plan.description || "" }); setModal({ type: "editPlan", data: plan }); }}
                        style={{ flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "1px solid var(--border)", background: "var(--blue-bg)", color: "var(--blue)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => deletePlan(plan.id)}
                        style={{ flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "1px solid var(--border)", background: "var(--red-bg)", color: "var(--red)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── New / Edit User Modal ── */}
      {(modal?.type === "newUser" || modal?.type === "editUser") && (
        <Modal
          title={modal.type === "editUser" ? "Edit User" : "Add New User"}
          subtitle={modal.type === "editUser" ? modal.data.email : "Create a new account"}
          onClose={close}
        >
          <form onSubmit={handleUserSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Email address" icon={<Mail size={10} />}>
              <input type="email" required value={userForm.email}
                onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                style={input} placeholder="user@example.com" />
            </Field>
            <Field label={modal.type === "editUser" ? "New password (leave blank to keep current)" : "Password"} icon={<Lock size={10} />}>
              <input type="password" required={modal.type === "newUser"} value={userForm.password}
                onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                style={input} placeholder={modal.type === "editUser" ? "Leave blank to keep unchanged" : "Min 8 characters"} />
            </Field>
            <Field label="Role" icon={<Shield size={10} />}>
              <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} style={input}>
                <option value="USER">User — Standard access</option>
                <option value="ADMIN">Admin — Full access</option>
              </select>
            </Field>
            <SaveBtn loading={loading} label={modal.type === "editUser" ? "Save Changes" : "Create User"}
              disabled={!userForm.email || (modal.type === "newUser" && !userForm.password)} />
          </form>
        </Modal>
      )}

      {/* ── Assign Subscription Modal ── */}
      {modal?.type === "assignSub" && (
        <Modal title="Assign Subscription" subtitle={modal.data.email} onClose={close}>
          <form onSubmit={handleSubSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {plans.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-d)", fontSize: 13 }}>
                No plans exist yet. Create a plan first.
              </div>
            ) : (
              <>
                <Field label="Select plan" icon={<Package size={10} />}>
                  <select value={subForm.planId} onChange={e => setSubForm(f => ({ ...f, planId: e.target.value }))} style={input}>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — KES {Number(p.price).toLocaleString()} / {p.durationDiv}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Duration" icon={<Calendar size={10} />}>
                  <select value={subForm.durationDays} onChange={e => setSubForm(f => ({ ...f, durationDays: e.target.value }))} style={input}>
                    {[["1", "1 day"], ["7", "7 days — Weekly"], ["14", "14 days — Fortnightly"], ["30", "30 days — Monthly"], ["60", "60 days"], ["90", "90 days — Quarterly"], ["180", "180 days — Semi-annual"], ["365", "365 days — Annual"]].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>
                <div style={{ padding: "10px 12px", background: "var(--blue-bg)", border: "1px solid var(--blue-bd)", borderRadius: 8, fontSize: 12, color: "var(--text-m)" }}>
                  Subscription starts today and expires in <strong style={{ color: "var(--text)" }}>{subForm.durationDays} days</strong>. Any existing active subscription will be replaced.
                </div>
                <SaveBtn loading={loading} label="Assign Subscription" disabled={!subForm.planId} />
              </>
            )}
          </form>
        </Modal>
      )}

      {/* ── New / Edit Plan Modal ── */}
      {(modal?.type === "newPlan" || modal?.type === "editPlan") && (
        <Modal title={modal.type === "editPlan" ? "Edit Plan" : "New Plan"} onClose={close}>
          <form onSubmit={handlePlanSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Plan name">
              <input required value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
                style={input} placeholder="e.g. Monthly Elite" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Billing cycle">
                <select value={planForm.durationDiv} onChange={e => setPlanForm(f => ({ ...f, durationDiv: e.target.value }))} style={input}>
                  <option value="DAY">Daily</option>
                  <option value="WEEK">Weekly</option>
                  <option value="MONTH">Monthly</option>
                  <option value="YEAR">Yearly</option>
                </select>
              </Field>
              <Field label="Price (KES)">
                <input required type="number" min="0" value={planForm.price}
                  onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))}
                  style={input} placeholder="e.g. 8000" />
              </Field>
            </div>
            <Field label="Description (optional)">
              <input value={planForm.description} onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))}
                style={input} placeholder="Short description shown to users" />
            </Field>
            <SaveBtn loading={loading} label={modal.type === "editPlan" ? "Save Changes" : "Create Plan"}
              disabled={!planForm.name || !planForm.price} />
          </form>
        </Modal>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
