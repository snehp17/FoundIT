require('dotenv').config({ path: __dirname + '/../.env' });
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Default target file path provided by user
const defaultFilePath = 'D:\\FoundIT\\1st Set(Btech Verification 2027 Batch).xlsx';
const targetFilePath = process.argv[2] || defaultFilePath;

const supabaseUrl = process.env.SUPABASE_URL || 'https://fnspjghibqohshfulnah.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

let XLSX;
try {
  XLSX = require('xlsx');
} catch (err) {
  console.error("\n❌ The 'xlsx' npm package is required to read Excel files.");
  console.error("Please run the following command in your terminal first:");
  console.error("   cd d:\\FoundIT\\backend");
  console.error("   npm install xlsx\n");
  process.exit(1);
}

const defaultPassword = 'Foundit@123';

const runExcelImport = async () => {
  try {
    console.log(`🚀 Starting Excel Data Import into Supabase...`);
    console.log(`📁 Source File: ${targetFilePath}`);

    if (!fs.existsSync(targetFilePath)) {
      console.error(`❌ Error: File not found at path: ${targetFilePath}`);
      process.exit(1);
    }

    // 1. Ensure Parul University entry exists
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

    // 2. Read Excel File
    const workbook = XLSX.readFile(targetFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    console.log(`📊 Found Sheet: "${sheetName}" with ${rows.length} total rows.`);

    if (rows.length === 0) {
      console.error('❌ Error: The Excel sheet appears to be empty.');
      process.exit(1);
    }

    // Log detected column headers for verification
    const sampleRow = rows[0];
    console.log('Detected Column Headers:', Object.keys(sampleRow));

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Helper to find column value flexibly by field names
    const getVal = (row, candidateKeys, defaultVal = '') => {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const candidate of candidateKeys) {
          const cleanCand = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanKey === cleanCand || cleanKey.includes(cleanCand)) {
            const val = String(row[key]).trim();
            if (val) return val;
          }
        }
      }
      return defaultVal;
    };

    console.log(`\n⏳ Importing student records into Supabase Database... (Default Password: ${defaultPassword})\n`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const name = getVal(row, ['name', 'fullname', 'studentname', 'candidatename'], `Student ${i + 1}`);
      const rollNumber = getVal(row, ['rollno', 'rollnumber', 'enrollmentno', 'enrolmentno', 'studentid', 'id', 'registrationno'], '');
      let email = getVal(row, ['email', 'emailid', 'universityemail', 'collegeemail', 'emailaddress'], '');
      const department = getVal(row, ['department', 'branch', 'course', 'stream', 'program', 'specialization'], 'B.Tech Computer Science & Engineering');
      const batch = getVal(row, ['batch', 'year', 'passingyear', 'graduationyear'], '2027');
      const phone = getVal(row, ['phone', 'phoneno', 'contact', 'mobile', 'mobileno'], '');

      // Sanitize email formatting typos (e.g. ,ac.in -> .ac.in)
      if (email) {
        email = email.replace(/,/g, '.').toLowerCase();
      }

      // Auto-generate official email if missing but roll number exists
      if (!email && rollNumber) {
        email = `${rollNumber.toLowerCase()}@paruluniversity.ac.in`;
      }

      if (!email) {
        console.warn(`⚠️ Row ${i + 2}: Skipping row (No email or roll number found for name "${name}")`);
        skippedCount++;
        continue;
      }

      // Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      let userId;

      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        // Create in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            name: name,
            role: 'student',
            university_id: uni.id,
            department: department,
            roll_number: rollNumber,
            batch: batch
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            const { data: listData } = await supabase.auth.admin.listUsers();
            const foundUser = listData?.users?.find(u => u.email === email);
            if (foundUser) userId = foundUser.id;
          } else {
            console.error(`❌ Row ${i + 2}: Auth creation error for ${email}: ${authError.message}`);
            errorCount++;
            continue;
          }
        } else {
          userId = authData.user.id;
        }
      }

      if (userId) {
        // Upsert into public.profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            name: name,
            email: email,
            role: 'student',
            university_id: uni.id,
            phone: phone || null,
            department: department || null,
            roll_number: rollNumber || null,
            batch: batch || null
          });

        if (profileError) {
          console.error(`❌ Row ${i + 2}: Profile database error for ${email}: ${profileError.message}`);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 10 === 0 || i === rows.length - 1) {
            console.log(`   Progress: ${successCount}/${rows.length} records processed...`);
          }
        }
      }
    }

    console.log(`\n==================================================`);
    console.log(`🎉 Excel Import Completed Successfully!`);
    console.log(`==================================================`);
    console.log(`✅ Total Successfully Fed to Supabase: ${successCount}`);
    console.log(`⚠️ Total Skipped: ${skippedCount}`);
    console.log(`❌ Total Errors: ${errorCount}`);
    console.log(`🔑 All Accounts Default Password: ${defaultPassword}`);
    console.log(`==================================================\n`);

    process.exit(0);

  } catch (error) {
    console.error('Fatal error during Excel import:', error);
    process.exit(1);
  }
};

runExcelImport();
