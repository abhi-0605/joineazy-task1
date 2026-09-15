const express = require('express');
const router = express.Router();
const {register,login,me}=require('../middleware/authController');
const {authenticate,requireRole}=require('../middleware/auth');



router.post('/register',register);
router.post('/login',login);
router.get('/me',authenticate,me);


module.exports=router;