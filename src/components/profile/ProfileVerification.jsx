import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { 
  submitVerificationRequest, 
  getProfile,
  ACCOUNT_TYPES 
} from '../../services/profileService';
import toast from 'react-hot-toast';
import { 
  FaIdCard, 
  FaCheckCircle, 
  FaShieldAlt,
  FaExclamationTriangle,
  FaPlus,
  FaTrash
} from 'react-icons/fa';

const ProfileVerification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentInput, setDocumentInput] = useState({
    type: '',
    documentNumber: '',
    issuingAuthority: '',
    expiryDate: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          navigate('/auth');
          return;
        }

        const profileData = await getProfile(user.uid);
        
        if (!profileData) {
          toast.error('Please complete your profile first');
          navigate('/profile/setup');
          return;
        }

        setProfile(profileData);

        // If already verified, redirect to write article
        if (profileData.verified) {
          toast.success('Your account is already verified!');
          setTimeout(() => {
            navigate('/articles/new');
          }, 1500);
        }

      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleDocumentInputChange = (e) => {
    const { name, value } = e.target;
    setDocumentInput(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDocument = () => {
    if (!documentInput.type || !documentInput.documentNumber) {
      toast.error('Please select document type and provide document number');
      return;
    }

    if (documents.some(doc => doc.type === documentInput.type)) {
      toast.error('Document type already added. Please choose a different type.');
      return;
    }

    setDocuments(prev => [...prev, { 
      ...documentInput,
      addedAt: new Date().toISOString()
    }]);
    
    setDocumentInput({
      type: '',
      documentNumber: '',
      issuingAuthority: '',
      expiryDate: ''
    });
    
    toast.success('Document added successfully');
  };

  const handleRemoveDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
    toast.success('Document removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile) {
      toast.error('Profile not found');
      return;
    }

    const minDocs = profile.accountType === 'reader' ? 0 :
                     profile.accountType === 'creator' ? 1 : 2;

    if (documents.length < minDocs) {
      toast.error(`Please add at least ${minDocs} document(s)`);
      return;
    }

    try {
      setSubmitting(true);
      const user = auth.currentUser;

      // Submit documents and auto-verify immediately
      await submitVerificationRequest(user.uid, documents, true); // true = auto-verify

      toast.success('Documents submitted successfully!');
      toast.success('Your account is now verified! 🎉');
      
      // Redirect to write article immediately
      setTimeout(() => {
        navigate('/articles/new');
      }, 2000);

    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error(error.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };
  const getDocumentOptions = () => {
    if (profile?.accountType === 'creator') {
      return [
        { value: 'govt_id', label: 'GOVERNMENT ISSUED ID' },
        { value: 'passport', label: 'PASSPORT' },
        { value: 'driving_license', label: 'DRIVING LICENSE' },
        { value: 'pan_card', label: 'PAN CARD' },
        { value: 'aadhaar_card', label: 'AADHAAR CARD' },
        { value: 'voter_id', label: 'VOTER ID' }
      ];
    } else if (profile?.accountType === 'journalist') {
      return [
        { value: 'govt_id', label: 'GOVERNMENT ISSUED ID' },
        { value: 'press_card', label: 'PRESS CARD' },
        { value: 'journalist_id', label: 'JOURNALIST ID CARD' },
        { value: 'employment_letter', label: 'EMPLOYMENT LETTER' },
        { value: 'portfolio', label: 'WORK PORTFOLIO' },
        { value: 'aadhaar_card', label: 'AADHAAR CARD' },
        { value: 'passport', label: 'PASSPORT' }
      ];
    } else if (profile?.accountType === 'organization') {
      return [
        { value: 'business_registration', label: 'BUSINESS REGISTRATION' },
        { value: 'tax_id', label: 'TAX ID DOCUMENT' },
        { value: 'gst_certificate', label: 'GST CERTIFICATE' },
        { value: 'incorporation_certificate', label: 'CERTIFICATE OF INCORPORATION' },
        { value: 'authorization_letter', label: 'AUTHORIZATION LETTER' }
      ];
    }
    return [
      { value: 'govt_id', label: 'GOVERNMENT ISSUED ID' },
      { value: 'passport', label: 'PASSPORT' },
      { value: 'aadhaar_card', label: 'AADHAAR CARD' },
      { value: 'pan_card', label: 'PAN CARD' },
      { value: 'voter_id', label: 'VOTER ID' }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const documentOptions = getDocumentOptions();
  const minDocs = profile?.accountType === 'reader' ? 0 :
                   profile?.accountType === 'creator' ? 1 : 2;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaShieldAlt className="text-primary text-3xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Account Verification
              </h1>
              <p className="text-gray-600">
                Submit your document details to start publishing
              </p>
            </div>
          </div>

          {profile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Required Documents for {profile.accountType}:
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                {profile.accountType === 'creator' && 'Provide at least 1 government-issued ID to verify your identity'}
                {profile.accountType === 'journalist' && 'Provide government-issued ID and press credentials'}
                {profile.accountType === 'organization' && 'Provide business registration and tax documents'}
                {profile.accountType === 'reader' && 'No verification required for readers'}
              </p>
              <p className="text-sm text-blue-700 font-medium">
                You need to provide at least {minDocs} document(s)
              </p>
              <div className="mt-3 bg-green-100 border border-green-300 rounded p-2">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Instant Verification: Start publishing immediately after submission!
                </p>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Add Document Details
            </h2>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  name="type"
                  value={documentInput.type}
                  onChange={handleDocumentInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary bg-white cursor-pointer"
                  required
                >
                  <option value="" disabled>-- Select Document Type --</option>
                  {documentOptions.map((doc) => (
                    <option key={doc.value} value={doc.value}>
                      {doc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Number / ID *
                  </label>
                  <input
                    type="text"
                    name="documentNumber"
                    value={documentInput.documentNumber}
                    onChange={handleDocumentInputChange}
                    placeholder="e.g., ABCDE1234F or 1234-5678-9012"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the unique number/code on your document
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuing Authority (Optional)
                  </label>
                  <input
                    type="text"
                    name="issuingAuthority"
                    value={documentInput.issuingAuthority}
                    onChange={handleDocumentInputChange}
                    placeholder="e.g., Government of India, State Dept."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date (if applicable)
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={documentInput.expiryDate}
                  onChange={handleDocumentInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="button"
                onClick={handleAddDocument}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium"
              >
                <FaPlus />
                Add Document
              </button>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Added Documents ({documents.length}/{minDocs}):
                </p>
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FaIdCard className="text-blue-600" />
                        <p className="font-semibold text-gray-900">
                          {doc.type.replace(/_/g, ' ').toUpperCase()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <strong>Document Number:</strong> {doc.documentNumber}
                        </p>
                        {doc.issuingAuthority && (
                          <p>
                            <strong>Issued By:</strong> {doc.issuingAuthority}
                          </p>
                        )}
                        {doc.expiryDate && (
                          <p>
                            <strong>Expiry Date:</strong> {new Date(doc.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(index)}
                      className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition"
                      title="Remove document"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <FaExclamationTriangle className="text-gray-400 text-3xl mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No documents added yet. Please add {minDocs} document(s).
                </p>
              </div>
            )}
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <FaCheckCircle />
              Instant Verification
            </h3>
            <ul className="text-sm text-green-800 list-disc ml-5 space-y-1">
              <li>Your documents will be stored securely in our database</li>
              <li>You can start writing and publishing articles immediately</li>
              <li>No waiting period required</li>
              <li>All features will be available instantly</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <FaExclamationTriangle />
              Important Notes
            </h3>
            <ul className="text-sm text-yellow-800 list-disc ml-5 space-y-1">
              <li>Ensure all document numbers are accurate and valid</li>
              <li>Documents should not be expired</li>
              <li>Information should match your profile details</li>
              <li>Providing false information may result in account suspension</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              🔒 Privacy & Security
            </h3>
            <p className="text-sm text-blue-800">
              Your document information is encrypted and stored securely. We only use this data for verification purposes and comply with all data protection regulations.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || documents.length < minDocs}
              className="flex-1 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </span>
              ) : (
                '✓ Submit & Start Publishing'
              )}
            </button>
          </div>

          {documents.length < minDocs && (
            <p className="text-center text-sm text-red-600">
              ⚠️ Please add at least {minDocs} document(s) before submission
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileVerification;