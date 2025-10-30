// E:\press-india\src\components\admin\AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import toast from "react-hot-toast";

/**
 * AdminUsers - simple user management list
 * Minimal, safe, and export default so App imports work.
 */

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (err) {
      console.error("AdminUsers: load failed", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleAdmin = async (u) => {
    try {
      const newRole = u.role === "admin" ? "user" : "admin";
      await updateDoc(doc(db, "users", u.id), { role: newRole });
      setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, role: newRole } : p)));
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      console.error("toggleAdmin error", err);
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

        {loading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{u.name || "—"}</td>
                    <td className="px-4 py-3">{u.email || "—"}</td>
                    <td className="px-4 py-3">{u.role || "user"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAdmin(u)}
                        className="px-3 py-1 rounded bg-indigo-600 text-white"
                      >
                        {u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
