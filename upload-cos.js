const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

// TODO: 从环境变量或安全存储获取，不要硬编码
const cos = new COS({
  SecretId: process.env.TENCENT_CLOUD_SECRET_ID || 'YOUR_SECRET_ID',
  SecretKey: process.env.TENCENT_CLOUD_SECRET_KEY || 'YOUR_SECRET_KEY'
});

const bucket = 'shotforge-1409356776';
const region = 'ap-hongkong';

async function uploadDir(dirPath, prefix = '') {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    const cosKey = prefix ? `${prefix}/${file.name}` : file.name;
    
    if (file.isDirectory()) {
      await uploadDir(fullPath, cosKey);
    } else {
      await new Promise((resolve, reject) => {
        cos.putObject({
          Bucket: bucket,
          Region: region,
          Key: cosKey,
          Body: fs.createReadStream(fullPath),
          ContentLength: fs.statSync(fullPath).size
        }, (err, data) => {
          if (err) {
            console.error(`❌ Failed: ${cosKey}`, err);
            reject(err);
          } else {
            console.log(`✅ Uploaded: ${cosKey}`);
            resolve(data);
          }
        });
      });
    }
  }
}

async function main() {
  const appDir = path.join(__dirname, '../app');
  
  // Upload .next/static
  const staticSrc = path.join(appDir, '.next/static');
  console.log('📤 Uploading .next/static...');
  await uploadDir(staticSrc, '.next/static');
  
  // Upload public
  const publicDir = path.join(appDir, 'public');
  if (fs.existsSync(publicDir)) {
    console.log('📤 Uploading public/...');
    await uploadDir(publicDir, 'public');
  }
  
  console.log('✅ Done!');
}

main().catch(console.error);
