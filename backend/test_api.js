async function run() {
  try {
    // Login as Jimit
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: 'jimit@paruluniversity.ac.in',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log("Login data:", loginData);
    const token = loginData.token;
    console.log("Logged in!");

    const msgRes = await fetch('http://localhost:5000/api/messages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const msgData = await msgRes.json();
    console.log("Messages from API:", JSON.stringify(msgData, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
