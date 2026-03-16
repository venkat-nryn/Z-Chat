import React, { useState } from 'react';
import { Image, Dropdown } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';
import { BsCheck, BsCheckAll, BsThreeDotsVertical, BsReply, BsTrash } from 'react-icons/bs';

const MessageBubble = ({ message, isOwn, onReply, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);

  const getMessageStatus = () => {
    if (message.readBy?.length > 1) {
      return <BsCheckAll className="text-primary" />;
    } else if (message.deliveredTo?.length > 1) {
      return <BsCheckAll className="text-muted" />;
    } else {
      return <BsCheck className="text-muted" />;
    }
  };

  const renderContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <div>
            <Image 
              src={`http://localhost:5000/${message.attachments[0]?.filePath}`} 
              fluid 
              className="rounded"
              style={{ maxWidth: '300px', maxHeight: '300px' }}
            />
            {message.content && <div className="mt-2">{message.content}</div>}
          </div>
        );
      case 'video':
        return (
          <video controls style={{ maxWidth: '300px', maxHeight: '300px' }}>
            <source src={`http://localhost:5000/${message.attachments[0]?.filePath}`} />
          </video>
        );
      case 'audio':
        return (
          <audio controls>
            <source src={`http://localhost:5000/${message.attachments[0]?.filePath}`} />
          </audio>
        );
      default:
        return <div>{message.content}</div>;
    }
  };

  return (
    <div className={`d-flex ${isOwn ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
      <div
        className={`position-relative ${isOwn ? 'bg-primary text-white' : 'bg-white'}`}
        style={{
          maxWidth: '70%',
          padding: '8px 12px',
          borderRadius: '12px',
          borderBottomRightRadius: isOwn ? '4px' : '12px',
          borderBottomLeftRadius: isOwn ? '12px' : '4px',
        }}
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
      >
        {/* Reply indicator */}
        {message.replyTo && (
          <div className={`small p-1 mb-2 rounded ${isOwn ? 'bg-primary' : 'bg-light'}`}
               style={{ opacity: 0.8 }}>
            <small>↪ Replying to {message.replyTo.sender.username}</small>
            <div className="text-truncate">{message.replyTo.content}</div>
          </div>
        )}

        {/* Message content */}
        {renderContent()}

        {/* Message footer */}
        <div className="d-flex justify-content-end align-items-center mt-1" style={{ gap: '4px' }}>
          <small className={`${isOwn ? 'text-white-50' : 'text-muted'}`}>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </small>
          {isOwn && getMessageStatus()}
        </div>

        {/* Message options dropdown */}
        {showOptions && (
          <Dropdown className="position-absolute top-0 end-0" style={{ transform: 'translate(50%, -50%)' }}>
            <Dropdown.Toggle variant="light" size="sm" id="dropdown-basic">
              <BsThreeDotsVertical size={12} />
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => onReply(message)}>
                <BsReply className="me-2" /> Reply
              </Dropdown.Item>
              {isOwn && (
                <Dropdown.Item onClick={() => onDelete(message._id)} className="text-danger">
                  <BsTrash className="me-2" /> Delete
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;