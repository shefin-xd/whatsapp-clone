// frontend/src/components/ChatList.jsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Spinner from './Spinner';

const ChatList = ({ currentUser, setSelectedChat, onlineUsers, socket }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                    },
                };
                const { data } = await api.get('/chats', config);
                setChats(data);
            } catch (err) {
                console.error('Error fetching chats:', err);
                setError('Failed to load chats.');
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchChats();
        }

        // Listen for new chat creation
        socket.on('new_chat_created', (newChat) => {
            // Check if this user is a participant in the new chat
            if (newChat.participants.some(p => p._id === currentUser._id)) {
                setChats(prevChats => [newChat, ...prevChats]);
                // If this is the only chat and mobile, automatically select it
                if (window.innerWidth < 768 && prevChats.length === 0) {
                    setSelectedChat(newChat);
                }
            }
        });

        // Listen for last message updates to reorder chats
        socket.on('receive_message', (message) => {
            setChats(prevChats => {
                const chatIndex = prevChats.findIndex(c => c._id === message.chat._id);
                if (chatIndex > -1) {
                    const updatedChat = { ...prevChats[chatIndex], lastMessage: message };
                    const newChats = [...prevChats];
                    newChats.splice(chatIndex, 1); // Remove old position
                    return [updatedChat, ...newChats]; // Add to top
                }
                // If the message is for a new chat not yet in the list (e.g., from a fresh chat creation not through this socket listener)
                // You might need to refetch chats or add logic to push it here
                return prevChats;
            });
        });

        return () => {
            socket.off('new_chat_created');
            socket.off('receive_message');
        };
    }, [currentUser, socket, setSelectedChat]);

    const handleChatClick = (chat) => {
        setSelectedChat(chat);
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner /></div>;
    if (error) return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {chats.length === 0 && !loading && !error && (
                <p className="text-center text-gray-500 mt-4">No chats yet. Search for users to start a conversation!</p>
            )}
            {chats.map((chat) => {
                const otherParticipant = chat.participants.find(p => p._id !== currentUser._id);
                const isOnline = otherParticipant && onlineUsers[otherParticipant._id];
                const lastMessageContent = chat.lastMessage?.content || chat.lastMessage?.imageUrl ? (chat.lastMessage?.type === 'image' ? '📸 Image' : chat.lastMessage?.content) : 'No messages yet';

                return (
                    <div
                        key={chat._id}
                        className="flex items-center p-3 mb-3 bg-white rounded-lg shadow-sm hover:bg-gray-100 cursor-pointer transition"
                        onClick={() => handleChatClick(chat)}
                    >
                        <div className="relative">
                            <img
                                src={otherParticipant?.profilePicture || 'https://icon-library.com/images/default-user-icon/default-user-icon-8.jpg'}
                                alt="Profile"
                                className="w-12 h-12 rounded-full mr-4 object-cover"
                            />
                            {isOnline && (
                                <span className="absolute bottom-0 right-3 block w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-800">{otherParticipant?.username || 'Unknown User'}</h3>
                            <p className="text-sm text-gray-500 truncate">{lastMessageContent}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatList;
