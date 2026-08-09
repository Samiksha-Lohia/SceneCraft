
const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const email = `test_${randomSuffix}@example.com`;
  const password = 'TestPassword123!';
  const name = 'Test User';

  console.log(`1. Attempting to register guest account: ${email}...`);
  try {
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const registerData = await registerRes.json();
    console.log('Register Response Status:', registerRes.status);
    console.log('Register Response Body:', JSON.stringify(registerData, null, 2));

    if (!registerRes.ok) {
      console.log('Registration failed, attempting login as fallback...');
    }

    const tokens = registerData.data?.tokens;
    if (!tokens || !tokens.accessToken) {
      console.error('No tokens returned in response.');
      return;
    }

    const token = tokens.accessToken;
    console.log('\n2. Testing GET /api/documents with Authorization header...');
    const getRes = await fetch(`${BASE_URL}/documents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const getData = await getRes.json();
    console.log('GET Documents Status:', getRes.status);
    console.log('GET Documents Response Body:', JSON.stringify(getData, null, 2));

  } catch (err) {
    console.error('Test script error:', err);
  }
}

runTest();
