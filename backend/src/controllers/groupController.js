const pool = require('../config/db');

async function createGroup(req, res) {
    try{
        const {name}=req.body;

        if(!name){
            return res.status(400).json({
                message:'Group name is required'
            })
        }

        await client.query('BEGIN');

        const groupResult=await pool.query(
            'INSERT INTO groups (name,created_by) VALUES ($1,$2) RETURNING *',
            [name,req.user.id]
        );
        const group=groupResult.rows[0];

        await pool.query(
            'INSERT INTO group_members (group_id,user_id) VALUES ($1,$2)',
            [group.id,req.user.id]
        );

        await client.query('COMMIT');

        res.status(201).json({
            group
        });
    }catch(error){
        await client.query('ROLLBACK');
        console.error('Error in createGroup:', error);
        res.status(500).json({
            message:'Failed to create group'
        });
    }finally{
        client.release();
    }
}



async function addMember(req,res){
    try{
        const {groupId}=req.params;
        const {email,userId}=req.body;

        if(!email && !userId){
            return res.status(400).json({
                message:'Email or userId is required to add a member'
            })
        }
        const membership= await pool.query(
            'SELECT * FROM group_members WHERE group_id=$1 AND user_id=$2',
            [groupId,userId]
        );

        if(membership.rows.length===0){
            return res.status(403).json({
                message:'only group members can add new members'
            })
        }

        const userQuery = userId 
        ? ("SELECT id,name,email FROM users WHERE id=$1 AND role='student' ",[userId]) 
        : ("SELECT id,name,email FROM users WHERE email=$1 AND role='student' ",[email.toLowerCase()]);

        if(userQuery.rows.length===0){
            return res.status(404).json({
                message:'User not found or not a student'
            })
        }

        const student =userQuery.rows[0];
        const existing = await pool.query(
            'SELECT * FROM group_members WHERE group_id=$1 AND user_id=$2',
            [groupId,student.id]
        );

        if(existing.rows.length>0){
            return res.status(400).json({
                message:'User is already a member of this group'
            })
        }

        await pool.query(
            'INSERT INTO group_members (group_id,user_id) VALUES ($1,$2)',
            [groupId,student.id]
        );

        res.status(200).json({
            message:`${student.name} has been added to the group`
        });
         

    }catch(error){
        console.error('Error in addMember: ',error);
        res.status(500).json({
            message:'Failed to add member to the group'
        })
    }
}



async function removeMember(req,res){
    try{
        const {groupId,userId}=req.params;

        const membership= await pool.query(
            'SELECT * FROM group_members WHERE group_id=$1 AND user_id=$2',
            [groupId,req.user.id]
        );

        if(membership.rows.length===0){
            return res.status(403).json({
                message:'only group members can remove members'
            })
        }

        await pool.query(
            'DELETE FROM group_members WHERE group_id=$1 AND user_id=$2',
            [groupId,userId]
        );

        res.status(200).json({
            message:'Member has been removed from the group'
        });
    }catch(error){
        console.error('Error in removeMember: ',error);
        res.status(500).json({
            message:'Failed to remove member from the group'
        })
    }
}




async function myGroups(req,res){
    try{
        const groups=await pool.query(
            `SELECT g.* FROM groups g 
            JOIN group_members gm ON g.id=gm.group_id 
            WHERE gm.user_id=$1
            ORDER BY g.created_at DESC`,
            [req.user.id]
        );

        const groupWithMembers=await Promise.all(
            groups.rows.map(async(group)=>{
                const members=await pool.query(
                    `SELECT u.id,u.name,u.email FROM users u
                    JOIN group_members gm ON u.id=gm.user_id
                    WHERE gm.group_id=$1`,
                    [group.id]
                );
                return {...group,members:members.rows}
            })
        );

        res.status(200).json({
            groups:groupWithMembers
        });
    }catch(error){
        console.error('Error in myGroups: ',error);
        res.status(500).json({
            message:'Failed to fetch groups'
        })
    }
}


//admin only
async function listallGroups(req,res){
    try{
        const groups=await pool.query(
            'SELECT * FROM groups ORDER BY created_at DESC'
        );
        const groupWithMembers=await Promise.all(
            groups.rows.map(async(group)=>{
                const members=await pool.query(
                    `SELECT u.id,u.name,u.email FROM users u
                    JOIN group_members gm ON u.id=gm.user_id
                    WHERE gm.group_id=$1`,
                    [group.id]
                );
                return {...group,members:members.rows}
            })
        );

        res.status(200).json({
            groups:groupWithMembers
        });
    }catch(error){
        console.error('Error in listallGroups: ',error);
        res.status(500).json({
            message:'Failed to fetch all groups'
        })
    }
}

module.exports={createGroup,addMember,removeMember,myGroups,listallGroups};