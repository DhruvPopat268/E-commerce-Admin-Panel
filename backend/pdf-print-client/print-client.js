const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// ⚠️ IMPORTANT: Replace with your actual Render app URL
const SERVER_URL = 'https://e-commerce-admin-frontend.onrender.com'; // Change this!

// Your printer name (exactly as shown in Windows)
const PRINTER_NAME = 'EPSON M100 Series'; // Change this to your exact printer name

console.log('🖨️  PDF Print Client Starting...');
console.log('🔌 Connecting to server:', SERVER_URL);

// Connect to your Render server
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  maxReconnectionAttempts: 10
});

// Create temp directory for PDFs
const tempDir = path.join(os.tmpdir(), 'invoice-pdfs');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Register as print client when connected
socket.on('connect', () => {
  console.log('✅ Connected to server successfully!');
  
  socket.emit('register-print-client', {
    clientName: 'PDF Print Client - EPSON M100',
    location: 'Main Office',
    printerModel: 'EPSON M100 Series',
    type: 'PDF_PRINTER'
  });
});

// Handle registration success
socket.on('registration-success', (data) => {
  console.log('✅ PDF Print client registered successfully');
  console.log('🖨️  Ready to receive PDF print jobs...');
  console.log('📄 Waiting for orders...\n');
});

// Handle PDF print command from server
socket.on('print-pdf-invoice', async (data) => {
  console.log(`\n📄 NEW PDF PRINT JOB RECEIVED!`);
  console.log(`📋 Order ID: ${data.orderId}`);
  console.log(`⏰ Time: ${new Date(data.timestamp).toLocaleString()}`);
  
  try {
    // Save PDF buffer to temporary file
    const tempPdfPath = path.join(tempDir, `invoice_${data.orderId}_${Date.now()}.pdf`);
    fs.writeFileSync(tempPdfPath, data.pdfBuffer);
    
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

// Function to print PDF
const printPDF = async (pdfPath, orderId) => {
  return new Promise((resolve, reject) => {
    let printCommand;
    
    if (os.platform() === 'win32') {
      // Windows - Multiple options for printing
      
      // Option 1: Using PowerShell (Default Windows PDF viewer)
      printCommand = `powershell -Command "Start-Process -FilePath '${pdfPath}' -Verb Print -WindowStyle Hidden"`;
      
      // Option 2: Using SumatraPDF (Recommended - Download from sumatrapdfreader.org)
      // Uncomment below line if you install SumatraPDF
      // printCommand = `"C:\\Program Files\\SumatraPDF\\SumatraPDF.exe" -print-to "${PRINTER_NAME}" "${pdfPath}" -silent`;
      
      // Option 3: Using Adobe Reader (if installed)
      // printCommand = `"C:\\Program Files\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe" /t "${pdfPath}" "${PRINTER_NAME}"`;
      
    } else if (os.platform() === 'darwin') {
      // macOS
      printCommand = `lpr -P "${PRINTER_NAME}" "${pdfPath}"`;
    } else {
      // Linux
      printCommand = `lp -d "${PRINTER_NAME}" "${pdfPath}"`;
    }

    console.log('📤 Executing print command...');
    console.log('🖨️  Command:', printCommand);
    
    exec(printCommand, (error, stdout, stderr) => {
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

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  console.log('🔄 Retrying connection...');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from server:', reason);
  if (reason !== 'io client disconnect') {
    console.log('🔄 Attempting to reconnect...');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down print client...');
  socket.disconnect();
  process.exit(0);
});

console.log('🚀 PDF Print Client Ready!');
console.log('⚠️  Make sure your EPSON M100 printer is connected!');
console.log('💡 For best results, install SumatraPDF from sumatrapdfreader.org');
console.log('📝 Update SERVER_URL and PRINTER_NAME in this file before running');