/**
 * Test HTTP API Auth Endpoints on Port 5000
 */

async function runHttpTests() {
  console.log('Testing HTTP Endpoints on http://localhost:5000/api/auth ...');

  const testEmail = `captain_${Date.now()}@marine.in`;
  const password = 'Password@123';

  // 1. Signup
  const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Captain Murugan',
      email: testEmail,
      password: password,
      role: 'Trawler Captain'
    })
  });
  const signupData = await signupRes.json();
  console.log('Signup Status:', signupRes.status, signupData);
  if (signupRes.status !== 201 || !signupData.token) {
    throw new Error('Signup failed');
  }

  // 2. Duplicate signup should fail
  const dupRes = await fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Captain',
      email: testEmail,
      password: password
    })
  });
  const dupData = await dupRes.json();
  console.log('Duplicate Signup Status (expected 400):', dupRes.status, dupData);
  if (dupRes.status !== 400) {
    throw new Error('Duplicate check failed');
  }

  // 3. Login with wrong password
  const wrongLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'wrongPassword'
    })
  });
  const wrongLoginData = await wrongLoginRes.json();
  console.log('Wrong Password Status (expected 401):', wrongLoginRes.status, wrongLoginData);
  if (wrongLoginRes.status !== 401 || wrongLoginData.error !== 'Invalid email or password') {
    throw new Error('Wrong password check failed or leaked info');
  }

  // 4. Login with correct password
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: password
    })
  });
  const loginData = await loginRes.json();
  console.log('Correct Login Status (expected 200):', loginRes.status, loginData);
  if (loginRes.status !== 200 || !loginData.token) {
    throw new Error('Login failed');
  }

  // 5. GET /api/auth/me with Bearer token
  const meRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${loginData.token}`
    }
  });
  const meData = await meRes.json();
  console.log('/me Status (expected 200):', meRes.status, meData);
  if (meRes.status !== 200 || meData.user.email !== testEmail) {
    throw new Error('/me check failed');
  }

  // 6. GET /api/auth/me with invalid token
  const badMeRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: {
      'Authorization': 'Bearer invalid.token.value'
    }
  });
  console.log('Bad token /me Status (expected 401):', badMeRes.status);
  if (badMeRes.status !== 401) {
    throw new Error('Bad token should be 401');
  }

  console.log('\n🎉 ALL HTTP AUTH ENDPOINTS WORKING 100%!');
}

runHttpTests().catch(err => {
  console.error('HTTP Test failed:', err);
  process.exit(1);
});
