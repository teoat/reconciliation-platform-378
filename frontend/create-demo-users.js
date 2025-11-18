// Quick script to create demo users
// Copy this entire file content and paste into browser console at http://localhost:1000/login

const users = [
  { 
    email: 'admin@example.com', 
    password: 'AdminPassword123!', 
    first_name: 'Admin', 
    last_name: 'User', 
    role: 'admin' 
  },
  { 
    email: 'manager@example.com', 
    password: 'ManagerPassword123!', 
    first_name: 'Manager', 
    last_name: 'User', 
    role: 'manager' 
  },
  { 
    email: 'user@example.com', 
    password: 'UserPassword123!', 
    first_name: 'Demo', 
    last_name: 'User', 
    role: 'user' 
  }
];

console.log('🌱 Creating demo users...\n');

users.forEach(async (user, index) => {
  try {
    const response = await fetch('http://localhost:2000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    
    const data = await response.json();
    
    if (response.ok || response.status === 201) {
      console.log(`✅ [${index + 1}/3] Created: ${user.email} (${user.role})`);
    } else if (response.status === 409 || data.message?.includes('already exists') || data.error?.includes('already exists')) {
      console.log(`ℹ️  [${index + 1}/3] Already exists: ${user.email} (${user.role})`);
    } else {
      console.log(`❌ [${index + 1}/3] Failed: ${user.email} - ${data.error || data.message || response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ [${index + 1}/3] Error: ${user.email} - ${error.message}`);
  }
  
  // Add small delay between requests
  await new Promise(resolve => setTimeout(resolve, 500));
});

console.log('\n✨ Check the results above. If all succeeded, refresh the login page to see demo credentials!');

