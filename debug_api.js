const API_BASE_URL = 'http://134.112.56.39:8000';

async function testAPI() {
  console.log('🔍 Testing API connectivity...\n');
  
  // Test 1: Basic connectivity
  console.log('1️⃣ Testing basic connectivity...');
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    console.log(`✅ Server is reachable - Status: ${response.status}`);
    const data = await response.text();
    console.log(`📄 Root response: ${data}\n`);
  } catch (error) {
    console.log(`❌ Server is NOT reachable: ${error.message}\n`);
    return;
  }

  // Test 2: Check docs endpoint
  console.log('2️⃣ Testing docs endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/docs`);
    console.log(`📚 Docs endpoint - Status: ${response.status}\n`);
  } catch (error) {
    console.log(`❌ Docs endpoint failed: ${error.message}\n`);
  }

  // Test 3: Check auth/register endpoint specifically
  console.log('3️⃣ Testing auth/register endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test_user_' + Date.now(),
        email: 'test@example.com',
        password: 'testpass123'
      })
    });
    
    console.log(`📝 Register endpoint - Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 Response: ${responseText}\n`);
    
    if (response.status === 404) {
      console.log('❌ 404 means the endpoint does not exist!');
      console.log('🔍 Let\'s check what endpoints are available...\n');
    }
  } catch (error) {
    console.log(`❌ Register test failed: ${error.message}\n`);
  }

  // Test 4: Check available endpoints via OpenAPI
  console.log('4️⃣ Testing OpenAPI spec...');
  try {
    const response = await fetch(`${API_BASE_URL}/openapi.json`);
    if (response.ok) {
      const spec = await response.json();
      console.log('📋 Available endpoints:');
      Object.keys(spec.paths).forEach(path => {
        const methods = Object.keys(spec.paths[path]);
        console.log(`  ${path} - Methods: ${methods.join(', ')}`);
      });
    }
  } catch (error) {
    console.log(`❌ OpenAPI spec failed: ${error.message}`);
  }
}

// Run the test
testAPI().catch(console.error); 