const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const https = require('https');

// ⚠️ IMPORTANT: This should be your BACKEND URL, not frontend!
const SERVER_URL = 'https://e-commerce-admin-backend.onrender.com'; // Fixed: Backend URL

// Your printer name (exactly as shown in Windows)
// For automatic PDF saving, use a physical printer or network printer
// Microsoft Print to PDF requires manual save dialog interaction
const PRINTER_NAME = 'Microsoft Print to PDF'; // Change this to your exact printer name
const PDF_SAVE_PATH = path.join(os.homedir(), 'Documents', 'Invoices'); // Auto-save location

console.log('🖨️  PDF Print Client Starting...');
console.log('🔌 Server URL:', SERVER_URL);

// Auto wake-up function for Render
const wakeUpRenderServer = async () => {
  console.log('🔄 Checking if server needs wake-up...');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(SERVER_URL, (res) => {
      const responseTime = Date.now() - startTime;
      console.log(`📡 Server responded: ${res.statusCode} (${responseTime}ms)`);
      
      if (responseTime > 10000) {
        console.log('⏰ Slow response - server was probably sleeping');
        console.log('⏳ Waiting 30 seconds for full wake-up...');
        setTimeout(() => resolve(true), 30000);
      } else {
        console.log('✅ Server was already awake');
        resolve(true);
      }
    });
    
    req.on('error', (err) => {
      console.log('⚠️  Server wake-up request failed - this is normal for sleeping servers');
      console.log('⏳ Waiting 45 seconds for wake-up...');
      setTimeout(() => resolve(true), 45000);
    });
    
    req.setTimeout(60000, () => {
      req.destroy();
      console.log('⏰ Wake-up request timed out - server might be sleeping');
      console.log('⏳ Waiting 60 seconds for wake-up...');
      setTimeout(() => resolve(true), 60000);
    });
  });
};

// Socket.IO connection with CORS and Render-specific settings
let socket;
const createConnection = () => {
  console.log('🔧 Using Render-optimized Socket.IO settings with CORS support...');
  
  socket = io(SERVER_URL, {
    // CORS Configuration - CRITICAL for your error
    withCredentials: true, // This fixes the CORS credentials error
    
    // Connection settings
    reconnection: true,
    reconnectionDelay: 5000,
    reconnectionDelayMax: 30000,
    reconnectionAttempts: 15,
    timeout: 60000, // 60 seconds for Render
    forceNew: true,
    
    // Transport settings - start with polling for better CORS compatibility
    transports: ['polling', 'websocket'], // Allow both, start with polling
    upgrade: true, // Allow upgrade to websocket after successful polling
    rememberUpgrade: false,
    
    // Render-specific options
    closeOnBeforeunload: false,
    autoConnect: true,
    
    // Additional CORS-related options
    extraHeaders: {
      'Access-Control-Allow-Credentials': 'true'
    }
  });
  
  setupSocketHandlers();
};

// Create temp directory for PDFs
const tempDir = path.join(os.tmpdir(), 'invoice-pdfs');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Connection tracking
let connectionAttempts = 0;
let isConnected = false;

