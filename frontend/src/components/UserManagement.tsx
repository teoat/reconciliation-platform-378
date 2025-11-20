import React, { useState, useEffect, memo } from 'react';
import { logger } from '@/services/logger';
import { useLoading } from '../hooks/useLoading';
import { Users } from 'lucide-react';
import { UserPlus } from 'lucide-react';
import { Edit } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { Shield } from 'lucide-react';
import { Search } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { XCircle } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { DataTable, Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageMeta } from './seo/PageMeta';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user' | 'analyst' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  last_login: string;
  created_at: string;
  permissions: string[];
}

interface UserManagementProps {
  projectId?: string;
}

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['admin', 'user', 'analyst', 'viewer']),
  permissions: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

const UserManagement: React.FC<UserManagementProps> = ({ projectId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const { loading: isLoading, withLoading } = useLoading(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchUsers = async () => {
      await withLoading(async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setUsers([
          {
            id: '1',
            email: 'admin@example.com',
            first_name: 'John',
            last_name: 'Doe',
            role: 'admin',
            status: 'active',
            last_login: '2024-01-15T10:30:00Z',
            created_at: '2024-01-01T00:00:00Z',
            permissions: ['read', 'write', 'delete', 'admin'],
          },
          {
            id: '2',
            email: 'user@example.com',
            first_name: 'Jane',
            last_name: 'Smith',
            role: 'user',
            status: 'active',
            last_login: '2024-01-14T15:45:00Z',
            created_at: '2024-01-02T00:00:00Z',
            permissions: ['read', 'write'],
          },
          {
            id: '3',
            email: 'viewer@example.com',
            first_name: 'Bob',
            last_name: 'Johnson',
            role: 'viewer',
            status: 'pending',
            last_login: '2024-01-13T09:15:00Z',
            created_at: '2024-01-03T00:00:00Z',
            permissions: ['read'],
          },
        ]);
      });
    };

    fetchUsers();
  }, [projectId, withLoading]);

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle create user
  const handleCreateUser = async (data: UserFormData) => {
    try {
      // Simulate API call
      const newUser: User = {
        id: Date.now().toString(),
        ...data,
        status: 'pending',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        permissions: data.permissions || [],
      };

      setUsers((prev) => [...prev, newUser]);
      setShowCreateModal(false);
      reset();
    } catch (error) {
      logger.error('Failed to create user:', error);
    }
  };

  // Handle edit user
  const handleEditUser = async (data: UserFormData) => {
    if (!selectedUser) return;

    try {
      // Simulate API call
      const updatedUser = {
        ...selectedUser,
        ...data,
        permissions: data.permissions || [],
      };

      setUsers((prev) => prev.map((user) => (user.id === selectedUser.id ? updatedUser : user)));
      setShowEditModal(false);
      setSelectedUser(null);
      reset();
    } catch (error) {
      logger.error('Failed to update user:', error);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Simulate API call
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      logger.error('Failed to delete user:', error);
    }
  };

  // Handle edit button click
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setValue('email', user.email);
    setValue('first_name', user.first_name);
    setValue('last_name', user.last_name);
    setValue('role', user.role);
    setValue('permissions', user.permissions);
    setShowEditModal(true);
  };

  // Handle delete button click
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Data table columns
  const userColumns: Column<User>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              {row.first_name} {row.last_name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <StatusBadge
          status={value === 'admin' ? 'success' : value === 'user' ? 'info' : 'warning'}
          variant="outline"
        >
          {value}
        </StatusBadge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge
          status={value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'error'}
        >
          {value}
        </StatusBadge>
      ),
    },
    {
      key: 'last_login',
      label: 'Last Login',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-600">{new Date(value).toLocaleDateString()}</div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-600">{new Date(value).toLocaleDateString()}</div>
      ),
    },
    {
      key: 'id' as keyof User,
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleEditClick(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteClick(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="User Management"
        description="Manage users, roles, and permissions for the reconciliation platform."
        keywords="users, management, roles, permissions, access control"
      />
      <main id="main-content" className="min-h-screen bg-gray-50 p-6" data-testid="user-management">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-2">
                  Manage users, roles, and permissions for the reconciliation platform
                </p>
              </div>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {users.filter((u) => u.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Users</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {users.filter((u) => u.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {users.filter((u) => u.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={roleFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setRoleFilter(e.target.value)
                  }
                  options={[
                    { value: '', label: 'All Roles' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'user', label: 'User' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                />
                <Select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(e.target.value)
                  }
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card>
            <div className="p-6">
              <DataTable data={filteredUsers} columns={userColumns} emptyMessage="No users found" />
            </div>
          </Card>

          {/* Create User Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              reset();
            }}
            title="Add New User"
          >
            <form onSubmit={handleSubmit(handleCreateUser)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input {...register('email')} type="email" placeholder="user@example.com" />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <Input {...register('first_name')} placeholder="John" />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <Input {...register('last_name')} placeholder="Doe" />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <Select
                    {...register('role')}
                    options={[
                      { value: 'viewer', label: 'Viewer' },
                      { value: 'user', label: 'User' },
                      { value: 'admin', label: 'Admin' },
                    ]}
                  />
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create User
                </Button>
              </div>
            </form>
          </Modal>

          {/* Edit User Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
              reset();
            }}
            title="Edit User"
          >
            <form onSubmit={handleSubmit(handleEditUser)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input {...register('email')} type="email" placeholder="user@example.com" />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <Input {...register('first_name')} placeholder="John" />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <Input {...register('last_name')} placeholder="Doe" />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <Select
                    {...register('role')}
                    options={[
                      { value: 'viewer', label: 'Viewer' },
                      { value: 'user', label: 'User' },
                      { value: 'admin', label: 'Admin' },
                    ]}
                  />
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Update User
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete User Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            title="Delete User"
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Are you sure you want to delete this user?
                  </h3>
                  <p className="text-gray-600">
                    This action cannot be undone. The user will lose access to the platform.
                  </p>
                </div>
              </div>

              {selectedUser && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="font-medium text-gray-900">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </div>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                  <div className="text-sm text-gray-500">
                    Role: {selectedUser.role} • Status: {selectedUser.status}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteUser}>
                  Delete User
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </main>
    </>
  );
};

export default memo(UserManagement);
