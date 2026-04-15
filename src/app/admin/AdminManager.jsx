"use client";
import { useState } from "react";
import { UserPlus, Pencil, Trash2, X, Check, Shield, CreditCard, Plus } from "lucide-react";

const btn = (bg, color = "#fff") => ({
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "5px 11px", borderRadius: 6, fontSize: 11, fontWeight: 600,
  cursor: "pointer", border: "none", background: bg, color,
});

const inputStyle = {
  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--text)", outline: "none",
};
const labelStyle = { fontSize: 11, color: "var(--text-d)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4, display: "block" };

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{ ...btn("transparent", "var(--text-d)"), padding: 4 }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const emptyUserForm = { email: "", password: "", role: "USER" };

export default function AdminManager({ users: initUsers, plans: initPlans }) {
  const [users, setUsers] = useState(initUsers);
  const [plans, setPlans] = useState(initPlans);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: true });

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text: "", ok: true }), 3500); };
  const close = () => setModal(null);

  // ── Create / Edit user ───────────────────────────────────────────
  const [userForm, setUserForm] = useState(emptyUserForm);

  const openNewUser = () => { setUserForm(emptyUserForm); setModal({ type: "newUser" }); };
  const openEditUser = (user) => { setUserForm({ email: user.email, password: "", role: user.role }); setModal({ type: "editUser", data: user }); };

  const saveUser = async () => {
    setLoading(true);
    const isEdit = modal?.type === "editUser";
    const url = isEdit ? `/api/admin/users/${modal.data.id}` : "/api/admin/users";
    const body = isEdit
      ? { action: "updateUser", email: userForm.email, role: userForm.role, ...(userForm.password ? { password: userForm.password } : {}) }
      : { email: userForm.email, password: userForm.password, role: userForm.role };
    const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { flash(data.error, false); return; }
    if (isEdit) {
      setUsers(u => u.map(u2 => u2.id === modal.data.id ? { ...u2, email: data.user.email, role: data.user.role } : u2));
      flash("User updated.");
    } else {
      setUsers(u => [data.user, ...u]);
      flash("User created.");
    }
    close();
  };

  // ── Assign subscription ──────────────────────────────────────────
  const [subForm, setSubForm] = useState({ planId: "", durationDays: "30" });

  const assignSub = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${modal.data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assignSubscription", planId: subForm.planId, durationDays: parseInt(subForm.durationDays) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { flash(data.error, false); return; }
    setUsers(u => u.map(u2 => u2.id === modal.data.id
      ? { ...u2, subscriptions: [data.subscription, ...u2.subscriptions.filter(s => s.status !== "ACTIVE")] }
      : u2
    ));
    flash("Subscription assigned!");
    close();
  };

  // ── Change role ──────────────────────────────────────────────────
  const setRole = async (userId, role) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setRole", role }),
    });
    if (res.ok) {
      setUsers(u => u.map(u2 => u2.id === userId ? { ...u2, role } : u2));
      flash(`Role updated to ${role}`);
    }
  };

  // ── Delete user ──────────────────────────────────────────────────
  const deleteUser = async (userId, email) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { flash(data.error, false); return; }
    setUsers(u => u.filter(u2 => u2.id !== userId));
    flash("User deleted.");
  };

  // ── Cancel subscription ──────────────────────────────────────────
  const cancelSub = async (subId, userId) => {
    if (!confirm("Cancel this subscription?")) return;
    const res = await fetch(`/api/admin/subscriptions/${subId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      setUsers(u => u.map(u2 => u2.id === userId
        ? { ...u2, subscriptions: u2.subscriptions.map(s => s.id === subId ? { ...s, status: "CANCELLED" } : s) }
        : u2
      ));
      flash("Subscription cancelled.");
    }
  };

  // ── Plans ────────────────────────────────────────────────────────
  const [planForm, setPlanForm] = useState({ name: "", durationDiv: "MONTH", price: "", description: "" });

  const savePlan = async () => {
    setLoading(true);
    const isEdit = modal?.type === "editPlan";
    const url = isEdit ? `/api/admin/plans/${modal.data.id}` : "/api/admin/plans";
    const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(planForm) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { flash(data.error, false); return; }
    if (isEdit) setPlans(p => p.map(pl => pl.id === modal.data.id ? data.plan : pl));
    else setPlans(p => [...p, data.plan]);
    flash(isEdit ? "Plan updated." : "Plan created.");
    close();
  };

  const deletePlan = async (planId) => {
    if (!confirm("Delete this plan? Existing subscriptions won't be affected.")) return;
    const res = await fetch(`/api/admin/plans/${planId}`, { method: "DELETE" });
    if (res.ok) { setPlans(p => p.filter(pl => pl.id !== planId)); flash("Plan deleted."); }
  };

  const openEditPlan = (plan) => {
    setPlanForm({ name: plan.name, durationDiv: plan.durationDiv, price: String(plan.price), description: plan.description || "" });
    setModal({ type: "editPlan", data: plan });
  };

  const s = {
    row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 8 },
    tag: (color, bg) => ({ fontSize: 11, padding: "2px 7px", borderRadius: 4, fontWeight: 600, color, background: bg }),
    sectionTitle: { fontSize: 13, fontWeight: 600, color: "var(--text-m)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" },
    card: { background: "var(--bg2)", borderRadius: 12, padding: 20, border: "1px solid var(--border)" },
  };

  return (
    <>
      {/* Flash message */}
      {msg.text && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: msg.ok ? "var(--green-bg)" : "var(--red-bg)", border: `1px solid ${msg.ok ? "var(--green-bd)" : "var(--red-bd)"}`, color: msg.ok ? "var(--green)" : "var(--red)", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={14} /> {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* ── Users ── */}
        <div style={s.card}>
          <div style={s.sectionTitle}>
            <span>👥 Users ({users.length})</span>
            <button onClick={openNewUser} style={btn("var(--accent)")}><UserPlus size={11} /> Add User</button>
          </div>
          {users.map(user => {
            const sub = user.subscriptions?.[0];
            const isActive = sub?.status === "ACTIVE" && new Date(sub.endDate) > new Date();
            return (
              <div key={user.id} style={s.row}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{user.email}</div>
                  <div style={{ fontSize: 11, color: "var(--text-d)", marginBottom: 4 }}>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  {isActive ? (
                    <div style={{ fontSize: 11, color: "var(--text-m)", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <span style={s.tag("var(--green)", "var(--green-bg)")}>ACTIVE</span>
                      {sub.plan?.name} · expires {new Date(sub.endDate).toLocaleDateString()}
                      <button onClick={() => cancelSub(sub.id, user.id)} style={{ ...btn("var(--red-bg)", "var(--red)"), padding: "1px 6px", fontSize: 10 }}>Cancel</button>
                    </div>
                  ) : (
                    <span style={s.tag("var(--text-d)", "var(--bg3)")}>No subscription</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end", marginLeft: 10 }}>
                  <span style={s.tag(user.role === "ADMIN" ? "var(--amber)" : "var(--blue)", user.role === "ADMIN" ? "var(--amber-bg)" : "var(--blue-bg)")}>{user.role}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => openEditUser(user)} style={btn("var(--blue-bg)", "var(--blue)")} title="Edit User"><Pencil size={11} /></button>
                    <button onClick={() => { setSubForm({ planId: plans[0]?.id || "", durationDays: "30" }); setModal({ type: "assignSub", data: user }); }} style={btn("var(--purple-bg)", "var(--accent)")} title="Assign Subscription"><CreditCard size={11} /></button>
                    <button onClick={() => setRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")} style={btn("var(--amber-bg)", "var(--amber)")} title="Toggle Role"><Shield size={11} /></button>
                    <button onClick={() => deleteUser(user.id, user.email)} style={btn("var(--red-bg)", "var(--red)")} title="Delete User"><Trash2 size={11} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Plans ── */}
        <div style={s.card}>
          <div style={s.sectionTitle}>
            <span>📦 Plans ({plans.length})</span>
            <button onClick={() => { setPlanForm({ name: "", durationDiv: "MONTH", price: "", description: "" }); setModal({ type: "newPlan" }); }} style={btn("var(--green)")}><Plus size={11} /> New Plan</button>
          </div>
          {plans.length === 0 && <div style={{ color: "var(--text-d)", fontSize: 12 }}>No plans yet.</div>}
          {plans.map(plan => (
            <div key={plan.id} style={s.row}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{plan.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-d)", marginTop: 2 }}>{plan.durationDiv} · {plan.description || "No description"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, color: "var(--green)", fontSize: 14 }}>KES {Number(plan.price).toLocaleString()}</span>
                <button onClick={() => openEditPlan(plan)} style={btn("var(--blue-bg)", "var(--blue)")}><Pencil size={11} /></button>
                <button onClick={() => deletePlan(plan.id)} style={btn("var(--red-bg)", "var(--red)")}><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create / Edit User Modal ── */}
      {(modal?.type === "newUser" || modal?.type === "editUser") && (
        <Modal title={modal.type === "editUser" ? `Edit — ${modal.data.email}` : "Add New User"} onClose={close}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="user@example.com" required />
            </div>
            <div>
              <label style={labelStyle}>{modal.type === "editUser" ? "New Password (leave blank to keep current)" : "Password"}</label>
              <input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} style={inputStyle} placeholder={modal.type === "editUser" ? "Leave blank to keep unchanged" : "Min 8 characters"} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <button
              onClick={saveUser}
              disabled={loading || !userForm.email || (modal.type === "newUser" && !userForm.password)}
              style={{ ...btn("var(--accent)"), width: "100%", justifyContent: "center", padding: "10px 0", fontSize: 13, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Saving…" : modal.type === "editUser" ? "Save Changes" : "Create User"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Assign Subscription Modal ── */}
      {modal?.type === "assignSub" && (
        <Modal title={`Assign Subscription — ${modal.data.email}`} onClose={close}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Plan</label>
              <select value={subForm.planId} onChange={e => setSubForm(f => ({ ...f, planId: e.target.value }))} style={inputStyle}>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — KES {Number(p.price).toLocaleString()}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duration (days)</label>
              <select value={subForm.durationDays} onChange={e => setSubForm(f => ({ ...f, durationDays: e.target.value }))} style={inputStyle}>
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="365">365 days</option>
              </select>
            </div>
            <button onClick={assignSub} disabled={loading || !subForm.planId} style={{ ...btn("var(--accent)"), width: "100%", justifyContent: "center", padding: "10px 0", fontSize: 13, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving…" : "Assign Subscription"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Plan Modal (New / Edit) ── */}
      {(modal?.type === "newPlan" || modal?.type === "editPlan") && (
        <Modal title={modal.type === "editPlan" ? "Edit Plan" : "New Plan"} onClose={close}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Plan Name</label>
              <input value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Monthly Elite" />
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <select value={planForm.durationDiv} onChange={e => setPlanForm(f => ({ ...f, durationDiv: e.target.value }))} style={inputStyle}>
                <option value="DAY">Daily</option>
                <option value="WEEK">Weekly</option>
                <option value="MONTH">Monthly</option>
                <option value="YEAR">Yearly</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Price (KES)</label>
              <input type="number" value={planForm.price} onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))} style={inputStyle} placeholder="e.g. 8000" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input value={planForm.description} onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="Optional" />
            </div>
            <button onClick={savePlan} disabled={loading || !planForm.name || !planForm.price} style={{ ...btn("var(--accent)"), width: "100%", justifyContent: "center", padding: "10px 0", fontSize: 13, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving…" : modal.type === "editPlan" ? "Save Changes" : "Create Plan"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
