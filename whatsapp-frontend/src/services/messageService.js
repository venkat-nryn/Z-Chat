import api from './api';

export const messageService = {
  async sendMessage(data, files = []) {
    if (files.length > 0) {
      const formData = new FormData();
      formData.append('conversationId', data.conversationId);
      formData.append('content', data.content || '');
      formData.append('messageType', data.messageType || 'text');
      if (data.replyTo) formData.append('replyTo', data.replyTo);
      
      files.forEach(file => {
        formData.append('attachments', file);
      });
      
      return api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      return api.post('/messages', data);
    }
  },

  async getMessages(conversationId, page = 1, limit = 50) {
    return api.get(`/messages/conversation/${conversationId}?page=${page}&limit=${limit}`);
  },

  async markAsRead(conversationId, messageIds) {
    return api.patch(`/messages/conversation/${conversationId}/read`, { messageIds });
  },

  async markAsDelivered(conversationId, messageIds) {
    return api.patch(`/messages/conversation/${conversationId}/delivered`, { messageIds });
  },

  async deleteMessage(messageId, deleteForEveryone = false) {
    return api.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
  }
};