import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/modals/NewChatModal'; // Make sure this import exists

const ChatPage = () => {
  const [showNewChat, setShowNewChat] = useState(false);

  return (
    <Container fluid className="vh-100 p-0">
      <Row className="h-100 g-0">
        <Col md={4} lg={4} xl={3} className="h-100 border-end">
          {/* Pass the prop correctly */}
          <ConversationList onNewChat={() => setShowNewChat(true)} />
        </Col>
        <Col md={8} lg={8} xl={9} className="h-100">
          <ChatWindow />
        </Col>
      </Row>

      {/* Add the modal */}
      <NewChatModal 
        show={showNewChat} 
        onHide={() => setShowNewChat(false)} 
      />
    </Container>
  );
};

export default ChatPage;