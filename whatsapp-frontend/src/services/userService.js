import api from './api';

export const userService = {
  // Get current user profile
  async getProfile() {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update user profile
  async updateProfile(data) {
    const response = await api.patch('/users/update-me', data);
    return response.data;
  },

  // Upload profile picture
  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const response = await api.post('/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // SEARCH ALL USERS - THIS IS THE KEY FIX!
  async searchUsers(query) {
    const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get user by ID
  async getUserById(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get all contacts
  async getContacts() {
    const response = await api.get('/users/contacts');
    return response.data;
  },

  // Add contact
  async addContact(contactId) {
    const response = await api.post('/users/contacts', { contactId });
    return response.data;
  },

  // Remove contact
  async removeContact(contactId) {
    const response = await api.delete(`/users/contacts/${contactId}`);
    return response.data;
  },

  // Block user
  async blockUser(userId) {
    const response = await api.post(`/users/block/${userId}`);
    return response.data;
  },

  // Unblock user
  async unblockUser(userId) {
    const response = await api.delete(`/users/unblock/${userId}`);
    return response.data;
  },

  // Get blocked users
  async getBlockedUsers() {
    const response = await api.get('/users/blocked');
    return response.data;
  }
};