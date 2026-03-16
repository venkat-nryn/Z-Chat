import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
	const [formData, setFormData] = useState({
		username: '',
		phoneNumber: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const { register } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (formData.password.length < 6) {
			setError('Password must be at least 6 characters');
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		setLoading(true);
		try {
			await register({
				username: formData.username,
				phoneNumber: formData.phoneNumber,
				email: formData.email,
				password: formData.password,
			});
			navigate('/chat');
		} catch (err) {
			setError(err.response?.data?.message || 'Registration failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
			<div className="w-100" style={{ maxWidth: '460px' }}>
				<Card>
					<Card.Body>
						<h2 className="text-center mb-4">Create Account</h2>
						{error && <Alert variant="danger">{error}</Alert>}

						<Form onSubmit={handleSubmit}>
							<Form.Group className="mb-3">
								<Form.Label>Username</Form.Label>
								<Form.Control
									type="text"
									name="username"
									value={formData.username}
									onChange={handleChange}
									placeholder="Enter username"
									required
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Phone Number</Form.Label>
								<Form.Control
									type="tel"
									name="phoneNumber"
									value={formData.phoneNumber}
									onChange={handleChange}
									placeholder="+91xxxxxxxxxx"
									required
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Email (optional)</Form.Label>
								<Form.Control
									type="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									placeholder="name@example.com"
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Password</Form.Label>
								<Form.Control
									type="password"
									name="password"
									value={formData.password}
									onChange={handleChange}
									required
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Confirm Password</Form.Label>
								<Form.Control
									type="password"
									name="confirmPassword"
									value={formData.confirmPassword}
									onChange={handleChange}
									required
								/>
							</Form.Group>

							<Button disabled={loading} className="w-100" type="submit">
								{loading ? 'Creating account...' : 'Register'}
							</Button>
						</Form>
					</Card.Body>
				</Card>

				<div className="text-center mt-3">
					<Link to="/login">Already have an account? Login</Link>
				</div>
			</div>
		</Container>
	);
};

export default Register;
