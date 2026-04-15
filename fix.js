const bcrypt = require('bcryptjs');
const db = require('./src/config/db'); 

async function fixPassword() {
  try {
    console.log("Hashing the password 'faculty123'...");
    const hashedPassword = await bcrypt.hash("faculty123", 10);
    
    console.log("Saving to database...");
    await db.query(
      "UPDATE faculty SET password = ? WHERE email = 'teacher@test.com'", 
      [hashedPassword]
    );
    
    console.log("SUCCESS! The password for teacher@test.com is officially: faculty123");
    process.exit(0);
  } catch (err) {
    console.error("Error updating database:", err.message);
    process.exit(1);
  }
}

fixPassword();