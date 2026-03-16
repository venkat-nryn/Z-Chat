import React, { useState, useEffect } from 'react';
import { Container, Row, Col, ListGroup, Image, Button, Form, InputGroup, Tabs, Tab } from 'react-bootstrap';
import { userService } from '../services/userService';
import { conversationService } from '../services/conversationService';
import { BsSearch, BsPersonAdd, BsPersonCheck, BsPersonDash, BsSlashCircle } from 'react-icons/bs';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
    loadBlocked();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await userService.getContacts();
      setContacts(response.data?.contacts || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const loadBlocked = async () => {
    try {
      const response = await userService.getBlockedUsers();
      setBlocked(response.data?.blockedUsers || []);
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await userService.searchUsers(searchQuery);
      setSearchResults(response.data?.users || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (contactId) => {
    try {
      const response = await userService.addContact(contactId);
      const addedContact = response.data?.contact;

      if (!addedContact?._id) {
        return;
      }

      setContacts((previousContacts) => {
        if (previousContacts.some((contact) => contact._id === addedContact._id)) {
          return previousContacts;
        }

        return [addedContact, ...previousContacts];
      });

      setSearchResults((previousResults) =>
        previousResults.filter((user) => user._id !== contactId)
      );

      // Ensure the new contact is also available in Chats as a private conversation.
      await conversationService.createPrivate(contactId);

      setSearchQuery('');
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleRemoveContact = async (contactId) => {
    if (window.confirm('Are you sure you want to remove this contact?')) {
      try {
        await userService.removeContact(contactId);
        loadContacts();
      } catch (error) {
        console.error('Failed to remove contact:', error);
      }
    }
  };

  const handleBlockUser = async (userId) => {
    if (window.confirm('Are you sure you want to block this user?')) {
      try {
        await userService.blockUser(userId);
        loadContacts();
        loadBlocked();
      } catch (error) {
        console.error('Failed to block user:', error);
      }
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await userService.unblockUser(userId);
      loadBlocked();
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Contacts</h2>

      <Tabs defaultActiveKey="contacts" className="mb-4">
        <Tab eventKey="contacts" title="My Contacts">
          <Row>
            <Col md={4}>
              {/* Search for new contacts */}
              <div className="mb-4">
                <h5>Add New Contact</h5>
                <InputGroup className="mb-3">
                  <Form.Control
                    placeholder="Search by username or phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button variant="primary" onClick={handleSearch}>
                    <BsSearch />
                  </Button>
                </InputGroup>

                {loading && <div>Searching...</div>}

                {searchResults.length > 0 && (
                  <ListGroup className="mb-3">
                    {searchResults.map(user => (
                      <ListGroup.Item key={user._id} className="d-flex align-items-center">
                        <Image 
                          src={user.profilePicture || 'https://via.placeholder.com/40'} 
                          roundedCircle 
                          width={40} 
                          height={40} 
                          className="me-3"
                        />
                        <div className="flex-grow-1">
                          <div>{user.username}</div>
                          <small className="text-muted">{user.phoneNumber}</small>
                        </div>
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => handleAddContact(user._id)}
                        >
                          <BsPersonAdd /> Add
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            </Col>

            <Col md={8}>
              {/* Contacts list */}
              <h5>My Contacts ({contacts.length})</h5>
              {contacts.length === 0 ? (
                <p className="text-muted">No contacts yet. Search and add people to chat!</p>
              ) : (
                <ListGroup>
                  {contacts.map(contact => (
                    <ListGroup.Item key={contact._id} className="d-flex align-items-center">
                      <Image 
                        src={contact.profilePicture || 'https://via.placeholder.com/50'} 
                        roundedCircle 
                        width={50} 
                        height={50} 
                        className="me-3"
                      />
                      <div className="flex-grow-1">
                        <div className="fw-bold">{contact.username}</div>
                        <small className="text-muted">{contact.phoneNumber}</small>
                        <div>
                          <small className={contact.isOnline ? 'text-success' : 'text-muted'}>
                            {contact.isOnline ? 'Online' : 'Offline'}
                          </small>
                        </div>
                      </div>
                      <div>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          className="me-2"
                          onClick={() => handleRemoveContact(contact._id)}
                        >
                          <BsPersonDash /> Remove
                        </Button>
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          onClick={() => handleBlockUser(contact._id)}
                        >
                          <BsSlashCircle /> Block
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="blocked" title="Blocked Users">
          <h5>Blocked Users ({blocked.length})</h5>
          {blocked.length === 0 ? (
            <p className="text-muted">No blocked users.</p>
          ) : (
            <ListGroup>
              {blocked.map(user => (
                <ListGroup.Item key={user._id} className="d-flex align-items-center">
                  <Image 
                    src={user.profilePicture || 'https://via.placeholder.com/50'} 
                    roundedCircle 
                    width={50} 
                    height={50} 
                    className="me-3"
                  />
                  <div className="flex-grow-1">
                    <div className="fw-bold">{user.username}</div>
                    <small className="text-muted">{user.phoneNumber}</small>
                  </div>
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    onClick={() => handleUnblockUser(user._id)}
                  >
                    Unblock
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default ContactsPage;