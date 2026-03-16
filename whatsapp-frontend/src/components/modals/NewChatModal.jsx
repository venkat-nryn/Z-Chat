import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, ListGroup, Image, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { userService } from '../../services/userService';
import { conversationService } from '../../services/conversationService';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { BsSearch, BsPerson, BsPeople, BsChatDots, BsPersonPlus, BsXCircle, BsCheck2 } from 'react-icons/bs';

const NewChatModal = ({ show, onHide }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [step, setStep] = useState('select'); // 'select' or 'group'
  const [creatingChat, setCreatingChat] = useState(false);
  
  const { selectConversation, loadConversations } = useChat();
  const { user } = useAuth();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!show) {
      resetState();
      return;
    }

    loadContacts();
  }, [show]);

  const resetState = () => {
    setSearchQuery('');
    setContacts([]);
    setSearchResults([]);
    setSelectedUsers([]);
    setGroupName('');
    setStep('select');
    setError('');
    setLoading(false);
    setCreatingChat(false);
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getContacts();
      const myContacts = response.data?.contacts || [];
      setContacts(myContacts);
      setSearchResults(myContacts);
    } catch (loadError) {
      console.error('Failed to load contacts for new chat:', loadError);
      setError(loadError.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  // SEARCH ALL USERS - This is the critical function!
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('');
      setSearchResults(contacts);
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      console.log('Searching for:', searchQuery);
      const response = await userService.searchUsers(searchQuery);
      console.log('Search response:', response);
      
      // Filter out current user
      const filteredResults = (response.data?.users || []).filter(u => u._id !== user?._id);
      setSearchResults(filteredResults);
      
      if (filteredResults.length === 0) {
        setError('No users found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.message || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Start private chat with a user
  const startPrivateChat = async (userId) => {
    setCreatingChat(true);
    setError('');
    
    try {
      console.log('Creating chat with user:', userId);
      
      // Check if conversation already exists
      const existingConv = await conversationService.findExistingConversation(userId);
      
      let conversation;
      if (existingConv) {
        console.log('Using existing conversation:', existingConv);
        conversation = existingConv;
      } else {
        // Create new conversation
        const response = await conversationService.createPrivate(userId);
        console.log('Created new conversation:', response);
        conversation = response.data?.conversation;
      }

      // Refresh conversations list
      await loadConversations();
      
      // Select the conversation
      await selectConversation(conversation);
      
      // Close modal
      onHide();
      
    } catch (error) {
      console.error('Failed to start chat:', error);
      setError(error.response?.data?.message || 'Failed to start chat');
    } finally {
      setCreatingChat(false);
    }
  };

  // Select user for group
  const selectForGroup = (user) => {
    if (!selectedUsers.some(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  // Remove user from group
  const removeFromGroup = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  // Create group chat
  const createGroupChat = async () => {
    if (selectedUsers.length < 2) {
      setError('Please select at least 2 people for a group');
      return;
    }
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    setCreatingChat(true);
    setError('');

    try {
      const participantIds = selectedUsers.map(u => u._id);
      const response = await conversationService.createGroup({
        groupName: groupName.trim(),
        participants: participantIds
      });

      await loadConversations();
      await selectConversation(response.data?.conversation);
      onHide();

    } catch (error) {
      console.error('Failed to create group:', error);
      setError(error.response?.data?.message || 'Failed to create group');
    } finally {
      setCreatingChat(false);
    }
  };

  // Render user item
  const renderUserItem = (userItem) => (
    <ListGroup.Item key={userItem._id} className="d-flex align-items-center py-3 border-0 border-bottom">
      <Image 
        src={userItem.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userItem.username)}&background=0D6EFD&color=fff&size=50`}
        roundedCircle 
        width={50} 
        height={50} 
        className="me-3"
      />
      <div className="flex-grow-1">
        <div className="fw-bold">{userItem.username}</div>
        <div className="text-muted small">{userItem.phoneNumber}</div>
        {userItem.status && (
          <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>
            {userItem.status}
          </div>
        )}
      </div>
      <div>
        {step === 'select' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => startPrivateChat(userItem._id)}
            disabled={creatingChat}
          >
            <BsChatDots className="me-1" /> Chat
          </Button>
        ) : (
          <Button
            variant={selectedUsers.some(u => u._id === userItem._id) ? 'success' : 'outline-primary'}
            size="sm"
            onClick={() => selectForGroup(userItem)}
            disabled={selectedUsers.some(u => u._id === userItem._id)}
          >
            {selectedUsers.some(u => u._id === userItem._id) ? (
              <><BsCheck2 className="me-1" /> Added</>
            ) : (
              <><BsPersonPlus className="me-1" /> Add</>
            )}
          </Button>
        )}
      </div>
    </ListGroup.Item>
  );

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          {step === 'select' ? 'Start New Chat' : 'Create Group Chat'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* Error Message */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
            {error}
          </Alert>
        )}

        {/* Step Selection Buttons */}
        {step === 'select' && (
          <div className="d-flex gap-3 mb-4">
            <Button 
              variant="outline-primary" 
              className="flex-fill p-3"
              onClick={() => setStep('group')}
            >
              <BsPeople size={24} className="mb-2 d-block mx-auto" />
              <span>New Group</span>
            </Button>
          </div>
        )}

        {/* Group Creation UI */}
        {step === 'group' && (
          <div className="mb-4">
            <Button 
              variant="link" 
              className="mb-3 p-0"
              onClick={() => setStep('select')}
            >
              ← Back to chat selection
            </Button>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <h6>Selected Participants ({selectedUsers.length})</h6>
                <div className="d-flex flex-wrap gap-2">
                  {selectedUsers.map(u => (
                    <div key={u._id} className="d-flex align-items-center bg-light rounded-pill p-2">
                      <Image 
                        src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=0D6EFD&color=fff&size=30`}
                        roundedCircle 
                        width={30} 
                        height={30} 
                        className="me-2"
                      />
                      <span className="me-2">{u.username}</span>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-danger p-0"
                        onClick={() => removeFromGroup(u._id)}
                      >
                        <BsXCircle size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group Name Input */}
            <Form.Group className="mb-4">
              <Form.Label>Group Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </Form.Group>

            {/* Create Group Button */}
            <Button
              variant="success"
              className="w-100 mb-4"
              onClick={createGroupChat}
              disabled={creatingChat || selectedUsers.length < 2 || !groupName.trim()}
            >
              {creatingChat ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Creating Group...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </div>
        )}

        {/* Search Section - Always visible */}
        <div className="mb-4">
          <h6>{step === 'group' ? 'Add More People' : 'Search for people to chat with'}</h6>
          <InputGroup className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search by username or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loading}
            />
            <Button 
              variant="primary" 
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? <Spinner size="sm" /> : <BsSearch />}
            </Button>
          </InputGroup>
        </div>

        {/* Search Results */}
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Searching for users...</p>
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <>
            <h6 className="mb-3">{searchQuery.trim() ? 'Search Results:' : 'My Contacts:'}</h6>
            <ListGroup className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {searchResults.map(user => renderUserItem(user))}
            </ListGroup>
          </>
        )}

        {!loading && searchResults.length === 0 && searchQuery && !error && (
          <div className="text-center py-4 text-muted">
            <BsPerson size={48} className="mb-3" />
            <p>No users found matching "{searchQuery}"</p>
          </div>
        )}

        {!loading && searchResults.length === 0 && !searchQuery && !error && (
          <div className="text-center py-4 text-muted">
            <BsPerson size={48} className="mb-3" />
            <p>No contacts yet. Use search to find users.</p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NewChatModal;