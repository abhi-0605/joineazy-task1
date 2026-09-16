const {express} = require('express');

const {authenticate, requireRole} = require('../middleware/auth');
const {
    confirmSubmission,
    assignmentSubmissions,
    analytics
}= require('../controllers/submissionController');

const router = express.Router();

router.use(authenticate);

router.post('/:assignmentId/confirm', requireRole('student'), confirmSubmission);
router.get('/:assignmentId', requireRole('admin'), assignmentSubmissions);
router.get('/analytics', requireRole('admin'), analytics);


module.exports = router;
