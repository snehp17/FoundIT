require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Admin API Error:", error);
    return;
  }
  
  if (data.users.length > 0) {
    const user = data.users[0];
    console.log("Testing password update on user:", user.id, user.email);
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: "newpassword123!"
    });
    
    if (updateError) {
      console.error("Failed to update user:", updateError);
    } else {
      console.log("Successfully updated password!");
    }
  } else {
    console.log("No users found");
  }
}
test();
