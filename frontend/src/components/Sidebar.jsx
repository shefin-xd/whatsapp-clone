// frontend/src/components/Sidebar.jsx (Updated accessChat function)
import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';

// Add setSelectedChat and socket to props from ChatPage
const Sidebar = ({ currentUser, logout, setSelectedChat, socket }) => {
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
                console.error('Error searching users:', err.response ? err.response.data : err.message);
                setError('Failed to fetch users. Please try again.');
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]); // Clear results if search query is too short
        }
    };

    // THIS IS THE KEY FUNCTION TO FIX
    const accessChat = async (userId) => {
        try {
            setLoading(true); // Indicate loading for chat creation
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentUser.token}`,
                },
            };
            // Call the backend to create or access the chat
            const { data } = await api.post('/chats', { userId }, config);
            
            // Check if this chat is already in the list
            // For now, we'll let ChatList's socket event handle adding new chat if it's truly new
            // But we need to immediately set it as selected
            setSelectedChat(data); // Set the chat as selected to open ChatWindow

            // Emit 'join_chat' to connect to the new chat's socket room
            socket.emit('join_chat', data._id);

            setSearch(''); // Clear search bar
            setSearchResults([]); // Clear search results

        } catch (error) {
            console.error('Error accessing chat:', error.response ? error.response.data : error.message);
            setError('Failed to start chat. Please try again.');
        } finally {
            setLoading(false);
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
            {loading && search.length > 2 && <p className="text-center text-gray-500">Searching...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {searchResults.length > 0 && (
                <div className="mb-4 max-h-48 overflow-y-auto custom-scrollbar"> {/* Added max-h and overflow */}
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
        </div>
    );
};

export default Sidebar;
