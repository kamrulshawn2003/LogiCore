const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
  registerValidator, 
  loginValidator, 
  changePasswordValidator 
} = require('../validators/authValidator');
const auth = require('../middleware/auth');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', auth, authController.getCurrentUser);
router.put('/change-password', auth, changePasswordValidator, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;