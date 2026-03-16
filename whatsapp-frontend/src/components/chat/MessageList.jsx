import React from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages = [], currentUser, setReplyTo }) => {
	if (!messages.length) {
		return (
			<div className="text-center text-muted py-4">
				No messages yet. Start the conversation.
			</div>
		);
	}

	return (
		<div className="d-flex flex-column">
			{messages
				.slice()
				.reverse()
				.map((message) => (
					<MessageBubble
						key={message._id || `${message.createdAt}-${message.content}`}
						message={message}
						isOwn={message.sender?._id === currentUser?._id}
						onReply={setReplyTo}
						onDelete={() => {}}
					/>
				))}
		</div>
	);
};

export default MessageList;
