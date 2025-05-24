const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { accessChat, fetchChats, allMessages } = require('../controllers/chatController');

const router = express.Router();

router.route('/').post(protect, accessChat).get(protect, fetchChats);
router.route('/:chatId/messages').get(protect, allMessages);

module.exports = router;
