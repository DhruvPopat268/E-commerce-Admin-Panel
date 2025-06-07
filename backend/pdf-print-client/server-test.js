const https = require('https');
const http = require('http');

// ⚠️ Replace with your actual Render app URL
const SERVER_URL = 'https://e-commerce-admin-frontend.onrender.com';

console.log('🔍 Testing server Socket.IO configuration...');
console.log('🎯 Server:', SERVER_URL);

// Test 1: Check if server is responding
const testServerHealth = () => {
  return new Promise((resolve, reject) => {
    console.log('\n📡 Test 1: Basic server health check...');
    
    const req = https.get(SERVER_URL, (res) => {
      console.log(`✅ Server HTTP Status: ${res.statusCode}`);
      console.log(`📋 Server Headers:`, res.headers);
      resolve(res.statusCode);
    });
    
    req.on('error', (err) => {
      console.error('❌ Server health check failed:', err.message);
      reject(err);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
};

// Test 2: Check Socket.IO endpoint
const testSocketIOEndpoint = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🔌 Test 2: Socket.IO endpoint check...');
    
    const socketIOUrl = SERVER_URL.replace('https://', '').replace('http://', '');
    const testUrl = `https://${socketIOUrl}/socket.io/`;
    
    console.log('🎯 Testing:', testUrl);
    
    const req = https.get(testUrl, (res) => {
      console.log(`📡 Socket.IO endpoint status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 && data.includes('Missing "upgrade" header')) {
          console.log('✅ Socket.IO server is running and accessible!');
          resolve(true);
        } else if (res.statusCode === 200) {
          console.log('✅ Socket.IO endpoint responded (might be configured differently)');
          console.log('📄 Response preview:', data.substring(0, 200));
          resolve(true);
        } else {
          console.log('⚠️  Socket.IO endpoint returned unexpected response');
          console.log('📄 Response:', data.substring(0, 200));
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Socket.IO endpoint test failed:', err.message);
      reject(err);
    });
    
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('Socket.IO endpoint timeout'));
    });
  });
};

// Test 3: Check CORS headers
const testCORSHeaders = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🌐 Test 3: CORS headers check...');
    
    const options = {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type'
      }
    };
    
    const req = https.request(SERVER_URL, options, (res) => {
      console.log('📋 CORS response headers:');
      Object.keys(res.headers).forEach(key => {
        if (key.toLowerCase().includes('cors') || key.toLowerCase().includes('access-control')) {
          console.log(`   ${key}: ${res.headers[key]}`);
        }
      });
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('⚠️  CORS test failed (might not be configured):', err.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
};

// Main test function
const runAllTests = async () => {
  try {
    console.log('🚀 Starting comprehensive server tests...\n');
    
    // Test 1: Basic health
    try {
      const status = await testServerHealth();
      if (status >= 400) {
        console.log('⚠️  Server returned error status, but might still work for Socket.IO');
      }
    } catch (error) {
      console.error('❌ Server seems to be down or unreachable');
      return;
    }
    
    // Test 2: Socket.IO endpoint
    try {
      const socketIOWorking = await testSocketIOEndpoint();
      if (!socketIOWorking) {
        console.log('❌ Socket.IO doesn\'t seem to be properly configured on the server');
        console.log('💡 Make sure your server has Socket.IO set up with proper CORS');
      }
    } catch (error) {
      console.error('❌ Socket.IO endpoint test failed:', error.message);
      console.log('💡 This suggests Socket.IO is not configured on your server');
    }
    
    // Test 3: CORS
    await testCORSHeaders();
    
    console.log('\n📊 Test Summary:');
    console.log('═'.repeat(50));
    console.log('If Socket.IO endpoint test FAILED:');
    console.log('  ❌ Your server doesn\'t have Socket.IO properly set up');
    console.log('  💡 You need to add Socket.IO server code to your backend');
    console.log('');
    console.log('If Socket.IO endpoint test PASSED:');
    console.log('  ✅ Server has Socket.IO configured');
    console.log('  💡 The issue might be with connection settings or CORS');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Check your server logs in Render dashboard');
    console.log('  2. Verify Socket.IO server code is deployed');
    console.log('  3. Try the updated print client with polling transport');
    
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
  }
};

runAllTests();