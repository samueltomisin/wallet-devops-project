const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    const migrationFile = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = runMigrations;