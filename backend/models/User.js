const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        profilePicture: {
            type: String,
            default: 'https://icon-library.com/images/default-user-icon/default-user-icon-8.jpg',
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
