const express = require('express');
const {authenticate, requireRole} = require('../middleware/auth');
const {
    createGroup,
    addMember,
    removeMember,
    myGroups,
    listallGroups,
}= require('../controllers/groupController');

const router = express.Router();

router.use(authenticate);   

router.post('/', requireRole('student'), createGroup);
router.post('/mine', requireRole('student'), myGroups);
router.post('/:groupId/add-member', requireRole('student'), addMember);
router.delete('/:groupId/remove-member/:userId', requireRole('student'), removeMember);

router.get('/all', requireRole('admin'), listallGroups);


module.exports = router;