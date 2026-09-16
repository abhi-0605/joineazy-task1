const pool=require('../config/db');

async function createAssignment(req,res){
    const client=await pool.connect();
    try{
        const {title,description,dueDate,onedriveLink,targetType, groupId}=req.body;

        if(!title || !dueDate){
            return res.status(400).json({
                message:'Title and due date are required'
            })
        }

        await client.query('BEGIN');

        const result=await client.query(
            `INSERT INTO assignments (title,description,due_date,onedrive_link,target_type,created_by)\
            VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [title,description || null, dueDate, onedriveLink || null, targetType==='group' ? 'group' : 'all', req.user.id]
        );

        const assignment=result.rows[0];

        let targetUserIds=[];

        if(assignment.target_type==='group' && Array.isArray(groupId) && groupId.length>0){
            for(const groupId of groupId){
                await client.query(
                    'INSERT INTO assignment_groups (assignment_id,group_id) VALUES ($1,$2)',
                    [assignment.id,groupId]
                );
            }
            const members=await client.query(
                'SELECT user_id FROM group_members WHERE group_id=ANY($1::int[])',
                [groupId]
            );
            targetUserIds=members.rows.map((r) => req.user_id);
        }else{
            const allStudents=await client.query(
                'SELECT id FROM users WHERE role=$1',
                ['student']
            );
            targetUserIds=allStudents.rows.map((r) => r.id);
        }


        for(const userId of targetUserIds){
            await client.query(
                `INSERT INTO assignment (assignment_id,user_id,status)
                 VALUES ($1,$2,'pending')
                 ON CONFLICT (assignment_id,user_id) DO NOTHING`,
                [assignment.id, userId]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            assignment
        }); 
    }catch(error){
        await client.query('ROLLBACK');
        console.error('Error in createAssignment:', error);
        res.status(500).json({
            message:'Failed to create assignment'
        });
    }finally{
        client.release();
    }
}



async function updateAssignment(req,res){
    try{
        const {id}=req.params;
        const {title,description,dueDate,onedriveLink}=req.body;

        const result=await pool.query(
            `UPDATE assignments SET title=COALESCE($1, title),
             description=COALESCE($2, description),
            due_date=COALESCE($3, due_date),
            onedrive_link=COALESCE($4, onedrive_link)
            WHERE id=$5 AND created_by=$6 RETURNING *`,
            [title, description, dueDate, onedriveLink, id,req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        res.status(200).json({
            assignment: result.rows[0]
        });
    } catch (error) {
        console.error('Error in updateAssignment:', error);
        res.status(500).json({
            message: 'Failed to update assignment'
        });
    }
}



async function studentAssignments(req,res){
    try{
        const result=await pool.query(
            `SELECT a.*, s.status FROM submission_status
            FROM assignments a
            JOIN submissions s ON s.assignment_id=a.id
            WHERE s.user_id=$1
            ORDER BY a.due_date ASC`,
            [req.user.id]
        );

        res.status(200).json({
            assignments: result.rows
        });
    } catch (error) {
        console.error('Error in studentAssignments:', error);
        res.status(500).json({
            message: 'Failed to fetch student assignments'
        });
    }
}


async function adminAssignments(req,res){
    try{
        const assignments=await pool.query(
            'SELECT * FROM assignments WHERE created_by=$1 ORDER BY due_date ASC',
            [req.user.id]
        );

        const withProgress=await Promise.all(
            assignments.rows.map(async (a) => {
                const progress=await pool.query(
                    `SELECT COUNT(*) FILTER (WHERE status='submitted') AS submitted,
                    COUNT(*) AS total
                    FROM submissions WHERE assignment_id=$1`,
                    [a.id]
                );
                return {...a, progress: progress.rows[0]};
            })
        );

        res.status(200).json({
            assignments:withProgress
        });
    }catch(error){
        console.error('Error in adminAssignments:', error);
        res.status(500).json({
            message:'Failed to fetch assignments'
        });
    }
}

module.exports={createAssignment,updateAssignment,studentAssignments,adminAssignments};