import React, { useState } from 'react';
import { Alert, Button, Form, Image, InputGroup, ListGroup, Spinner } from 'react-bootstrap';
import { BsChatDots, BsPersonAdd, BsSearch } from 'react-icons/bs';
import { userService } from '../../services/userService';
import { conversationService } from '../../services/conversationService';

const AddContact = ({ onClose, onConversationCreated }) => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [activeUserId, setActiveUserId] = useState(null);
	const [error, setError] = useState('');

	const handleSearch = async (event) => {
		event?.preventDefault();

		if (!query.trim()) {
			setResults([]);
			return;
		}

		try {
			setLoading(true);
			setError('');
			const response = await userService.searchUsers(query.trim());
			setResults(response.data?.users || []);
		} catch (searchError) {
			setError(searchError.response?.data?.message || 'Failed to search users');
		} finally {
			setLoading(false);
		}
	};

	const handleStartChat = async (userId) => {
		try {
			setActiveUserId(userId);
			setError('');

			try {
				await userService.addContact(userId);
			} catch (contactError) {
				if (contactError.response?.status !== 400) {
					throw contactError;
				}
			}

			const response = await conversationService.createPrivate(userId);
			const conversation = response.data?.conversation;

			if (onConversationCreated) {
				await onConversationCreated(conversation);
			}

			setQuery('');
			setResults([]);
			if (onClose) onClose();
		} catch (chatError) {
			setError(chatError.response?.data?.message || 'Failed to start chat');
		} finally {
			setActiveUserId(null);
		}
	};

	return (
		<div>
			<Form onSubmit={handleSearch}>
				<Form.Group className="mb-3">
					<Form.Label>Search by username or phone</Form.Label>
					<InputGroup>
						<Form.Control
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Enter username or phone"
						/>
						<Button variant="primary" type="submit" disabled={loading}>
							{loading ? <Spinner size="sm" animation="border" /> : <BsSearch />}
						</Button>
					</InputGroup>
				</Form.Group>
			</Form>

			{error && <Alert variant="danger">{error}</Alert>}

			{results.length > 0 && (
				<ListGroup className="mb-3">
					{results.map((result) => (
						<ListGroup.Item key={result._id} className="d-flex align-items-center gap-3">
							<Image
								src={result.profilePicture || 'https://via.placeholder.com/48'}
								roundedCircle
								width={48}
								height={48}
							/>
							<div className="flex-grow-1">
								<div className="fw-semibold">{result.username}</div>
								<small className="text-muted">{result.phoneNumber}</small>
							</div>
							<Button
								variant="success"
								onClick={() => handleStartChat(result._id)}
								disabled={activeUserId === result._id}
							>
								{activeUserId === result._id ? (
									<Spinner size="sm" animation="border" />
								) : (
									<>
										<BsPersonAdd className="me-2" />
										<BsChatDots />
									</>
								)}
							</Button>
						</ListGroup.Item>
					))}
				</ListGroup>
			)}

			{!loading && query.trim() && results.length === 0 && (
				<p className="text-muted mb-3">No users found.</p>
			)}

			<div className="d-flex justify-content-end gap-2">
				<Button variant="secondary" onClick={onClose}>Cancel</Button>
			</div>
		</div>
	);
};

export default AddContact;
