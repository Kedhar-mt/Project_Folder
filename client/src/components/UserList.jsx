import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
      setLoading(false);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.msg || 'Error fetching users');
      setLoading(false);
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/users/${userId}`);
      
      if (response.data.msg === 'User removed') {
        setUsers(users.filter(user => user._id !== userId));
        setError(''); // Clear any existing errors
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.msg || 'Error deleting user. Please try again.');
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to delete users');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role
    });
    setError(''); // Clear any existing errors
  };

  const handleUpdate = async (userId) => {
    try {
      const response = await api.put(`/api/users/${userId}`, formData);
      setUsers(users.map(user => 
        user._id === userId ? response.data : user
      ));
      setEditingUser(null);
      setError(''); // Clear any existing errors
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.msg || 'Error updating user');
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBack = () => {
    navigate('/admin');
  };

  return (
    <div>
      <div>
        <h2>User Management</h2>
        <button 
          onClick={handleBack}
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div>
          {error}
        </div>
      )}

      {loading ? (
        <div>
          <div>Loading...</div>
        </div>
      ) : (
        <div>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      {editingUser === user._id ? (
                        <input 
                          type="text" 
                          name="username" 
                          value={formData.username} 
                          onChange={handleChange}
                        />
                      ) : (user.username)}
                    </td>
                    <td>
                      {editingUser === user._id ? (
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleChange}
                        />
                      ) : (user.email)}
                    </td>
                    <td>
                      {editingUser === user._id ? (
                        <select 
                          name="role" 
                          value={formData.role} 
                          onChange={handleChange}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (user.role)}
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {editingUser === user._id ? (
                        <div>
                          <button 
                            onClick={() => handleUpdate(user._id)}
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingUser(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button 
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(user._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserList;