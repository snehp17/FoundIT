require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://fnspjghibqohshfulnah.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// BTech 2027 Batch Sample Dataset for Parul University
const defaultPassword = 'Foundit@123';
const btech2027Students = [
  {
    name: 'Sneh Bharatbhai Patel',
    email: '2303031050445@paruluniversity.ac.in',
    roll_number: '2303031050445',
    department: 'Computer Science & Engineering',
    batch: '2027',
    phone: '+91 9876543210'
  },
  {
    name: 'Aarav Sharma',
    email: '2303031050401@paruluniversity.ac.in',
    roll_number: '2303031050401',
    department: 'Computer Science & Engineering',
    batch: '2027',
    phone: '+91 9876543211'
  },
  {
    name: 'Priya Verma',
    email: '2303031050402@paruluniversity.ac.in',
    roll_number: '2303031050402',
    department: 'Information Technology',
    batch: '2027',
    phone: '+91 9876543212'
  },
  {
    name: 'Rohan Mehta',
    email: '2303031050403@paruluniversity.ac.in',
    roll_number: '2303031050403',
    department: 'Artificial Intelligence & Data Science',
    batch: '2027',
    phone: '+91 9876543213'
  },
  {
    name: 'Ananya Joshi',
    email: '2303031050404@paruluniversity.ac.in',
    roll_number: '2303031050404',
    department: 'Computer Science & Engineering',
    batch: '2027',
    phone: '+91 9876543214'
  },
  {
    name: 'Devansh Shah',
    email: '2303031050405@paruluniversity.ac.in',
    roll_number: '2303031050405',
    department: 'Software Engineering',
    batch: '2027',
    phone: '+91 9876543215'
  }
];

const seedParulBtech2027 = async () => {
  try {
    console.log('🚀 Starting Parul University BTech 2027 Batch Import...');

    // 1. Ensure Parul University exists
    let { data: uni } = await supabase
      .from('universities')
      .select('id, name')
      .eq('code', 'PU')
      .maybeSingle();

    if (!uni) {
      console.log('Creating Parul University entry...');
      const { data: newUni, error: uniError } = await supabase
        .from('universities')
        .insert({
          name: 'Parul University',
          code: 'PU',
          allowed_domain: '@paruluniversity.ac.in',
          allow_personal_emails: false,
          status: 'Active'
        })
        .select()
        .single();

      if (uniError) {
        console.error('Error creating Parul University:', uniError.message);
        process.exit(1);
      }
      uni = newUni;
    }

    console.log(`✅ Target University: ${uni.name} (ID: ${uni.id})`);

    // 2. Loop and import BTech 2027 students
    let successCount = 0;
    let skipCount = 0;

    for (const student of btech2027Students) {
      console.log(`\nProcessing: ${student.name} (${student.email})...`);

      // Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', student.email)
        .maybeSingle();

      let userId;

      if (existingProfile) {
        console.log(`ℹ️ User profile already exists for ${student.email}. Updating details...`);
        userId = existingProfile.id;
      } else {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: student.email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            name: student.name,
            role: 'student',
            university_id: uni.id,
            department: student.department,
            roll_number: student.roll_number,
            batch: student.batch
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            // Find auth user ID
            const { data: listData } = await supabase.auth.admin.listUsers();
            const foundUser = listData?.users?.find(u => u.email === student.email);
            if (foundUser) userId = foundUser.id;
          } else {
            console.error(`❌ Failed to create auth user for ${student.email}:`, authError.message);
            skipCount++;
            continue;
          }
        } else {
          userId = authData.user.id;
        }
      }

      if (userId) {
        // Upsert student profile with all verification details
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            name: student.name,
            email: student.email,
            role: 'student',
            university_id: uni.id,
            phone: student.phone,
            department: student.department,
            roll_number: student.roll_number,
            batch: student.batch
          });

        if (profileError) {
          console.error(`❌ Profile upsert error for ${student.email}:`, profileError.message);
        } else {
          console.log(`✅ Success: ${student.name} imported (Password: ${defaultPassword})`);
          successCount++;
        }
      }
    }

    console.log(`\n🎉 BTech 2027 Import Completed!`);
    console.log(`- Imported/Updated: ${successCount}`);
    console.log(`- Skipped/Errors: ${skipCount}`);
    console.log(`- Default Password for all: ${defaultPassword}`);
    process.exit(0);

  } catch (error) {
    console.error('Fatal error during BTech 2027 import:', error);
    process.exit(1);
  }
};

seedParulBtech2027();
