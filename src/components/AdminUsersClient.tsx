'use client';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Mail, 
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  contributionCount: number;
  totalContributed: number;
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    role: 'all'
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.role !== 'all') params.append('role', filters.role);

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();
      
      if (result.ok) {
        setUsers(result.users);
      } else {
        setError(result.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      if (result.ok) {
        setUsers(users?.map(user => 
          user._id === userId ? { ...user, status: newStatus } : user
        ) || []);
        toast.success(`User status updated to ${newStatus}`);
        setShowActions(null);
      } else {
        toast.error(result.error || 'Failed to update user status');
      }
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      const result = await response.json();
      if (result.ok) {
        setUsers(users?.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ) || []);
        toast.success(`User role updated to ${newRole}`);
        setShowActions(null);
      } else {
        toast.error(result.error || 'Failed to update user role');
      }
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'suspended':
        return <span className="badge badge-danger">Suspended</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-purple">Admin</span>;
      case 'member':
        return <span className="badge badge-blue">Member</span>;
      default:
        return <span className="badge badge-gray">{role}</span>;
    }
  };

  if (error) {
    return (
      <div className="card p-6 border-red-200 bg-red-50 dark:bg-red-900/20 animate-fade-in">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         user.email.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || user.status === filters.status;
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    
    return matchesSearch && matchesStatus && matchesRole;
  }) || [];

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">User Filters</h3>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredUsers.length} of {users?.length || 0} users
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-modern pl-10"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="select-modern"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="select-modern"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span>User</span>
                  </div>
                </th>
                <th>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>Email</span>
                  </div>
                </th>
                <th>Role</th>
                <th>Status</th>
                <th>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Joined</span>
                  </div>
                </th>
                <th>Contributions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <td className="font-medium">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="text-center">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        ₹{user.totalContributed?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.contributionCount || 0} contributions
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="relative">
                      <button
                        onClick={() => setShowActions(showActions === user._id ? null : user._id)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                      
                      {showActions === user._id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                          <div className="py-2">
                            {/* Status Actions */}
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</div>
                              <div className="space-y-1">
                                <button
                                  onClick={() => handleStatusChange(user._id, 'active')}
                                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300 flex items-center space-x-2"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Activate</span>
                                </button>
                                <button
                                  onClick={() => handleStatusChange(user._id, 'pending')}
                                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 flex items-center space-x-2"
                                >
                                  <Clock className="h-3 w-3" />
                                  <span>Set Pending</span>
                                </button>
                                <button
                                  onClick={() => handleStatusChange(user._id, 'suspended')}
                                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 flex items-center space-x-2"
                                >
                                  <Ban className="h-3 w-3" />
                                  <span>Suspend</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* Role Actions */}
                            <div className="px-4 py-2">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Role</div>
                              <div className="space-y-1">
                                <button
                                  onClick={() => handleRoleChange(user._id, 'admin')}
                                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-300 flex items-center space-x-2"
                                >
                                  <Shield className="h-3 w-3" />
                                  <span>Make Admin</span>
                                </button>
                                <button
                                  onClick={() => handleRoleChange(user._id, 'member')}
                                  className="w-full text-left px-2 py-1 text-sm rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300 flex items-center space-x-2"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  <span>Make Member</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No Users Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.search || filters.status !== 'all' || filters.role !== 'all' 
              ? 'Try adjusting your filters to see more results.' 
              : 'No users have been registered yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
