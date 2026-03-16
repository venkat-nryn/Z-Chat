import React, { useEffect } from 'react';
import { ListGroup, Form, InputGroup, Button } from 'react-bootstrap';
import { BsSearch, BsPlusCircle } from 'react-icons/bs';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import ConversationItem from './ConversationItem';

const ConversationList = ({ onNewChat }) => {
  const { conversations, loadConversations, selectConversation, currentConversation } = useChat();
  const { onlineUsers } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const sortedConversations = [...conversations].sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  return (
    <div className="h-100 d-flex flex-column">
      {/* Header */}
      <div className="p-3 border-bottom bg-white">
        <h5 className="mb-0">Chats</h5>
      </div>

      {/* Search */}
      <div className="p-3">
        <InputGroup>
          <InputGroup.Text className="bg-light border-0">
            <BsSearch className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search chats"
            className="bg-light border-0"
          />
        </InputGroup>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-2">
        <Button 
          variant="outline-primary" 
          className="w-100"
          onClick={onNewChat}
        >
          <BsPlusCircle className="me-2" /> New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ListGroup variant="flush" className="flex-grow-1 overflow-auto">
        {sortedConversations.map(conversation => {
          const otherParticipant = conversation.participants.find(p => p._id !== user._id);
          const isOnline = onlineUsers.has(otherParticipant?._id);
          
          return (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              otherParticipant={otherParticipant}
              currentUserId={user._id}
              isOnline={isOnline}
              isActive={currentConversation?._id === conversation._id}
              onClick={() => selectConversation(conversation)}
            />
          );
        })}
      </ListGroup>
    </div>
  );
};

export default ConversationList;