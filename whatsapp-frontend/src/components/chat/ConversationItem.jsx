import React from 'react';
import { ListGroup, Image, Badge } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';

const ConversationItem = ({ conversation, otherParticipant, currentUserId, isOnline, isActive, onClick }) => {
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.unreadCount?.[currentUserId] || 0;

  return (
    <ListGroup.Item 
      action 
      onClick={onClick}
      active={isActive}
      className="border-0 py-3 px-3"
      style={{ cursor: 'pointer' }}
    >
      <div className="d-flex align-items-center">
        {/* Avatar */}
        <div className="position-relative">
          <Image 
            src={otherParticipant?.profilePicture || 'https://via.placeholder.com/50'} 
            roundedCircle 
            width={50} 
            height={50} 
          />
          {isOnline && (
            <div 
              className="position-absolute bottom-0 end-0 bg-success rounded-circle"
              style={{ width: '12px', height: '12px', border: '2px solid white' }}
            />
          )}
        </div>

        {/* Conversation Info */}
        <div className="ms-3 flex-grow-1 overflow-hidden">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 text-truncate">
              {conversation.isGroup ? conversation.groupName : otherParticipant?.username}
            </h6>
            {lastMessage && (
              <small className="text-muted">
                {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
              </small>
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted text-truncate" style={{ maxWidth: '70%' }}>
              {lastMessage?.content || 'No messages yet'}
            </small>
            {unreadCount > 0 && (
              <Badge bg="primary" pill>
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </ListGroup.Item>
  );
};

export default ConversationItem;