// Setup all socket event handlers
const setupSocketHandlers = () => {
  // Register as print client when connected
  socket.on('connect', () => {
    console.log('✅ Connected to server successfully!');
    console.log('🔗 Connection ID:', socket.id);
    isConnected = true;
    connectionAttempts = 0;
    
    socket.emit('register-print-client', {
      clientName: 'PDF Print Client - Microsoft Print to PDF',
      location: 'Main Office',
      printerModel: 'Microsoft Print to PDF',
      type: 'PDF_PRINTER'
    });
  });

  // Handle registration success
  socket.on('registration-success', (data) => {
    console.log('✅ PDF Print client registered successfully');
    console.log('🖨️  Ready to receive PDF print jobs...');
    console.log('📄 Waiting for orders...\n');
  });

  // Handle registration error
  socket.on('registration-error', (error) => {
    console.error('❌ Registration failed:', error.message || error);
  });

  // Handle PDF print command from server
  socket.on('print-pdf-invoice', async (data) => {
    console.log(`\n📄 NEW PDF PRINT JOB RECEIVED!`);
    console.log(`📋 Order ID: ${data.orderId}`);
    console.log(`⏰ Time: ${new Date(data.timestamp).toLocaleString()}`);
    
    try {
      // Validate data
      if (!data.pdfBuffer || !data.orderId) {
        throw new Error('Invalid print job data received');
      }
      
      // Save PDF buffer to temporary file
      const tempPdfPath = path.join(tempDir, `invoice_${data.orderId}_${Date.now()}.pdf`);
      fs.writeFileSync(tempPdfPath, Buffer.from(data.pdfBuffer));
      
      console.log('📁 PDF saved to temp location');
      console.log('🖨️  Sending to printer...');
      
      // Print the PDF
      await printPDF(tempPdfPath, data.orderId);
      
      // Clean up temp file after 30 seconds
      setTimeout(() => {
        try {
          if (fs.existsSync(tempPdfPath)) {
            fs.unlinkSync(tempPdfPath);
            console.log('🗑️  Temp PDF file cleaned up');
          }
        } catch (err) {
          console.error('Failed to clean up temp file:', err.message);
        }
      }, 30000);
      
      // Confirm print completion to server
      socket.emit('print-completed', {
        orderId: data.orderId,
        timestamp: new Date(),
        success: true,
        type: 'PDF'
      });
      
      console.log(`✅ PDF Invoice printed successfully!`);
      console.log(`📄 Waiting for next order...\n`);
      
    } catch (error) {
      console.error(`❌ PDF Print failed for Order: ${data.orderId}`);
      console.error('Error:', error.message);
      
      // Report print error to server
      socket.emit('print-error', {
        orderId: data.orderId,
        error: error.message,
        timestamp: new Date(),
        type: 'PDF'
      });
    }
  });

  // Enhanced connection error handling with CORS debugging
  socket.on('connect_error', async (error) => {
    connectionAttempts++;
    console.error(`❌ Connection failed (attempt ${connectionAttempts}):`, error.message);
    
    // Check if it's a CORS error
    if (error.message.includes('CORS') || error.message.includes('credentials')) {
      console.error('🚫 CORS Error Detected!');
      console.error('💡 Make sure your backend has CORS configured with:');
      console.error('   - credentials: true');
      console.error('   - origin: your frontend URL');
      console.error('   - proper Socket.IO CORS settings');
    }
    
    if (connectionAttempts === 1) {
      console.log('🔧 This might be because the Render server is sleeping...');
    }
    
    if (connectionAttempts === 3) {
      console.log('🔄 Server might be sleeping. Attempting wake-up...');
      await wakeUpRenderServer();
      console.log('✅ Wake-up complete, retrying connection...');
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from server:', reason);
    isConnected = false;
    
    if (reason !== 'io client disconnect') {
      console.log('🔄 Attempting to reconnect...');
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Reconnected after ${attemptNumber} attempts`);
    connectionAttempts = 0;
  });
};

// Function to print PDF
const printPDF = async (pdfPath, orderId) => {
  return new Promise((resolve, reject) => {
    // Verify PDF file exists
    if (!fs.existsSync(pdfPath)) {
      reject(new Error('PDF file not found'));
      return;
    }
    
    // Create invoices directory if it doesn't exist
    if (!fs.existsSync(PDF_SAVE_PATH)) {
      fs.mkdirSync(PDF_SAVE_PATH, { recursive: true });
    }
    
    let printCommand;
    
    if (os.platform() === 'win32') {
      // For Microsoft Print to PDF, copy file to Documents/Invoices instead
      // because "Microsoft Print to PDF" requires manual dialog interaction
      if (PRINTER_NAME === 'Microsoft Print to PDF') {
        const savedPdfPath = path.join(PDF_SAVE_PATH, `Invoice_${orderId}_${Date.now()}.pdf`);
        
        try {
          fs.copyFileSync(pdfPath, savedPdfPath);
          console.log(`📁 PDF automatically saved to: ${savedPdfPath}`);
          
          // Optional: Open the saved PDF
          exec(`start "" "${savedPdfPath}"`, (error) => {
            if (error) {
              console.log('Note: Could not auto-open PDF, but it was saved successfully');
            } else {
              console.log('📖 PDF opened for viewing');
            }
          });
          
          resolve();
          return;
        } catch (copyError) {
          console.error('Failed to save PDF:', copyError.message);
          reject(copyError);
          return;
        }
      }
      
      // For other printers, use normal print command
      printCommand = `powershell -Command "Start-Process -FilePath '${pdfPath}' -Verb Print -WindowStyle Hidden -Wait"`;
      
      // Alternative for SumatraPDF (better for automated printing):
      // printCommand = `"C:\\Program Files\\SumatraPDF\\SumatraPDF.exe" -print-to "${PRINTER_NAME}" "${pdfPath}" -silent`;
      
    } else if (os.platform() === 'darwin') {
      // macOS
      printCommand = `lpr -P "${PRINTER_NAME}" "${pdfPath}"`;
    } else {
      // Linux
      printCommand = `lp -d "${PRINTER_NAME}" "${pdfPath}"`;
    }

    console.log('📤 Executing print command...');
    
    const execOptions = {
      timeout: 30000, // 30 second timeout
      killSignal: 'SIGKILL'
    };
    
    exec(printCommand, execOptions, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Print command failed:', error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.log('⚠️  Print stderr:', stderr);
      }
      
      if (stdout) {
        console.log('📤 Print stdout:', stdout);
      }
      
      console.log('🖨️  Print command executed successfully');
      resolve();
    });
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down print client...');
  if (socket) {
    socket.disconnect();
  }
  process.exit(0);
});

// Main startup sequence
const startClient = async () => {
  try {
    console.log('🚀 Starting PDF Print Client...');
    
    // Step 1: Wake up server if needed
    await wakeUpRenderServer();
    
    // Step 2: Create and connect socket
    console.log('🔌 Connecting to server...');
    createConnection();
    
    console.log('✅ Print client is ready!');
    console.log('⚠️  Make sure your printer is connected!');
    console.log('💡 For best results, install SumatraPDF from sumatrapdfreader.org');
    console.log('📝 Update SERVER_URL and PRINTER_NAME in this file before running');
    console.log('🔧 CORS credentials enabled for backend communication\n');
    
  } catch (error) {
    console.error('❌ Failed to start client:', error.message);
    process.exit(1);
  }
};

// Start the client
startClient();