const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // Protect all routes after this middleware

router.get('/me', userController.getMe, userController.getUser);
router.patch('/update-me', userController.updateMe);
router.delete('/delete-me', userController.deleteMe);
router.post('/profile-picture', upload('profilePicture', 1), userController.uploadProfilePicture);
router.post('/contacts', userController.addContact);
router.get('/contacts', userController.getContacts);
router.delete('/contacts/:contactId', userController.removeContact);
router.get('/blocked', userController.getBlockedUsers);
router.post('/block/:userId', userController.blockUser);
router.delete('/unblock/:userId', userController.unblockUser);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUser);

module.exports = router;