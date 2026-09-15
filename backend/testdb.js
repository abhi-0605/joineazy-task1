require('dotenv').config();
const pool = require('./src/config/db');

pool.query('SELECT NOW()', (err,res) => {
    if(err){
        console.error('Connection failed:', err.message);
    } else {
        console.log('Connection successful:', res.rows[0].now);
    }
    pool.end();
});

