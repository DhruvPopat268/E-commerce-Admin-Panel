const https = require('https');

// ⚠️ Replace with your actual Render app URL
const SERVER_URL = 'https://e-commerce-admin-frontend.onrender.com';

console.log('🔄 Waking up Render server...');
console.log('🎯 Target:', SERVER_URL);

const wakeUpServer = () => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.get(SERVER_URL, (res) => {
      const responseTime = Date.now() - startTime;
      console.log(`✅ Server responded with status: ${res.statusCode}`);
      console.log(`⏱️  Response time: ${responseTime}ms`);
      
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log('🎉 Server is awake and responding!');
        resolve(true);
      } else {
        console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.error('❌ Wake-up request failed:', err.message);
      console.log('💡 This might mean the server is still sleeping or there\'s a network issue');
      reject(err);
    });
    
    req.setTimeout(60000, () => {
      req.destroy();
      console.log('⏰ Request timed out after 60 seconds');
      console.log('💡 Server might be taking longer to wake up, try again in a minute');
      reject(new Error('Timeout'));
    });
  });
};

const main = async () => {
  try {
    console.log('📡 Sending wake-up request...');
    await wakeUpServer();
    
    console.log('\n🚀 Server should be awake now!');
    console.log('💡 Wait 10-15 seconds, then start your print client');
    console.log('📝 If it still fails, the server might have deployment issues');
    
  } catch (error) {
    console.log('\n⚠️  Wake-up failed, but this is normal for sleeping servers');
    console.log('🔄 Render servers can take 30-60 seconds to fully wake up');
    console.log('💡 Try the following:');
    console.log('   1. Wait 1-2 minutes and run this script again');
    console.log('   2. Visit your server URL in a browser first');
    console.log('   3. Check Render dashboard for deployment errors');
    console.log('   4. Verify your server URL is correct');
  }
};

main();