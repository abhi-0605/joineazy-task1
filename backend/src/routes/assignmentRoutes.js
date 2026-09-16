const express= require('express');
const {authenticate, requireRole}=require('../middleware/auth');

const {
    createAssignment,
    updateAssignment,
    studentAssignments,
    adminAssignments,
}= require('../controllers/assignmentController');

const router=express.Router();

router.use(authenticate);

router.post('/', requireRole('admin'), createAssignment);
router.put('/:id', requireRole('admin'), updateAssignment);
router.get('/admin', requireRole('admin'), adminAssignments);
router.get('/student', requireRole('student'), studentAssignments);


module.exports=router;