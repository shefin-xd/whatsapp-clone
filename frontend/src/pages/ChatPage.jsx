// frontend/src/pages/ChatPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

const ChatPage = ({ socket }) => {
    const { currentUser, logout } = useContext(AuthContext);
    const [selectedChat, setSelectedChat] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [showSidebar, setShowSidebar] = useState(true); // State to control sidebar visibility on mobile

    useEffect(() => {
        if (currentUser) {
            socket.emit('setup', currentUser._id); // Emit setup event with user ID
            socket.on('connected', () => console.log('Socket connected!'));

            // Listen for online users
            socket.on('online_users', (users) => {
                setOnlineUsers(users);
            });

            // Listen for notifications
            socket.on('notification', (message) => {
                console.log('New message notification:', message);
                // You can add more complex notification logic here (e.g., toast, sound)
            });

            // Listen for disconnects
            socket.on('disconnect', () => {
                console.log('Socket disconnected');
                // Handle re-connection or user feedback if needed
            });

            // Set up a cleanup function for socket events
            return () => {
                socket.off('connected');
                socket.off('online_users');
                socket.off('notification');
                socket.off('disconnect');
            };
        }
    }, [currentUser, socket]);

    // Function to handle chat selection (and hide sidebar on mobile)
    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        // Hide sidebar on mobile when a chat is selected
        if (window.innerWidth < 768) {
            setShowSidebar(false);
        }
    };

    // Function to go back to chat list (for mobile)
    const handleBackToChatList = () => {
        setSelectedChat(null);
        setShowSidebar(true);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar (Search and ChatList) */}
            <div
                className={`w-full md:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0 bg-white border-r md:flex ${
                    selectedChat && !showSidebar ? 'hidden' : 'flex' // Hide on mobile if chat selected and sidebar is explicitly hidden, else show
                }`}
            >
                <Sidebar currentUser={currentUser} logout={logout} setSelectedChat={handleChatSelect} socket={socket} />
                <ChatList currentUser={currentUser} setSelectedChat={handleChatSelect} onlineUsers={onlineUsers} socket={socket} />
            </div>

            {/* Chat Window */}
            <div
                className={`flex-1 flex flex-col ${
                    selectedChat ? 'flex' : 'hidden' // Show chat window if chat is selected
                } md:flex`}
            >
                {selectedChat ? (
                    <ChatWindow
                        chat={selectedChat}
                        currentUser={currentUser}
                        socket={socket}
                        onlineUsers={onlineUsers}
                        setSelectedChat={setSelectedChat}
                        onBack={handleBackToChatList} // Pass back handler for mobile
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500 text-xl font-semibold">
                        Select a chat or search for users to start messaging!
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
