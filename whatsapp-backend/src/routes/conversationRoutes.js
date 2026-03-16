const express = require('express');
const conversationController = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all routes after this middleware

router.get('/', conversationController.getMyConversations);
router.post('/private', conversationController.createPrivateConversation);
router.post('/group', conversationController.createGroupConversation);
router.get('/:id', conversationController.getConversation);
router.patch('/:id/group', conversationController.updateGroup);
router.post('/:id/participants', conversationController.addParticipants);
router.delete('/:id/participants/:userId', conversationController.removeParticipant);

module.exports = router;