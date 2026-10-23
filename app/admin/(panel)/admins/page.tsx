import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { addAdmin, changePassword, deleteAdmin } from "../../actions";
import { Flash } from "@/components/Flash";
import { LocalTime } from "@/components/ui";

export default async function AdminsPage({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = await requireAdmin();
  const admins = await q<{ id: number; email: string; name: string; created_at: string; last_login_at: string | null }>(
    "SELECT id, email, name, created_at, last_login_at FROM admins ORDER BY id");

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black text-white">Admins</h1><p className="text-sm text-muted">People who can access this control panel.</p></div>
      <Flash msg={sp.msg} error={sp.error} />
      <div className="card overflow-x-auto">
        <table className="table min-w-[600px]">
          <thead><tr><th>Name</th><th>Email</th><th>Last login</th><th /></tr></thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td className="font-semibold text-white">{a.name}{a.id === me.id && <span className="chip chip-active ml-2">you</span>}</td>
                <td>{a.email}</td>
                <td className="text-muted">{a.last_login_at ? <LocalTime iso={a.last_login_at} mode="datetime" /> : "never"}</td>
                <td className="text-right">
                  {a.id !== me.id && <form action={deleteAdmin}><input type="hidden" name="id" value={a.id} /><button className="btn btn-danger px-3 py-1 text-xs">Remove</button></form>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={addAdmin} className="card space-y-3 p-5">
          <h2 className="font-bold text-white">Add admin</h2>
          <div><label className="label">Name</label><input name="name" className="input" /></div>
          <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
          <div><label className="label">Password (8+ characters)</label><input name="password" type="password" minLength={8} required className="input" /></div>
          <button className="btn btn-primary">Add admin</button>
        </form>
        <form action={changePassword} className="card space-y-3 p-5">
          <h2 className="font-bold text-white">Change my password</h2>
          <div><label className="label">New password</label><input name="password" type="password" minLength={8} required className="input" /></div>
          <button className="btn btn-ghost">Update password</button>
        </form>
      </div>
    </div>
  );
}
