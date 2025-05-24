const jwt = require('jsonwebtoken');

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // You can adjust the expiration time as needed
    });
};

module.exports = generateAccessToken;
