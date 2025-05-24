import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ChatWindow = ({ chat, currentUser, socket, onlineUsers, setSelectedChat }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState({}); // Stores senderId -> true/false for typing
    const messagesEndRef = useRef(null);

    const otherParticipant = chat.participants.find(p => p._id !== currentUser._id);
    const isOtherUserOnline = otherParticipant && onlineUsers[otherParticipant._id];
    const otherUserLastSeen = otherParticipant?.lastSeen;

    // Fetch messages for the selected chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (chat) {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${currentUser.token}`,
                        },
                    };
                    const { data } = await api.get(`/chats/${chat._id}/messages`, config);
                    setMessages(data);
                } catch (error) {
                    console.error('Error fetching messages:', error);
                    setMessages([]);
                }
            }
        };
        fetchMessages();

        // Listen for new messages specific to this chat
        // This listener is crucial for real-time updates when current chat is open
        socket.on('receive_message', (receivedMessage) => {
            if (receivedMessage.chat._id === chat._id) {
                setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                // Clear typing indicator for the sender of this message
                setTypingUsers((prev) => {
                    const newTyping = { ...prev };
                    if (newTyping[receivedMessage.sender._id]) {
                        delete newTyping[receivedMessage.sender._id];
                    }
                    return newTyping;
                });
            }
        });

        // Listen for typing indicators
        socket.on('typing', (senderSocketId) => {
            // We need to map socketId back to userId, this is simplified for now
            // In a real app, you'd emit userId with typing event
            if (senderSocketId !== socket.id) { // Don't show typing for self
                setTypingUsers(prev => ({ ...prev, [otherParticipant._id]: true })); // Assuming only one other participant
            }
        });

        socket.on('stop_typing', (senderSocketId) => {
            if (senderSocketId !== socket.id) {
                setTypingUsers(prev => ({ ...prev, [otherParticipant._id]: false }));
            }
        });

        // Listen for message reactions
        socket.on('new_reaction', ({ messageId, chat: reactedChatId, reactorId, emoji }) => {
            if (reactedChatId === chat._id) { // Only update if reaction is for current chat
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg._id === messageId
                            ? {
                                  ...msg,
                                  reactions: msg.reactions.find(r => r.reactor === reactorId)
                                      ? msg.reactions.map(r => r.reactor === reactorId ? { ...r, emoji } : r)
                                      : [...msg.reactions, { reactor: reactorId, emoji }]
                              }
                            : msg
                    )
                );
            }
        });


        return () => {
            // Clean up listeners when chat changes or component unmounts
            socket.off('receive_message');
            socket.off('typing');
            socket.off('stop_typing');
            socket.off('new_reaction');
        };
    }, [chat, currentUser, socket, otherParticipant]); // Depend on chat and currentUser to refetch/re-setup

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            const messageData = {
                sender: currentUser._id,
                chat: chat._id,
                content: newMessage,
                type: 'text',
            };
            // Emit to socket for real-time delivery
            socket.emit('send_message', messageData);
            setNewMessage('');
            socket.emit('stop_typing', chat._id); // Stop typing after sending
            // Optimistically add message to UI
            setMessages((prevMessages) => [...prevMessages, { ...messageData, _id: Date.now(), sender: currentUser, createdAt: new Date() }]);

            // Update the selected chat's messages in ChatPage's state directly for quick UI update
            setSelectedChat(prevChat => ({
                ...prevChat,
                messages: [...(prevChat.messages || []), { ...messageData, _id: Date.now(), sender: currentUser, createdAt: new Date() }]
            }));

        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (e.target.value.length > 0) {
            socket.emit('typing', chat._id);
        } else {
            socket.emit('stop_typing', chat._id);
        }
    };

    const handleMessageReaction = (messageId, emoji) => {
        socket.emit('message_reaction', { messageId, reactorId: currentUser._id, emoji });
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Chat Header */}
            <div className="bg-white p-4 border-b flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <img
                        src={otherParticipant?.profilePicture || 'https://icon-library.com/images/default-user-icon/default-user-icon-8.jpg'}
                        alt="Profile"
                        className="w-10 h-10 rounded-full mr-3 border-2 border-green-500"
                    />
                    <div>
                        <h2 className="font-semibold text-lg">{otherParticipant?.username || 'Unknown User'}</h2>
                        {isOtherUserOnline ? (
                            <span className="text-sm text-green-500">Online</span>
                        ) : (
                            <span className="text-sm text-gray-500">
                                {otherUserLastSeen ? `Last seen ${dayjs(otherUserLastSeen).fromNow()}` : 'Offline'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map((msg) => (
                    <div
                        key={msg._id}
                        className={`flex ${msg.sender._id === currentUser._id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`p-3 rounded-lg max-w-[70%] relative break-words ${
                                msg.sender._id === currentUser._id ? 'bg-green-200 rounded-br-none' : 'bg-white rounded-bl-none'
                            }`}
                        >
                            {msg.type === 'text' && <p className="text-gray-800">{msg.content}</p>}
                            {msg.type === 'image' && (
                                <img src={msg.imageUrl} alt="shared" className="max-w-full h-auto rounded-md" />
                            )}
                            <span className="text-xs text-gray-500 block mt-1">
                                {dayjs(msg.createdAt).format('HH:mm')}
                            </span>
                            {/* Message Reactions */}
                            {msg.reactions && msg.reactions.length > 0 && (
                                <div className="absolute -bottom-2 right-2 bg-gray-200 rounded-full px-2 py-0.5 text-xs flex items-center shadow-md">
                                    {msg.reactions.map((r, i) => (
                                        <span key={i} className="mr-0.5">{r.emoji}</span>
                                    ))}
                                    {/* Optional: Show count if multiple reactions */}
                                    {msg.reactions.length > 1 && <span className="ml-0.5 text-gray-600">{msg.reactions.length}</span>}
                                </div>
                            )}

                            {/* Reaction button */}
                            <button
                                onClick={() => handleMessageReaction(msg._id, '👍')}
                                className="absolute -top-2 left-2 bg-gray-100 rounded-full text-lg px-2 py-0.5 shadow-sm hover:bg-gray-200"
                                title="React with Thumbs Up"
                            >
                                👍
                            </button>
                            <button
                                onClick={() => handleMessageReaction(msg._id, '❤️')}
                                className="absolute -top-2 left-8 bg-gray-100 rounded-full text-lg px-2 py-0.5 shadow-sm hover:bg-gray-200"
                                title="React with Heart"
                            >
                                ❤️
                            </button>
                        </div>
                    </div>
                ))}
                {otherParticipant && typingUsers[otherParticipant._id] && (
                    <div className="flex justify-start">
                        <div className="p-3 rounded-lg bg-white rounded-bl-none">
                            <span className="text-gray-500 animate-pulse">typing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex items-center space-x-2 shadow-inner">
                {/* Image Upload Button (will implement functionality later) */}
                <label htmlFor="image-upload" className="cursor-pointer text-gray-600 hover:text-green-600 text-2xl">
                    📸
                    <input id="image-upload" type="file" accept="image/*" className="hidden" />
                </label>
                <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 p-3 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                    type="submit"
                    className="bg-green-500 text-white rounded-full p-3 hover:bg-green-600 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
