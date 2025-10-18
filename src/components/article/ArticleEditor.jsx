import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  createArticle, 
  updateArticle,
  getArticleById,
  submitArticleForPublication,
  ARTICLE_CATEGORIES 
} from '../../services/articleService';
import { isUserVerified } from '../../services/profileService';
import { auth } from '../../config/firebase';
import toast from 'react-hot-toast';
import { 
  FaNewspaper, 
  FaSave, 
  FaPaperPlane, 
  FaPlus, 
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle 
} from 'react-icons/fa';

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [article, setArticle] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: [],
    featuredImage: '',
    sources: []
  });

  const [sourceInput, setSourceInput] = useState({
    name: '',
    url: '',
    type: 'web'
  });

  const [tagInput, setTagInput] = useState('');

  // Check verification status
  useEffect(() => {
    checkVerification();
  }, []);

  // Load article if editing
  useEffect(() => {
    if (isEditing) {
      loadArticle();
    }
  }, [id]);

  const checkVerification = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const verified = await isUserVerified(user.uid);
        setIsVerified(verified);
        
        if (!verified) {
          toast.error('You must be verified to write articles');
          setTimeout(() => navigate('/profile/verification'), 2000);
        }
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const loadArticle = async () => {
    try {
      setLoading(true);
      const articleData = await getArticleById(id);
      
      if (!articleData) {
        toast.error('Article not found');
        navigate('/articles/my');
        return;
      }

      // Check if user owns the article
      if (articleData.authorId !== auth.currentUser?.uid) {
        toast.error('You can only edit your own articles');
        navigate('/articles/my');
        return;
      }

      setArticle(articleData);
      setFormData({
        title: articleData.title,
        summary: articleData.summary,
        content: articleData.content,
        category: articleData.category,
        tags: articleData.tags || [],
        featuredImage: articleData.featuredImage || '',
        sources: articleData.sources || []
      });
    } catch (error) {
      console.error('Error loading article:', error);
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSource = () => {
    if (!sourceInput.name || !sourceInput.url) {
      toast.error('Please provide source name and URL');
      return;
    }

    // Validate URL
    try {
      new URL(sourceInput.url);
    } catch {
      toast.error('Please provide a valid URL');
      return;
    }

    setFormData(prev => ({
      ...prev,
      sources: [...prev.sources, { ...sourceInput }]
    }));

    setSourceInput({
      name: '',
      url: '',
      type: 'web'
    });

    toast.success('Source added');
  };

  const handleRemoveSource = (index) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    if (formData.tags.includes(tagInput.trim())) {
      toast.error('Tag already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));

    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);

      if (!formData.title || !formData.content) {
        throw new Error('Title and content are required');
      }

      let result;
      if (isEditing) {
        result = await updateArticle(id, formData);
        toast.success('Draft updated successfully');
      } else {
        result = await createArticle(formData);
        toast.success('Draft saved successfully');
        navigate(`/articles/edit/${result.articleId}`);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      if (!formData.title || !formData.content || !formData.category) {
        throw new Error('Title, content, and category are required');
      }

      if (formData.sources.length === 0) {
        throw new Error('At least one source is required for publication');
      }

      if (formData.content.length < 200) {
        throw new Error('Article must be at least 200 characters long');
      }

      setLoading(true);

      let articleId = id;

      // Save first if new article
      if (!isEditing) {
        const result = await createArticle(formData);
        articleId = result.articleId;
      } else {
        await updateArticle(id, formData);
      }

      // Submit for publication
      await submitArticleForPublication(articleId);

      toast.success('Article submitted for review!');
      setTimeout(() => navigate('/articles/my'), 2000);

    } catch (error) {
      console.error('Error submitting article:', error);
      toast.error(error.message || 'Failed to submit article');
    } finally {
      setLoading(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md text-center">
          <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to verify your account before you can write articles.
          </p>
          <button
            onClick={() => navigate('/profile/verification')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            Complete Verification
          </button>
        </div>
      </div>
    );
  }

  if (loading && isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaNewspaper className="text-primary text-3xl" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Article' : 'Write New Article'}
                </h1>
                <p className="text-gray-600">
                  Share your story with the world
                </p>
              </div>
            </div>

            {article?.status && (
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                article.status === 'published' ? 'bg-green-100 text-green-800' :
                article.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                article.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {article.status.replace('_', ' ').toUpperCase()}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="text-blue-600 text-lg mt-1" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Before You Publish:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Ensure all facts are accurate and verifiable</li>
                  <li>Cite at least one credible source</li>
                  <li>Avoid defamatory or hateful content</li>
                  <li>Your article will be reviewed before publication</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a compelling title..."
              className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          {/* Category & Featured Image */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">Select category</option>
                  {ARTICLE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL (Optional)
                </label>
                <input
                  type="url"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary (Optional but Recommended)
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              placeholder="Brief summary of your article (150-200 characters)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              rows="3"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.summary.length}/200 characters
            </p>
          </div>

          {/*Content */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Write your article here... Be detailed and factual. Minimum 200 characters required."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
              rows="20"
              required
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {formData.content.length} characters (minimum 200 required)
              </p>
              <p className={`text-xs font-medium ${
                formData.content.length >= 200 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formData.content.length >= 200 ? '✓ Meets minimum length' : '✗ Too short'}
              </p>
            </div>
          </div>

          {/* Sources */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Sources * (At least 1 required)
            </h2>

            <div className="space-y-4 mb-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Name
                  </label>
                  <input
                    type="text"
                    value={sourceInput.name}
                    onChange={(e) => setSourceInput(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Times of India"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Type
                  </label>
                  <select
                    value={sourceInput.type}
                    onChange={(e) => setSourceInput(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="web">Website</option>
                    <option value="newspaper">Newspaper</option>
                    <option value="journal">Journal</option>
                    <option value="government">Government Source</option>
                    <option value="interview">Interview</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source URL
                  </label>
                  <input
                    type="url"
                    value={sourceInput.url}
                    onChange={(e) => setSourceInput(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSource}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
              >
                <FaPlus />
                Add Source
              </button>
            </div>

            {/* Sources List */}
            {formData.sources.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Added Sources ({formData.sources.length}):
                </p>
                {formData.sources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{source.name}</p>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {source.type}
                        </span>
                      </div>
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate block"
                      >
                        {source.url}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(index)}
                      className="ml-4 text-red-500 hover:text-red-700"
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
                  No sources added yet. At least one source is required for publication.
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Tags (Optional)
            </h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Add
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-primary hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Legal Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <FaExclamationTriangle />
              Legal Disclaimer
            </h3>
            <p className="text-sm text-yellow-800 mb-2">
              By publishing this article, you confirm that:
            </p>
            <ul className="text-sm text-yellow-800 list-disc ml-5 space-y-1">
              <li>All information is accurate to the best of your knowledge</li>
              <li>You have the right to publish this content</li>
              <li>The content does not violate any copyright or privacy laws</li>
              <li>The content does not contain defamatory or hateful statements</li>
              <li>You accept responsibility for the content published</li>
              <li>Press India reserves the right to review and reject any content</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate('/articles/my')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || !formData.title || !formData.content}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 transition"
              >
                <FaSave />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={loading || formData.sources.length === 0 || formData.content.length < 200}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                <FaPaperPlane />
                {loading ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>

            {formData.sources.length === 0 && (
              <p className="text-center text-sm text-red-600 mt-3">
                ⚠️ At least one source is required before submission
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;