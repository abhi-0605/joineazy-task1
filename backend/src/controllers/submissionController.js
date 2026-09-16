const pool = require('../config/db');

async function confirmSubmission(req, res) {
    try{
        const {assignmentId}=req.params;

        if(!assignmentId){
            return res.status(400).json({
                message:'Assignment ID is required'
            })
        }

        const result=await pool.query(
            `UPDATE submissions SET status='confirmed',
            confirmed_by=$1 WHERE assignment_id=$2 AND user_id=$1 RETURNING *`,
            [req.user.id,assignmentId]
        );

        if(result.rows.length===0){
            return res.status(404).json({
                message:'Submission not found'
            })
        }

        res.status(200).json({
            submission:result.rows[0]
        });
    }catch(error){
        console.error('Error in confirmSubmission:', error);
        res.status(500).json({
            message:'Failed to confirm submission'
        })
    }
}



async function assignmentSubmissions(req,res){
    try{
        const {assignmentId}=req.params;

        const result=await pool.query(
            `SELECT s.id, s.status, s.confirmed_by, s.created_at,
             u.id AS student_id, u.name AS student_name, u.email,
             g.id AS group_id, g.name AS group_name
             
             FROM submissions s
             JOIN users u ON u.id=s.user_id
             LEFT JOIN group_members gm ON gm.user_id=u.id
             LEFT JOIN groups g ON g.id=gm.group_id
             WHERE s.assignment_id=$1
             ORDER BY g.name NULLS LAST , u.name `,
            [assignmentId]
        );
        res.status(200).json({
            submissions:result.rows
        });
    }catch(error){
        console.error('Error in assignmentSubmissions:', error);
        res.status(500).json({
            message:'Failed to fetch assignment submissions'
        })
    }
}


async function analytics(req,res){
    try{
        const overall= await pool.query(
            `SELECT COUNT(*) FILTER (WHERE s.status='confirmed') AS confirmed,
            COUNT(*) AS total
            FROM submissions s
            JOIN assignments a ON a.id=s.assignment_id
            WHERE a.created_by=$1`,
            [req.user.id]
        );


        const perGroup=await pool.query(
            `SELECT g.id, g.name ,
            COUNT(*) FILTER (WHERE s.status='confirmed') AS confirmed,
            COUNT(*) AS total
            FROM submissions s
            JOIN assignments a ON a.id=s.assignment_id
            JOIN group_members gm ON gm.user_id=s.user_id
            JOIN groups g ON g.id=gm.group_id
            WHERE a.created_by=$1
            GROUP BY g.id, g.name
            ORDER BY g.name`,
            [req.user.id]
        );

        res.status(200).json({
            overall:overall.rows[0],
            perGroup:perGroup.rows
        });
    }catch(error){
        console.error('Error in analytics:', error);
        res.status(500).json({
            message:'Failed to fetch analytics'
        })
    }
}

module.exports={confirmSubmission,assignmentSubmissions,analytics};