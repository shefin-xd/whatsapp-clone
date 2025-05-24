// frontend/src/components/Sidebar.jsx (No major changes needed for responsiveness within this component)
import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import ChatList from './ChatList'; // Assuming ChatList is now a separate component or you'll include its logic here

const Sidebar = ({ currentUser, logout }) => {
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        setSearch(e.target.value);
        if (e.target.value.length > 2) { // Start search after 2 characters
            setLoading(true);
            setError(null);
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                    },
                };
                const { data } = await api.get(`/users?search=${e.target.value}`, config);
                setSearchResults(data);
            } catch (err) {
                console.error('Error searching users:', err);
                setError('Failed to fetch users. Please try again.');
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]); // Clear results if search query is too short
        }
    };

    // Placeholder for creating/accessing chat (this logic would typically be in ChatList or ChatPage)
    const accessChat = async (userId) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentUser.token}`,
                },
            };
            // This endpoint creates a chat or returns an existing one
            // This is primarily for ChatList or where you initiate chats
            // We'll focus on getting the search working first.
            console.log("Accessing chat with user:", userId);
        } catch (error) {
            console.error('Error accessing chat:', error);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 p-4 border-r">
            {/* Header / Search Bar */}
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>

            {/* Search Input */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={search}
                    onChange={handleSearch}
                />
            </div>

            {/* Search Results */}
            {loading && <p className="text-center text-gray-500">Loading...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {searchResults.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Search Results:</h3>
                    <div className="space-y-2">
                        {searchResults.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 cursor-pointer"
                                onClick={() => accessChat(user._id)} // Clicking search result should access chat
                            >
                                <img
                                    src={user.profilePicture || 'https://icon-library.com/images/default-user-icon/default-user-icon-8.jpg'}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full mr-3"
                                />
                                <span className="text-gray-800">{user.username}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat List (assuming ChatList is integrated here or rendered separately) */}
            {/* If ChatList is intended to be part of Sidebar: */}
            {/* <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ChatList currentUser={currentUser} setSelectedChat={setSelectedChat} onlineUsers={onlineUsers} socket={socket} />
            </div> */}
        </div>
    );
};

export default Sidebar;
