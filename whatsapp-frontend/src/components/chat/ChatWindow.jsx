import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Form, Button, Image } from 'react-bootstrap';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { BsArrowLeft, BsThreeDotsVertical, BsTelephone, BsCameraVideo } from 'react-icons/bs';

const ChatWindow = () => {
  const { currentConversation, messages, sendMessage } = useChat();
  const { onlineUsers, typingUsers, sendTypingStart, sendTypingStop } = useSocket();
  const { user } = useAuth();
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!currentConversation) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 bg-light">
        <div className="text-center text-muted">
          <h4>Welcome to Z Chat</h4>
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const otherParticipant = currentConversation.participants.find(
    p => p._id !== user._id
  );

  const isOnline = onlineUsers.has(otherParticipant?._id);
  const isTyping = typingUsers[currentConversation._id] === otherParticipant?._id;

  const handleSendMessage = async (content, files) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    const messageData = {
      conversationId: currentConversation._id,
      content,
      messageType: files?.length > 0 ? 'image' : 'text',
      replyTo: replyTo?._id,
    };

    await sendMessage(messageData, files);
    setReplyTo(null);
  };

  return (
    <div className="d-flex flex-column h-100">
      {/* Chat Header */}
      <div className="chat-header p-3 border-bottom bg-white">
        <Row className="align-items-center">
          <Col xs="auto" className="d-md-none">
            <Button variant="link" className="text-dark">
              <BsArrowLeft size={24} />
            </Button>
          </Col>
          <Col xs="auto">
            <Image 
              src={otherParticipant?.profilePicture || 'https://via.placeholder.com/40'} 
              roundedCircle 
              width={40} 
              height={40} 
            />
          </Col>
          <Col>
            <div className="fw-bold">{otherParticipant?.username}</div>
            <small className={isOnline ? 'text-success' : 'text-muted'}>
              {isTyping ? 'typing...' : (isOnline ? 'Online' : 'Offline')}
            </small>
          </Col>
          <Col xs="auto">
            <Button variant="link" className="text-dark">
              <BsTelephone size={20} />
            </Button>
          </Col>
          <Col xs="auto">
            <Button variant="link" className="text-dark">
              <BsCameraVideo size={20} />
            </Button>
          </Col>
          <Col xs="auto">
            <Button variant="link" className="text-dark">
              <BsThreeDotsVertical size={20} />
            </Button>
          </Col>
        </Row>
      </div>

      {/* Messages Area */}
      <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#e5ddd5' }}>
        <MessageList 
          messages={messages} 
          currentUser={user}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="reply-preview p-2 bg-light border-top">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-truncate">
              <small className="text-muted">Replying to {replyTo.sender.username}</small>
              <div className="text-truncate">{replyTo.content}</div>
            </div>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setReplyTo(null)}
              className="text-muted"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onTypingStart={() => sendTypingStart(currentConversation._id)}
        onTypingStop={() => sendTypingStop(currentConversation._id)}
        conversationId={currentConversation._id}
      />
    </div>
  );
};

export default ChatWindow;