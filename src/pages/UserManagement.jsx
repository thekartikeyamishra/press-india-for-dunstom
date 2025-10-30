// File: src/pages/UserManagement.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy 
} from 'firebase/firestore';
import { ROLES, ROLE_PERMISSIONS, getAssignableRoles } from '../config/constants';
import { getUserRole, checkPermission } from '../services/roleService';
import { 
  FaUser, 
  FaEdit, 
  FaTrash, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaUserShield
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (canManageUsers) {
      loadUsers();
    }
  }, [canManageUsers]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const checkAccess = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const role = await getUserRole(user.uid);
      setCurrentUserRole(role);

      const hasPermission = await checkPermission(user.uid, 'canViewUsers');
      
      if (!hasPermission) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }

      setCanManageUsers(true);
    } catch (error) {
      console.error('Error checking access:', error);
      toast.error('Failed to verify access');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const loadedUsers = [];
      querySnapshot.forEach((doc) => {
        loadedUsers.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setUsers(loadedUsers);
      setFilteredUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        (user.role || user.accountType || 'reader') === roleFilter
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const canAssign = await checkPermission(auth.currentUser.uid, 'canAssignRoles');
      
      if (!canAssign) {
        toast.error('You do not have permission to assign roles');
        return;
      }

      // Check if user can assign this specific role
      const assignableRoles = getAssignableRoles(currentUserRole);
      if (!assignableRoles.includes(newRole)) {
        toast.error('You cannot assign this role');
        return;
      }

      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        role: newRole,
        roleAssignedBy: auth.currentUser.uid,
        roleAssignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success(`Role updated to ${ROLE_PERMISSIONS[newRole].name}`);
      setShowRoleModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleVerifyUser = async (userId, verified) => {
    try {
      const canVerify = await checkPermission(auth.currentUser.uid, 'canVerifyUsers');
      
      if (!canVerify) {
        toast.error('You do not have permission to verify users');
        return;
      }

      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        verified: verified,
        verificationStatus: verified ? 'verified' : 'rejected',
        verifiedBy: auth.currentUser.uid,
        verifiedAt: verified ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      });

      toast.success(verified ? 'User verified successfully' : 'Verification revoked');
      loadUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Failed to update verification status');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const canDelete = await checkPermission(auth.currentUser.uid, 'canDeleteUsers');
      
      if (!canDelete) {
        toast.error('You do not have permission to delete users');
        return;
      }

      if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
      }

      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);

      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const roleInfo = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.reader;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 bg-${roleInfo.color}-100 text-${roleInfo.color}-800`}>
        {roleInfo.badge} {roleInfo.name}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage users, roles, and permissions
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{users.length}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary appearance-none bg-white"
              >
                <option value="all">All Roles</option>
                {Object.keys(ROLES).map((roleKey) => (
                  <option key={roleKey} value={ROLES[roleKey]}>
                    {ROLE_PERMISSIONS[ROLES[roleKey]].name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                            {(user.fullName || user.displayName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {user.fullName || user.displayName || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role || user.accountType || 'reader')}
                      </td>
                      <td className="px-6 py-4">
                        {user.verified ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            <FaCheckCircle />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                            <FaTimesCircle />
                            Not Verified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Change Role Button */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Change Role"
                          >
                            <FaUserShield size={16} />
                          </button>

                          {/* Verify/Unverify Button */}
                          <button
                            onClick={() => handleVerifyUser(user.id, !user.verified)}
                            className={`p-2 rounded-lg transition ${
                              user.verified
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.verified ? 'Revoke Verification' : 'Verify User'}
                          >
                            <FaCheckCircle size={16} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete User"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Change Role for {selectedUser.fullName || selectedUser.displayName}
              </h2>
              <p className="text-gray-600 mt-1">
                Current Role: {ROLE_PERMISSIONS[selectedUser.role || 'reader'].name}
              </p>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                {getAssignableRoles(currentUserRole).map((roleKey) => {
                  const role = ROLES[roleKey];
                  const roleInfo = ROLE_PERMISSIONS[role];
                  
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(selectedUser.id, role)}
                      className={`p-4 border-2 rounded-lg text-left transition hover:border-primary hover:shadow-md ${
                        (selectedUser.role || 'reader') === role
                          ? 'border-primary bg-primary bg-opacity-5'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{roleInfo.badge}</span>
                        <div>
                          <h3 className="font-bold text-gray-900">{roleInfo.name}</h3>
                          <p className="text-xs text-gray-500">Level {roleInfo.level}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{roleInfo.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;