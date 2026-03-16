import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Image, Row, Spinner } from 'react-bootstrap';
import { userService } from '../services/userService';

const ProfilePage = () => {
	const [profile, setProfile] = useState(null);
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		status: '',
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const apiBase = import.meta.env.VITE_API_URL || '';
	const backendOrigin = useMemo(() => apiBase.replace(/\/api\/?$/, ''), [apiBase]);

	const toAssetUrl = (filePath) => {
		if (!filePath) return 'https://via.placeholder.com/120';
		if (filePath.startsWith('http')) return filePath;
		const normalized = filePath.replace(/\\/g, '/');
		const uploadsIndex = normalized.toLowerCase().indexOf('/uploads/');
		const relativeFromUploads = uploadsIndex >= 0
			? normalized.slice(uploadsIndex + 1)
			: normalized.replace(/^([a-zA-Z]:)?\/+/, '');
		const safePath = relativeFromUploads.startsWith('uploads/')
			? relativeFromUploads
			: `uploads/${relativeFromUploads.replace(/^uploads\/?/, '')}`;
		return backendOrigin ? `${backendOrigin}/${safePath}` : `/${safePath}`;
	};

	const syncLocalUser = (updatedUser) => {
		if (!updatedUser) return;
		localStorage.setItem('user', JSON.stringify(updatedUser));
	};

	const loadProfile = async () => {
		setLoading(true);
		setError('');
		try {
			const response = await userService.getProfile();
			const user = response?.data?.data?.user;
			setProfile(user);
			setFormData({
				username: user?.username || '',
				email: user?.email || '',
				status: user?.status || '',
			});
			syncLocalUser(user);
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to load profile');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadProfile();
	}, []);

	const handleChange = (e) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError('');
		setSuccess('');

		try {
			const response = await userService.updateProfile(formData);
			const updatedUser = response?.data?.data?.user;
			setProfile(updatedUser);
			setFormData({
				username: updatedUser?.username || '',
				email: updatedUser?.email || '',
				status: updatedUser?.status || '',
			});
			syncLocalUser(updatedUser);
			setSuccess('Profile updated successfully');
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to update profile');
		} finally {
			setSaving(false);
		}
	};

	const handlePictureUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		setError('');
		setSuccess('');

		try {
			const response = await userService.uploadProfilePicture(file);
			const newPath = response?.data?.data?.profilePicture;
			setProfile((prev) => {
				const updated = { ...(prev || {}), profilePicture: newPath };
				syncLocalUser(updated);
				return updated;
			});
			setSuccess('Profile picture updated');
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to upload profile picture');
		} finally {
			setUploading(false);
			e.target.value = '';
		}
	};

	if (loading) {
		return (
			<Container className="py-5 text-center">
				<Spinner animation="border" />
			</Container>
		);
	}

	return (
		<Container className="py-4" style={{ maxWidth: '780px' }}>
			<h2 className="mb-4">My Profile</h2>

			{error && <Alert variant="danger">{error}</Alert>}
			{success && <Alert variant="success">{success}</Alert>}

			<Card className="mb-4">
				<Card.Body>
					<Row className="align-items-center g-3">
						<Col xs="auto">
							<Image
								src={toAssetUrl(profile?.profilePicture)}
								roundedCircle
								width={120}
								height={120}
								style={{ objectFit: 'cover' }}
							/>
						</Col>
						<Col>
							<h5 className="mb-1">{profile?.username || 'Unknown user'}</h5>
							<div className="text-muted">{profile?.phoneNumber || '-'}</div>
							<div className="text-muted">{profile?.email || '-'}</div>
							<Form.Group className="mt-3" controlId="profilePictureUpload">
								<Form.Label className="mb-2">Change profile picture</Form.Label>
								<Form.Control type="file" accept="image/*" onChange={handlePictureUpload} disabled={uploading} />
							</Form.Group>
						</Col>
					</Row>
				</Card.Body>
			</Card>

			<Card>
				<Card.Body>
					<Form onSubmit={handleSave}>
						<Row>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Username</Form.Label>
									<Form.Control
										name="username"
										value={formData.username}
										onChange={handleChange}
										required
									/>
								</Form.Group>
							</Col>
							<Col md={6}>
								<Form.Group className="mb-3">
									<Form.Label>Email</Form.Label>
									<Form.Control
										type="email"
										name="email"
										value={formData.email}
										onChange={handleChange}
									/>
								</Form.Group>
							</Col>
						</Row>

						<Form.Group className="mb-3">
							<Form.Label>Status</Form.Label>
							<Form.Control
								name="status"
								value={formData.status}
								onChange={handleChange}
								maxLength={100}
								placeholder="Say something about yourself"
							/>
						</Form.Group>

						<div className="d-flex justify-content-end gap-2">
							<Button variant="outline-secondary" type="button" onClick={loadProfile} disabled={saving || uploading}>
								Reset
							</Button>
							<Button variant="primary" type="submit" disabled={saving || uploading}>
								{saving ? 'Saving...' : 'Save Changes'}
							</Button>
						</div>
					</Form>
				</Card.Body>
			</Card>
		</Container>
	);
};

export default ProfilePage;
