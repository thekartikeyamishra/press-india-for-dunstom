import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  submitGrievance, 
  GRIEVANCE_TYPES 
} from '../../services/grievanceService';
import toast from 'react-hot-toast';
import { FaExclamationTriangle, FaFileUpload, FaInfoCircle } from 'react-icons/fa';

const GrievanceForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('article');
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    description: '',
    relatedContentType: articleId ? 'article' : null,
    relatedContentId: articleId || '',
    relatedContentUrl: '',
    evidence: []
  });

  const [evidenceInput, setEvidenceInput] = useState({
    type: 'link',
    url: '',
    description: ''
  });

  const grievanceTypes = [
    {
      value: GRIEVANCE_TYPES.FAKE_NEWS,
      label: 'Fake News',
      description: 'Report fabricated or false information',
      icon: '🚫'
    },
    {
      value: GRIEVANCE_TYPES.MISINFORMATION,
      label: 'Misinformation',
      description: 'Report misleading or inaccurate content',
      icon: '⚠️'
    },
    {
      value: GRIEVANCE_TYPES.DEFAMATION,
      label: 'Defamation',
      description: 'Report false statements damaging reputation',
      icon: '📢'
    },
    {
      value: GRIEVANCE_TYPES.HATE_SPEECH,
      label: 'Hate Speech',
      description: 'Report discriminatory or hateful content',
      icon: '🛑'
    },
    {
      value: GRIEVANCE_TYPES.COPYRIGHT,
      label: 'Copyright Violation',
      description: 'Report unauthorized use of copyrighted material',
      icon: '©️'
    },
    {
      value: GRIEVANCE_TYPES.PRIVACY,
      label: 'Privacy Violation',
      description: 'Report unauthorized disclosure of private information',
      icon: '🔒'
    },
    {
      value: GRIEVANCE_TYPES.OFFENSIVE,
      label: 'Offensive Content',
      description: 'Report inappropriate or offensive material',
      icon: '⛔'
    },
    {
      value: GRIEVANCE_TYPES.SPAM,
      label: 'Spam',
      description: 'Report spam or promotional content',
      icon: '📧'
    },
    {
      value: GRIEVANCE_TYPES.OTHER,
      label: 'Other',
      description: 'Report other concerns',
      icon: '❓'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEvidence = () => {
    if (!evidenceInput.url) {
      toast.error('Please provide a URL or file');
      return;
    }

    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, { ...evidenceInput }]
    }));

    setEvidenceInput({
      type: 'link',
      url: '',
      description: ''
    });

    toast.success('Evidence added');
  };

  const handleRemoveEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.type) {
        throw new Error('Please select a grievance type');
      }

      if (formData.description.length < 50) {
        throw new Error('Please provide a detailed description (minimum 50 characters)');
      }

      const result = await submitGrievance(formData);

      toast.success(result.message);
      
      // Show reference number
      toast.success(`Reference Number: ${result.referenceNumber}`, {
        duration: 5000
      });

      // Navigate to grievances list
      setTimeout(() => {
        navigate('/grievances/my');
      }, 2000);

    } catch (error) {
      console.error('Error submitting grievance:', error);
      toast.error(error.message || 'Failed to submit grievance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaExclamationTriangle className="text-red-500 text-3xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Report Grievance
              </h1>
              <p className="text-gray-600">
                Help us maintain quality and accuracy
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-blue-600 text-lg mt-1" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Your Rights Under IT Rules, 2021:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>You will receive acknowledgment within 24 hours</li>
                  <li>Your grievance will be resolved within 15 days</li>
                  <li>You can track the status of your grievance</li>
                  <li>Your identity will be kept confidential</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grievance Type Selection */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              1. Select Grievance Type *
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {grievanceTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`text-left p-4 rounded-lg border-2 transition ${
                    formData.type === type.value
                      ? 'border-primary bg-primary bg-opacity-5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {type.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              2. Subject *
            </h2>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Brief summary of your grievance"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              3. Detailed Description *
            </h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide detailed information about your grievance. Include specific facts, dates, and context. (Minimum 50 characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              rows="8"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              {formData.description.length} characters (minimum 50 required)
            </p>
          </div>

          {/* Related Content */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              4. Related Content (Optional)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  name="relatedContentType"
                  value={formData.relatedContentType || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="">None</option>
                  <option value="article">Article</option>
                  <option value="news">News</option>
                  <option value="user">User Profile</option>
                </select>
              </div>

              {formData.relatedContentType && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content ID (if known)
                    </label>
                    <input
                      type="text"
                      name="relatedContentId"
                      value={formData.relatedContentId}
                      onChange={handleInputChange}
                      placeholder="Content ID or leave blank"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content URL
                    </label>
                    <input
                      type="url"
                      name="relatedContentUrl"
                      value={formData.relatedContentUrl}
                      onChange={handleInputChange}
                      placeholder="https://pressindia.com/article/..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              5. Supporting Evidence (Optional but Recommended)
            </h2>

            <div className="space-y-4 mb-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Type
                  </label>
                  <select
                    value={evidenceInput.type}
                    onChange={(e) => setEvidenceInput(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="link">Link/URL</option>
                    <option value="screenshot">Screenshot</option>
                    <option value="document">Document</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={evidenceInput.url}
                    onChange={(e) => setEvidenceInput(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/evidence"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={evidenceInput.description}
                  onChange={(e) => setEvidenceInput(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this evidence"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="button"
                onClick={handleAddEvidence}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <FaFileUpload />
                Add Evidence
              </button>
            </div>

            {/* Evidence List */}
            {formData.evidence.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Added Evidence ({formData.evidence.length}):
                </p>
                {formData.evidence.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.type}: {item.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {item.url}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(index)}
                      className="ml-4 text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legal Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-900 mb-2">
              ⚖️ Legal Notice
            </h3>
            <p className="text-sm text-yellow-800 mb-2">
              By submitting this grievance, you confirm that:
            </p>
            <ul className="text-sm text-yellow-800 list-disc ml-5 space-y-1">
              <li>The information provided is true and accurate to the best of your knowledge</li>
              <li>You understand that false or malicious complaints may have legal consequences</li>
              <li>You authorize Press India to investigate this matter</li>
              <li>You agree to cooperate with any follow-up investigations</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GrievanceForm;