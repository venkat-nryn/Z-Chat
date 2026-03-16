const express = require('express');
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect); // Protect all routes after this middleware

router.post('/', upload('attachments', 10), messageController.sendMessage);
router.get('/conversation/:conversationId', messageController.getMessages);
router.patch('/conversation/:conversationId/read', messageController.markAsRead);
router.patch('/conversation/:conversationId/delivered', messageController.markAsDelivered);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;