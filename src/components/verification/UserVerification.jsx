import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { FaCloudUploadAlt, FaLink, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../config/firebase';
import toast from 'react-hot-toast';

const UserVerification = ({ user, onVerificationComplete }) => {
  const [verificationMethod, setVerificationMethod] = useState('upload'); // 'upload' or 'link'
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  // Accepted file types for verification documents
  const acceptedFileTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  // Validate Google Drive link
  const isValidGoogleDriveLink = (link) => {
    const patterns = [
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/,
      /^https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/,
      /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+/,
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+/
    ];
    return patterns.some(pattern => pattern.test(link));
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!acceptedFileTypes.includes(file.type)) {
      toast.error('Please upload a valid document (JPG, PNG, WEBP, or PDF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  // Handle file upload to Firebase Storage
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const filename = `verification/${user.uid}/${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, filename);

      // Upload file
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Update user document in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        verificationDocument: downloadURL,
        verificationMethod: 'upload',
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date().toISOString()
      });

      toast.success('Verification document uploaded successfully!');
      onVerificationComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Google Drive link submission
  const handleGoogleDriveLinkSubmit = async () => {
    if (!googleDriveLink.trim()) {
      toast.error('Please enter a Google Drive link');
      return;
    }

    if (!isValidGoogleDriveLink(googleDriveLink)) {
      toast.error('Please enter a valid Google Drive link');
      return;
    }

    setUploading(true);

    try {
      // Update user document in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        verificationDocument: googleDriveLink,
        verificationMethod: 'google_drive',
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date().toISOString()
      });

      toast.success('Google Drive link submitted successfully!');
      onVerificationComplete();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit link. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Verify Your Account
        </h2>
        <p className="text-gray-600">
          Please submit a verification document to access all features
        </p>
      </div>

      {/* Verification Method Toggle */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setVerificationMethod('upload')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            verificationMethod === 'upload'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FaCloudUploadAlt />
          Upload File
        </button>
        <button
          onClick={() => setVerificationMethod('link')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            verificationMethod === 'link'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FaLink />
          Google Drive Link
        </button>
      </div>

      {/* Upload Method */}
      {verificationMethod === 'upload' && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              id="fileUpload"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="fileUpload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FaCloudUploadAlt className="text-5xl text-gray-400 mb-3" />
              <p className="text-gray-700 font-semibold mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                JPG, PNG, WEBP, or PDF (max 5MB)
              </p>
            </label>
          </div>

          {/* File Preview */}
          {selectedFile && (
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-500 text-xl" />
                  <div>
                    <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTimesCircle className="text-xl" />
                </button>
              </div>

              {/* Image Preview */}
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
              )}
            </Motion.div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FaCloudUploadAlt />
                Submit Verification
              </>
            )}
          </button>
        </Motion.div>
      )}

      {/* Google Drive Link Method */}
      {verificationMethod === 'link' && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <FaLink />
              How to share your Google Drive document:
            </h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Upload your verification document to Google Drive</li>
              <li>Right-click the file and select "Get link"</li>
              <li>Set sharing to "Anyone with the link can view"</li>
              <li>Copy and paste the link below</li>
            </ol>
          </div>

          {/* Link Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Google Drive Link
            </label>
            <input
              type="url"
              value={googleDriveLink}
              onChange={(e) => setGoogleDriveLink(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
            {googleDriveLink && !isValidGoogleDriveLink(googleDriveLink) && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <FaTimesCircle />
                Please enter a valid Google Drive link
              </p>
            )}
            {googleDriveLink && isValidGoogleDriveLink(googleDriveLink) && (
              <p className="text-sm text-green-500 flex items-center gap-1">
                <FaCheckCircle />
                Valid Google Drive link
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleGoogleDriveLinkSubmit}
            disabled={!googleDriveLink || !isValidGoogleDriveLink(googleDriveLink) || uploading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FaLink />
                Submit Link
              </>
            )}
          </button>
        </Motion.div>
      )}

      {/* Accepted Documents Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-700 mb-2">Accepted Documents:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Government-issued ID (Aadhaar, PAN, Passport, Driving License)</li>
          <li>• Student ID or Employee ID</li>
          <li>• Any official document with your photo and name</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Your document will be reviewed within 24-48 hours. You'll receive a notification once verified.
        </p>
      </div>
    </Motion.div>
  );
};

export default UserVerification;