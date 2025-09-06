const User = require('../models/models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Search for the user email in the database
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });  

    // Check if the password matches
    if (password !== user.password) return res.status(401).json({ message: 'Password does not match' });

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },   // payload
      process.env.JWT_SECRET,                // secret password
      { expiresIn: '2h' }                    // token's duration
    );

    // If everything is fine, return user data, except for the password
    res.json({
      message: 'Succesful login',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error);
    }
    return res.status(500).json({ message: 'Inténtalo de nuevo más tarde' });
  }
};

module.exports = { login };
