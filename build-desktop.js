const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building Ram Cycle Mart Desktop Application...\n');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('⚠️  Warning: .env file not found!');
  console.log('📝 Creating sample .env file...');
  
  const sampleEnv = `# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ramcyclemart

# Application Environment
NODE_ENV=production

# Optional: Uncomment and configure if using external services
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLIC_KEY=pk_test_...
`;
  
  fs.writeFileSync('.env', sampleEnv);
  console.log('✅ Sample .env created. Please edit it with your database details.\n');
}

// Build the application
try {
  console.log('🔨 Building web application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n🖥️  Building desktop executable...');
  
  // Determine platform and build accordingly
  const platform = process.platform;
  
  if (platform === 'win32') {
    console.log('🪟 Building Windows executable...');
    execSync('npx electron-builder --win', { stdio: 'inherit' });
    console.log('\n✅ Windows executable created in dist-electron folder!');
    console.log('📄 Look for: Ram Cycle Mart Setup.exe');
  } else if (platform === 'darwin') {
    console.log('🍎 Building macOS application...');
    execSync('npx electron-builder --mac', { stdio: 'inherit' });
    console.log('\n✅ macOS application created in dist-electron folder!');
    console.log('📄 Look for: Ram Cycle Mart.dmg');
  } else {
    console.log('🐧 Building Linux application...');
    execSync('npx electron-builder --linux', { stdio: 'inherit' });
    console.log('\n✅ Linux application created in dist-electron folder!');
    console.log('📄 Look for: Ram Cycle Mart.AppImage');
  }
  
  console.log('\n🎉 Build completed successfully!');
  console.log('\n📁 Your executable is ready in the dist-electron folder.');
  console.log('💡 You can now share this file with others to install the application.');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Make sure you have Node.js 18+ installed');
  console.log('2. Check that your .env file has the correct DATABASE_URL');
  console.log('3. Run "npm install" to ensure all dependencies are installed');
  console.log('4. Make sure you have enough disk space (build needs ~500MB)');
}