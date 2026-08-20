const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { 
  createUserValidator, 
  updateUserValidator 
} = require('../validators/userValidator');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/', auth, authorize('admin'), userController.getAllUsers);
router.post('/', auth, authorize('admin'), createUserValidator, userController.createUser);
router.get('/:id', auth, authorize('admin'), userController.getUserById);
router.put('/:id', auth, authorize('admin'), updateUserValidator, userController.updateUser);
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);
router.patch('/:id/status', auth, authorize('admin'), userController.updateUserStatus);

module.exports = router;