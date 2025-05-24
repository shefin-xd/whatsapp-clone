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
                // Handle notification display (e.g., show a toast, update badge)
                console.log('New message notification:', message);
            });

            // Listen for disconnects
            socket.on('disconnect', () => {
                console.log('Socket disconnected');
                // Optionally handle re-connection or user feedback
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

    // Handle initial selection of chat on desktop if any is active
    useEffect(() => {
        if (window.innerWidth >= 768 && !selectedChat) { // md: breakpoint
            // If on desktop and no chat is selected, perhaps select the first chat in the list
            // This is just a suggestion, you might want to show a "Welcome" screen instead
            // For now, we'll let ChatList handle initial state.
        }
    }, [selectedChat]);

    // Function to handle chat selection (and hide sidebar on mobile)
    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        if (window.innerWidth < 768) { // For mobile, hide sidebar when chat is selected
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
            {/* Sidebar (ChatList) */}
            <div
                className={`w-full md:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0 bg-white border-r md:flex ${
                    selectedChat && !showSidebar ? 'hidden md:flex' : 'flex' // Hide on mobile if chat selected, always show on desktop
                }`}
            >
                <Sidebar currentUser={currentUser} logout={logout} />
                <ChatList currentUser={currentUser} setSelectedChat={handleChatSelect} onlineUsers={onlineUsers} socket={socket} />
            </div>

            {/* Chat Window */}
            <div
                className={`flex-1 flex flex-col ${
                     selectedChat ? 'flex' : 'hidden'
                 } md:flex`}
            >
                {selectedChat ? (
                    <ChatWindow
                        chat={selectedChat}
                        currentUser={currentUser}
                        socket={socket}
                        onlineUsers={onlineUsers}
                        setSelectedChat={setSelectedChat} // Pass setSelectedChat to update last message
                        onBack={handleBackToChatList} // Pass back handler for mobile
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500">
                        Select a chat to start messaging
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
