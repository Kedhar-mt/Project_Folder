const User = require('../models/User');

const getAllUsers = async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users.length ? users : []); // Always return an array
    } catch (err) {
      console.error('Error fetching users:', err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  };
  

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).send('Server Error');
  }
};

const updateUser = async (req, res) => {
  const { username, email, role } = req.body;

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Ensure user can only update their own data unless they are an admin
    if (req.user.userId !== user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized to update this user' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
    }

    user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          username,
          email,
          role: role === 'admin' || role === 'user' ? role : 'user'
        } 
      },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).send('Server Error');
  }
};

// In your userController.js
const deleteUser = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      // Ensure admin privileges
      if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required' });
      }
  
      // Use findByIdAndDelete instead of remove()
      await User.findByIdAndDelete(req.params.id);
      res.json({ msg: 'User removed' });
    } catch (err) {
      console.error('Error deleting user:', err.message);
      res.status(500).json({ msg: 'Server Error' });  // Send JSON response
    }
  };

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
