require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Must use the Service Role Key to bypass RLS and create users on the backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Seed requires the service role key.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const seedDatabase = async () => {
  try {
    console.log('Starting seed process...');

    // 1. Create Universities
    console.log('Creating Universities...');
    const { data: parul, error: pErr } = await supabase
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
    if (pErr) console.log('Parul University creation issue (maybe exists?):', pErr.message);

    const { data: silverOak, error: sErr } = await supabase
      .from('universities')
      .insert({
        name: 'Silver Oak University',
        code: 'SOU',
        allowed_domain: '@silveroakuni.ac.in',
        allow_personal_emails: false,
        status: 'Active'
      })
      .select()
      .single();
    if (sErr) console.log('Silver Oak University creation issue:', sErr.message);

    console.log('Universities processed.');

    // Function to safely create user in auth.users and public.profiles
    const createAuthUser = async (email, password, role, universityId, name) => {
      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { name, role, university_id: universityId }
      });
      
      if (authError) {
        console.log(`Auth user creation issue for ${email}:`, authError.message);
        return;
      }
      
      const userId = authData.user.id;

      // Create profile in Database
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name,
          email: email,
          role: role,
          university_id: universityId
        });
      
      if (profileError) {
        console.log(`Profile creation issue for ${email}:`, profileError.message);
      } else {
        console.log(`Successfully created ${role} - ${email}`);
      }
    };

    // 2. Create Super Admin
    console.log('Creating Super Admin...');
    await createAuthUser('admin@foundit.com', 'FoundIT@Admin123', 'super_admin', null, 'Super Admin');

    // 3. Create University Admins
    console.log('Creating University Admins...');
    if (parul) {
      await createAuthUser('admin@paruluniversity.ac.in', 'Parul@123', 'university_admin', parul.id, 'Parul Admin');
    }
    
    if (silverOak) {
      await createAuthUser('admin@silveroakuni.ac.in', 'SilverOak@123', 'university_admin', silverOak.id, 'Silver Oak Admin');
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
