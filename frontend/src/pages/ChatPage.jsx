import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import Sidebar from '../components/Sidebar';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL.replace('/api', '')); // Connect to root of backend for socket.io

const ChatPage = () => {
    const { user, logout } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({}); // Stores userId -> true/false

    // Fetch user's chats on component mount
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
    }, [user]); // Re-fetch if user changes (e.g., after login/logout)


    // Socket.io setup for presence
    useEffect(() => {
        if (!user) return;

        socket.emit('setup', user); // Inform backend about user's presence

        socket.on('user_online', (userId) => {
            setOnlineUsers(prev => ({ ...prev, [userId]: true }));
            console.log(`${userId} is online.`);
        });

        socket.on('user_offline', (userId) => {
            setOnlineUsers(prev => ({ ...prev, [userId]: false }));
            console.log(`${userId} is offline.`);
        });

        // Listen for new messages to update chat list and potentially current chat
        socket.on('receive_message', (newMessage) => {
            console.log('Received message via socket:', newMessage);
            setChats(prevChats => {
                const chatExists = prevChats.some(chat => chat._id === newMessage.chat._id);
                if (chatExists) {
                    // Update existing chat's last message and move to top
                    return prevChats.map(chat =>
                        chat._id === newMessage.chat._id
                            ? { ...chat, lastMessage: newMessage, updatedAt: newMessage.createdAt }
                            : chat
                    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                } else {
                    // Add new chat to list (e.g., if it's a new 1-1 chat initiated by someone else)
                    // You might need to fetch the full chat object here if the `newMessage.chat` doesn't contain all required details
                    // For now, we'll just add the basic structure for the new chat from the message itself.
                    return [{
                        _id: newMessage.chat._id,
                        participants: newMessage.chat.participants, // This might not be fully populated
                        lastMessage: newMessage,
                        updatedAt: newMessage.createdAt,
                    }, ...prevChats];
                }
            });

            // If the received message is for the currently selected chat, update its messages directly
            if (selectedChat && selectedChat._id === newMessage.chat._id) {
                setSelectedChat(prevChat => ({
                    ...prevChat,
                    messages: [...(prevChat.messages || []), newMessage]
                }));
            }
        });

        // Clean up on unmount or user change
        return () => {
            socket.off('user_online');
            socket.off('user_offline');
            socket.off('receive_message');
            // No need to disconnect, as we want persistent connection if user is logged in
        };
    }, [user, selectedChat]); // Re-run if `selectedChat` changes to update messages

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
        // Immediately join the chat room when selected
        socket.emit('join_chat', chat._id);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar user={user} onlineUsers={onlineUsers} logout={logout} onSelectChat={handleSelectChat} />
            <div className="flex-1 flex flex-col">
                {selectedChat ? (
                    <ChatWindow
                        chat={selectedChat}
                        currentUser={user}
                        socket={socket}
                        onlineUsers={onlineUsers}
                        setSelectedChat={setSelectedChat} // Pass setter to update messages in window
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a chat to start messaging
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
