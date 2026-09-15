const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function signToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
            process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
    );

}

async function register(req, res) {
    try{
        const {name,email,password,role}=req.body;

        if(!name || !email || !password ){
            return res.status(400).json({
                message:'All fields are required'
            })
        }

        const normalizedRole= role === 'admin' ? 'admin' : 'student';

        const existingUser=await pool.query('SELECT * FROM users WHERE email=$1',[email.tolowerCase()]);
        if(existingUser.rows.length>0){
            return res.status(400).json({
                message:'User with this email already exists'
            })
        }

        const passwordHash=await bcrypt.hash(password,10);

        const result=await pool.query(
            `INSERT INTO users (name,email,password,role)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [name,email.tolowerCase(),passwordHash,normalizedRole]
        );

        const user=result.rows[0];
        const token=signToken(user);

        res.status(201).json({
            user,token
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({
            message:'Failed to register user'
        });
    }
}


async function login(req,res){
    try{
        const {email,password}=req.body;

        if(!email || !password){
            return res.status(400).json({
                message:'Email and password are required'
            })
        }
        
        const result=await pool.query('SELECT * FROM users WHERE email=$1',[email.toLowerCase()]);
        const user=result.rows[0];

        if(!user){
            return res.status(401).json({
                message:'Invalid email or password'
            })
        }

        const match=await bcrypt.compare(password,user.password);
        if(!match){
            return res.status(401).json({
                message:'Invalid email or password'
            })
        }

        const token=signToken(user);
        delete user.password;

        res.json({ user,token })
    }catch(error){
        console.error('Error in login:', error);
        res.status(500).json({
            message:'Failed to login'
        });
    }
}

async function me(req,res){
    const result=await pool.query('SELECT id,name,email,role FROM users WHERE id=$1',[req.user.id]);
    res.json({user:result.rows[0]});
}

module.exports={register,login,me};