import api from './api';

export const conversationService = {
  // Get all conversations for current user
  async getConversations() {
    const response = await api.get('/conversations');
    return response.data;
  },

  // Get single conversation by ID
  async getConversation(id) {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  // Create private conversation with another user
  async createPrivate(recipientId) {
    const response = await api.post('/conversations/private', { recipientId });
    return response.data;
  },

  // Create group conversation
  async createGroup(data) {
    const response = await api.post('/conversations/group', data);
    return response.data;
  },

  // Update group info
  async updateGroup(id, data) {
    const response = await api.patch(`/conversations/${id}/group`, data);
    return response.data;
  },

  // Add participants to group
  async addParticipants(id, participants) {
    const response = await api.post(`/conversations/${id}/participants`, { participants });
    return response.data;
  },

  // Remove participant from group
  async removeParticipant(conversationId, userId) {
    const response = await api.delete(`/conversations/${conversationId}/participants/${userId}`);
    return response.data;
  },

  // Check if conversation exists with a user
  async findExistingConversation(userId) {
    try {
      const response = await this.getConversations();
      const conversations = response.data.conversations || [];
      const existing = conversations.find(conv => 
        !conv.isGroup && conv.participants.some(p => p._id === userId)
      );
      return existing;
    } catch (error) {
      console.error('Error finding existing conversation:', error);
      return null;
    }
  }
};