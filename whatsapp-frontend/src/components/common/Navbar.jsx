import React from 'react';
import { Navbar, Nav, Container, Image, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BsChat, BsPeople, BsPerson, BsBoxArrowRight } from 'react-icons/bs';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Navbar bg="primary" variant="dark" expand="md">
      <Container>
        <Navbar.Brand as={Link} to="/chat">
          Z Chat
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/chat">
              <BsChat className="me-1" /> Chats
            </Nav.Link>
            <Nav.Link as={Link} to="/contacts">
              <BsPeople className="me-1" /> Contacts
            </Nav.Link>
          </Nav>
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="text-white p-0" id="dropdown-user">
                <Image 
                  src={user?.profilePicture || 'https://via.placeholder.com/32'} 
                  roundedCircle 
                  width={32} 
                  height={32} 
                  className="me-2"
                />
                <span className="d-none d-md-inline">{user?.username}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">
                  <BsPerson className="me-2" /> Profile
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <BsBoxArrowRight className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;