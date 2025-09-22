// utils/s3.js
const AWS = require('aws-sdk');

if (!process.env.S3_BUCKET_NAME) {
  console.warn('Warning: AWS_BUCKET_NAME is not set in environment variables.');
}

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * Uploads a Buffer to S3 and returns the public URL (Location).
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimeType
 * @param {string} folder (optional) — e.g. 'news'
 * @returns {Promise<string>} public URL
 */
async function uploadFile(buffer, originalName, mimeType, folder = '') {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('AWS_BUCKET_NAME is not configured.');
  }

  const Key = `${folder ? folder.replace(/\/+$/, '') + '/' : ''}${Date.now()}_${originalName}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read',
  };

  const result = await s3.upload(params).promise();
  return result.Location; // public URL
}

module.exports = {
  uploadFile,
  s3Client: s3,
};
