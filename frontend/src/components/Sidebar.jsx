import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatList from './ChatList';
import api from '../utils/api'; // For searching users

const Sidebar = ({ user, onlineUsers, logout, onSelectChat }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        const searchUsers = async () => {
            if (searchTerm.length > 2) { // Search after 2 characters
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    };
                    const { data } = await api.get(`/api/users?search=${searchTerm}`, config); // Create this endpoint later
                    setSearchResults(data.filter(u => u._id !== user._id)); // Filter out current user
                } catch (error) {
                    console.error('Error searching users:', error);
                    setSearchResults([]);
                }
            } else {
                setSearchResults([]);
            }
        };
        const debounceSearch = setTimeout(() => {
            searchUsers();
        }, 300); // Debounce search input

        return () => clearTimeout(debounceSearch);
    }, [searchTerm, user]);

    const handleStartChat = async (targetUserId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
            };
            const { data } = await api.post('/chats', { userId: targetUserId }, config);
            onSelectChat(data); // Select the newly created/accessed chat
            setShowSearch(false); // Hide search results
            setSearchTerm(''); // Clear search term
            setSearchResults([]); // Clear search results
        } catch (error) {
            console.error('Error starting chat:', error);
            alert('Could not start chat.');
        }
    };

    return (
        <div className="w-96 bg-white border-r flex flex-col h-screen">
            {/* User Profile Header */}
            <div className="p-4 border-b flex items-center justify-between bg-green-500 text-white">
                <div className="flex items-center">
                    <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-10 h-10 rounded-full mr-3 border-2 border-white"
                    />
                    <span className="font-semibold">{user.username}</span>
                </div>
                <button
                    onClick={logout}
                    className="ml-4 px-3 py-1 bg-red-600 rounded-md text-sm hover:bg-red-700 transition"
                >
                    Logout
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 bg-gray-100 border-b">
                <input
                    type="text"
                    placeholder="Search users or start new chat..."
                    className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSearch(true);
                    }}
                    onFocus={() => setShowSearch(true)}
                    onBlur={() => setTimeout(() => setShowSearch(false), 200)} // Delay to allow click on results
                />
                {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 w-80">
                        {searchResults.map((result) => (
                            <div
                                key={result._id}
                                className="flex items-center p-3 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleStartChat(result._id)}
                            >
                                <img src={result.profilePicture} alt={result.username} className="w-8 h-8 rounded-full mr-2" />
                                <span>{result.username}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat List */}
            <ChatList onSelectChat={onSelectChat} onlineUsers={onlineUsers} />
        </div>
    );
};

export default Sidebar;
