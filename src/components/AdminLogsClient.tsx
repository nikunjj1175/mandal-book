'use client';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Shield,
  Mail,
  DollarSign
} from 'lucide-react';

interface AuditLog {
  _id: string;
  action: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

const ACTION_ICONS: { [key: string]: any } = {
  'user.login': User,
  'user.register': User,
  'user.profile_update': Edit,
  'contribution.submit': DollarSign,
  'contribution.verify': CheckCircle,
  'contribution.reject': XCircle,
  'contribution.finalize': CheckCircle,
  'admin.user_status_change': Shield,
  'admin.user_role_change': Shield,
  'admin.group_setup': Shield,
  'email.sent': Mail,
  'system.notification': Activity
};

const ACTION_COLORS: { [key: string]: string } = {
  'user.login': 'text-blue-600 dark:text-blue-400',
  'user.register': 'text-green-600 dark:text-green-400',
  'user.profile_update': 'text-purple-600 dark:text-purple-400',
  'contribution.submit': 'text-orange-600 dark:text-orange-400',
  'contribution.verify': 'text-green-600 dark:text-green-400',
  'contribution.reject': 'text-red-600 dark:text-red-400',
  'contribution.finalize': 'text-emerald-600 dark:text-emerald-400',
  'admin.user_status_change': 'text-indigo-600 dark:text-indigo-400',
  'admin.user_role_change': 'text-indigo-600 dark:text-indigo-400',
  'admin.group_setup': 'text-indigo-600 dark:text-indigo-400',
  'email.sent': 'text-cyan-600 dark:text-cyan-400',
  'system.notification': 'text-gray-600 dark:text-gray-400'
};

export default function AdminLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    startDate: '',
    endDate: '',
    read: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });
  const toast = useToast();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.action !== 'all') params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.read !== 'all') params.append('read', filters.read);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/logs?${params}`);
      const result = await response.json();
      
      if (result.ok) {
        setLogs(result.logs);
        setPagination(prev => ({ ...prev, total: result.total }));
      } else {
        setError(result.error || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const markAsRead = async (logId: string) => {
    try {
      const response = await fetch(`/api/admin/logs/${logId}/read`, {
        method: 'PATCH'
      });

      const result = await response.json();
      if (result.ok) {
        setLogs(logs?.map(log => 
          log._id === logId ? { ...log, read: true, readAt: new Date().toISOString() } : log
        ) || []);
        toast.success('Log marked as read');
      } else {
        toast.error(result.error || 'Failed to mark log as read');
      }
    } catch (err) {
      toast.error('Failed to mark log as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/logs/mark-all-read', {
        method: 'PATCH'
      });

      const result = await response.json();
      if (result.ok) {
        setLogs(logs?.map(log => ({ ...log, read: true, readAt: new Date().toISOString() })) || []);
        toast.success('All logs marked as read');
      } else {
        toast.error(result.error || 'Failed to mark all logs as read');
      }
    } catch (err) {
      toast.error('Failed to mark all logs as read');
    }
  };

  const exportLogs = () => {
    toast.info('Export functionality coming soon!');
  };

  const getActionDisplayName = (action: string) => {
    return action.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getActionIcon = (action: string) => {
    const IconComponent = ACTION_ICONS[action] || Activity;
    const colorClass = ACTION_COLORS[action] || 'text-gray-600 dark:text-gray-400';
    return <IconComponent className={`h-4 w-4 ${colorClass}`} />;
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
          <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const unreadCount = logs?.filter(log => !log.read)?.length || 0;

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Audit Log Filters</h3>
          </div>
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn-secondary flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}
            <button
              onClick={exportLogs}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-modern pl-10"
            />
          </div>
          
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="select-modern"
          >
            <option value="all">All Actions</option>
            <option value="user.login">User Login</option>
            <option value="user.register">User Register</option>
            <option value="user.profile_update">Profile Update</option>
            <option value="contribution.submit">Contribution Submit</option>
            <option value="contribution.verify">Contribution Verify</option>
            <option value="contribution.reject">Contribution Reject</option>
            <option value="contribution.finalize">Contribution Finalize</option>
            <option value="admin.user_status_change">User Status Change</option>
            <option value="admin.user_role_change">User Role Change</option>
            <option value="admin.group_setup">Group Setup</option>
            <option value="email.sent">Email Sent</option>
            <option value="system.notification">System Notification</option>
          </select>
          
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="input-modern"
            placeholder="Start Date"
          />
          
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="input-modern"
            placeholder="End Date"
          />
          
          <select
            value={filters.read}
            onChange={(e) => setFilters({ ...filters, read: e.target.value })}
            className="select-modern"
          >
            <option value="all">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span>Action</span>
                  </div>
                </th>
                <th>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>User</span>
                  </div>
                </th>
                <th>Details</th>
                <th>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Timestamp</span>
                  </div>
                </th>
                <th>IP Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((log) => (
                <tr key={log._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                  !log.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}>
                  <td>
                    <div className="flex items-center space-x-3">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {getActionDisplayName(log.action)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {log.action}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {log.userId ? (
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {log.userId.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {log.userId.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">System</span>
                    )}
                  </td>
                  <td className="max-w-xs">
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate" title={log.details}>
                      {log.details}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {log.ipAddress || '-'}
                  </td>
                  <td>
                    {log.read ? (
                      <span className="badge badge-success">Read</span>
                    ) : (
                      <span className="badge badge-warning">Unread</span>
                    )}
                  </td>
                  <td>
                    {!log.read && (
                      <button
                        onClick={() => markAsRead(log._id)}
                        className="btn-secondary text-xs py-2 px-3 flex items-center space-x-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Mark Read</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === totalPages}
                className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!logs || logs.length === 0) && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No Audit Logs Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.search || filters.action !== 'all' || filters.startDate || filters.endDate || filters.read !== 'all'
              ? 'Try adjusting your filters to see more results.' 
              : 'No audit logs have been generated yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
