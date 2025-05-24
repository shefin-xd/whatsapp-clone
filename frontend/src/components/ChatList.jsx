import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import io from 'socket.io-client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Connect to the Socket.io server
const socket = io(import.meta.env.VITE_BACKEND_URL.replace('/api', ''));

const ChatList = ({ onSelectChat, onlineUsers }) => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);

    // Fetch initial chats
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const { data } = await api.get('/chats', config);
                setChats(data);
            } catch (error) {
                console.error('Error fetching chats:', error);
            }
        };
        if (user) {
            fetchChats();
        }
    }, [user]);

    // Socket.io listeners for real-time updates to chat list
    useEffect(() => {
        socket.on('receive_message', (newMessage) => {
            // Update the chat list with the new message
            setChats(prevChats => {
                const updatedChats = prevChats.map(chat => {
                    if (chat._id === newMessage.chat._id) {
                        return { ...chat, lastMessage: newMessage, updatedAt: newMessage.createdAt };
                    }
                    return chat;
                });

                // If it's a message for a new chat (e.g., first message initiating conversation)
                // You'll need to fetch the full chat object to properly add it
                const chatExists = updatedChats.some(chat => chat._id === newMessage.chat._id);
                if (!chatExists) {
                    // For now, we'll just add a placeholder.
                    // In a real app, you'd trigger an API call to get the full new chat details.
                    return [{
                        _id: newMessage.chat._id,
                        participants: newMessage.chat.participants, // might not be fully populated
                        lastMessage: newMessage,
                        updatedAt: newMessage.createdAt,
                    }, ...updatedChats];
                }

                // Sort chats by most recent activity
                return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            });
        });

        socket.on('new_reaction', ({ messageId, chat, reactorId, emoji }) => {
            setChats(prevChats =>
                prevChats.map(c => {
                    if (c._id === chat) {
                        // Optimistically update the last message's reaction if it's the last one
                        if (c.lastMessage && c.lastMessage._id === messageId) {
                            const updatedReactions = c.lastMessage.reactions.find(r => r.reactor === reactorId)
                                ? c.lastMessage.reactions.map(r => r.reactor === reactorId ? { ...r, emoji } : r)
                                : [...c.lastMessage.reactions, { reactor: reactorId, emoji }];

                            return {
                                ...c,
                                lastMessage: {
                                    ...c.lastMessage,
                                    reactions: updatedReactions
                                }
                            };
                        }
                    }
                    return c;
                })
            );
        });


        return () => {
            socket.off('receive_message');
            socket.off('new_reaction');
        };
    }, []);

    const handleChatClick = (chat) => {
        onSelectChat(chat);
        setActiveChatId(chat._id);
    };

    const getChatDisplayName = (chat) => {
        if (chat.isGroupChat) {
            return chat.name;
        } else {
            const otherParticipant = chat.participants.find(p => p._id !== user._id);
            return otherParticipant ? otherParticipant.username : 'Unknown User';
        }
    };

    const getOtherParticipant = (chat) => {
        return chat.participants.find(p => p._id !== user._id);
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">No chats yet. Search for users to start one!</div>
            ) : (
                chats.map((chat) => {
                    const otherParticipant = getOtherParticipant(chat);
                    const isOnline = otherParticipant && onlineUsers[otherParticipant._id];
                    const lastSeen = otherParticipant?.lastSeen;

                    return (
                        <div
                            key={chat._id}
                            className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 border-b ${
                                activeChatId === chat._id ? 'bg-gray-200' : ''
                            }`}
                            onClick={() => handleChatClick(chat)}
                        >
                            <div className="relative mr-3">
                                <img
                                    src={otherParticipant?.profilePicture || 'https://icon-library.com/images/default-user-icon/default-user-icon-8.jpg'}
                                    alt="User"
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                {otherParticipant && (
                                    <span
                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                                        }`}
                                        title={isOnline ? 'Online' : `Last seen ${lastSeen ? dayjs(lastSeen).fromNow() : 'a while ago'}`}
                                    ></span>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg">{getChatDisplayName(chat)}</h3>
                                    {chat.lastMessage && (
                                        <span className="text-xs text-gray-500">
                                            {dayjs(chat.lastMessage.createdAt).format('HH:mm')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 truncate">
                                    {chat.lastMessage
                                        ? (chat.lastMessage.type === 'image' ? '🖼️ Image' : chat.lastMessage.content)
                                        : 'No messages yet'}
                                </p>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ChatList;
