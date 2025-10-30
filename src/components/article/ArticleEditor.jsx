// File: src/components/article/ArticleEditor.jsx
/*
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { 
  createArticle, 
  updateArticle, 
  getArticle,
  submitArticleForPublication,
  ARTICLE_CATEGORIES 
} from '../../services/articleService';
import { FaSave, FaUpload, FaTimes, FaPlus, FaPaperPlane, FaImage } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(isEditing);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'general',
    tags: [],
    sources: [],
    featuredImage: null
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentSource, setCurrentSource] = useState({ name: '', url: '' });

  useEffect(() => {
    if (isEditing) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoadingArticle(true);
      const article = await getArticle(id);
      
      // Check if user owns this article
      if (article.authorId !== auth.currentUser?.uid) {
        toast.error('You can only edit your own articles');
        navigate('/articles/my');
        return;
      }

      setFormData({
        title: article.title || '',
        summary: article.summary || '',
        content: article.content || '',
        category: article.category || 'general',
        tags: article.tags || [],
        sources: article.sources || [],
        featuredImage: article.featuredImage || article.imageUrl || null
      });

      if (article.featuredImage || article.imageUrl) {
        setImagePreview(article.featuredImage || article.imageUrl);
      }

    } catch (error) {
      console.error('Error loading article:', error);
      toast.error('Failed to load article');
      navigate('/articles/my');
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      featuredImage: null
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddSource = () => {
    if (currentSource.name.trim() && currentSource.url.trim()) {
      // Validate URL
      try {
        new URL(currentSource.url);
        
        setFormData(prev => ({
          ...prev,
          sources: [...prev.sources, { ...currentSource }]
        }));
        setCurrentSource({ name: '', url: '' });
      } catch {
        toast.error('Please enter a valid URL');
      }
    } else {
      toast.error('Please fill in both source name and URL');
    }
  };

  const handleRemoveSource = (index) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }

    if (formData.title.trim().length < 10) {
      toast.error('Title must be at least 10 characters');
      return false;
    }

    if (!formData.content.trim()) {
      toast.error('Content is required');
      return false;
    }

    if (formData.content.trim().length < 200) {
      toast.error('Content must be at least 200 characters');
      return false;
    }

    if (!formData.category) {
      toast.error('Category is required');
      return false;
    }

    return true;
  };

  const handleSaveDraft = async () => {
    try {
      if (!formData.title.trim()) {
        toast.error('Title is required to save draft');
        return;
      }

      setLoading(true);

      const articleDataToSave = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        sources: formData.sources
      };

      if (isEditing) {
        await updateArticle(id, articleDataToSave, imageFile);
        toast.success('Draft saved successfully!');
      } else {
        const result = await createArticle(articleDataToSave, imageFile);
        toast.success('Draft created successfully!');
        navigate(`/articles/edit/${result.id}`);
      }

    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      if (formData.sources.length === 0) {
        toast.error('At least one source is required for publication');
        return;
      }

      setLoading(true);

      let articleId = id;

      // Prepare article data
      const articleDataToSave = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        sources: formData.sources
      };

      // Save/Update article first
      if (!isEditing) {
        console.log('📝 Creating new article...');
        const result = await createArticle(articleDataToSave, imageFile);
        articleId = result.id;
        console.log('✅ Article created:', articleId);
      } else {
        console.log('📝 Updating existing article...');
        await updateArticle(id, articleDataToSave, imageFile);
        console.log('✅ Article updated');
      }

      // Submit for publication
      console.log('📤 Submitting for publication...');
      const result = await submitArticleForPublication(articleId);

      if (result.published) {
        toast.success('🎉 Article published successfully!');
      } else if (result.needsReview) {
        toast.success('✨ Article submitted! Our team will review it soon. Meanwhile, explore trending stories!', { duration: 5000 });
      }

      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error submitting article:', error);
      toast.error(error.message || 'Failed to submit article');
    } finally {
      setLoading(false);
    }
  };

  if (loadingArticle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Edit Article' : 'Create New Article'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Make changes to your article' : 'Write and publish your story'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Enter article title (min 10 characters)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length} characters
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Brief summary of your article (optional)"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              required
            >
              {ARTICLE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaImage className="text-4xl text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows="15"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
              placeholder="Write your article content here (min 200 characters)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length} characters
              {formData.content.length < 200 && (
                <span className="text-red-500 ml-2">
                  (Need {200 - formData.content.length} more)
                </span>
              )}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Add tags (press Enter)"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
              >
                <FaPlus />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-primary hover:text-red-500 transition"
                  >
                    <FaTimes size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sources <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={currentSource.name}
                onChange={(e) => setCurrentSource(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Source name (e.g., Times of India)"
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  value={currentSource.url}
                  onChange={(e) => setCurrentSource(prev => ({ ...prev, url: e.target.value }))}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Source URL (e.g., https://...)"
                />
                <button
                  type="button"
                  onClick={handleAddSource}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
                >
                  <FaPlus />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {formData.sources.map((source, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{source.name}</p>
                    <p className="text-sm text-gray-500 truncate">{source.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSource(index)}
                    className="text-red-500 hover:text-red-700 transition ml-4"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
            {formData.sources.length === 0 && (
              <p className="text-xs text-red-500 mt-2">
                At least one source is required for publication
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading || !formData.title.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <FaSave />
            Save Draft
          </button>

          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <FaPaperPlane />
                {isEditing ? 'Update & Submit' : 'Submit for Review'}
              </>
            )}
          </button>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Article Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Title must be at least 10 characters</li>
            <li>• Content must be at least 200 characters</li>
            <li>• At least one source is required for publication</li>
            <li>• Featured image is optional but recommended</li>
            <li>• Use clear, factual language and cite your sources</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
*/

// E:\press-india\src\components\article\ArticleEditor.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../../config/firebase";
import {
  createArticle,
  updateArticle,
  getArticleById,
} from "../../services/articleService";
import { FaSave, FaPlus, FaPaperPlane, FaImage, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

// Optional: image upload to Firebase Storage
// Ensure your src/config/firebase exports `storage` (firebase/storage). If not exported,
// the image upload branch will be skipped and featuredImage will be stored as null.
import { storage } from "../../config/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const ARTICLE_CATEGORIES = [
  "general",
  "india",
  "world",
  "business",
  "technology",
  "entertainment",
  "sports",
  "science",
  "health",
];

const slugify = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // id = article id (edit) or undefined (create)
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "general",
    tags: [],
    sources: [],
    featuredImage: null, // URL string (download URL) if exists
    slug: "",
  });

  const [currentTag, setCurrentTag] = useState("");
  const [currentSource, setCurrentSource] = useState({ name: "", url: "" });

  // For image upload local preview and file object
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (isEditing) loadArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadArticle = async () => {
    try {
      const article = await getArticleById(id);
      if (!article) throw new Error("Article not found");

      // Ownership check - allow admins to edit elsewhere, but basic check here:
      const user = auth.currentUser;
      if (article.userId && user && article.userId !== user.uid) {
        toast.error("You can only edit your own articles");
        navigate("/articles/my");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        title: article.title || "",
        summary: article.summary || "",
        content: article.content || article.body || "",
        category: article.category || "general",
        tags: Array.isArray(article.tags) ? article.tags : [],
        sources: Array.isArray(article.sources) ? article.sources : [],
        featuredImage: article.featuredImage || article.imageUrl || null,
        slug: article.slug || "",
      }));

      if (article.featuredImage || article.imageUrl) {
        setImagePreview(article.featuredImage || article.imageUrl);
      }
    } catch (err) {
      console.error("Error loading article:", err);
      toast.error(err.message || "Failed to load article");
      navigate("/articles/my");
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleImageChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(f);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((p) => ({ ...p, featuredImage: null }));
  };

  const handleAddTag = () => {
    const t = (currentTag || "").trim();
    if (!t) return;
    if (formData.tags.includes(t)) {
      setCurrentTag("");
      return;
    }
    setFormData((p) => ({ ...p, tags: [...p.tags, t] }));
    setCurrentTag("");
  };

  const handleRemoveTag = (tag) => {
    setFormData((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const handleAddSource = () => {
    const name = (currentSource.name || "").trim();
    const url = (currentSource.url || "").trim();
    if (!name || !url) {
      toast.error("Please fill both source name and URL");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL (include https://)");
      return;
    }
    setFormData((p) => ({ ...p, sources: [...p.sources, { name, url }] }));
    setCurrentSource({ name: "", url: "" });
  };

  const handleRemoveSource = (index) => {
    setFormData((p) => ({ ...p, sources: p.sources.filter((_, i) => i !== index) }));
  };

  const validateForm = (strict = true) => {
    if (!formData.title || formData.title.trim().length < 10) {
      toast.error("Title is required and must be at least 10 characters");
      return false;
    }
    if (strict && (!formData.content || formData.content.trim().length < 200)) {
      toast.error("Content must be at least 200 characters");
      return false;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return false;
    }
    return true;
  };

  const uploadImage = async (file) => {
    // Upload to Firebase Storage (if available)
    if (!file) return null;
    if (!storage) {
      // storage not configured
      console.warn("Firebase storage is not configured; skipping image upload");
      return null;
    }
    try {
      const user = auth.currentUser;
      const uid = user ? user.uid : "anon";
      const key = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const path = `articles/${uid}/${key}`;
      const sRef = storageRef(storage, path);
      const task = uploadBytesResumable(sRef, file);
      // await upload completion (return a promise)
      await new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          () => {}, // progress ignored
          (err) => reject(err),
          () => resolve()
        );
      });
      const url = await getDownloadURL(sRef);
      return url;
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("Image upload failed");
      return null;
    }
  };

  const upsertArticle = async ({ publish = false }) => {
    // publish == true means submit for review (status: pending)
    // publish == false for save draft (status: draft)
    if (!validateForm(publish)) return null;

    // ensure user logged in
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please login to continue");
      navigate("/auth");
      return null;
    }

    setLoading(true);
    try {
      // handle featured image upload if any
      let featuredImageUrl = formData.featuredImage || null;
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (uploaded) featuredImageUrl = uploaded;
      }

      // prepare payload
      const payload = {
        title: formData.title.trim(),
        summary: (formData.summary || "").trim(),
        content: (formData.content || "").trim(),
        category: formData.category || "general",
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        sources: Array.isArray(formData.sources) ? formData.sources : [],
        featuredImage: featuredImageUrl,
        slug: formData.slug ? slugify(formData.slug) : slugify(formData.title),
        status: publish ? "pending" : "draft",
      };

      if (isEditing) {
        // updateArticle(articleId, updates)
        const updated = await updateArticle(id, payload);
        toast.success(publish ? "Article submitted for review" : "Draft saved");
        return updated;
      } else {
        // createArticle(articleData, userId)
        const created = await createArticle(payload, user.uid);
        toast.success(publish ? "Article created & submitted for review" : "Draft created");
        return created;
      }
    } catch (err) {
      console.error("Save/Submit error", err);
      toast.error(err.message || "Failed to save article");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!validateForm(true)) return;
    const res = await upsertArticle({ publish: true });
    if (res && (res.id || res.id === 0)) {
      // if create returned id, navigate to user's article or home
      navigate("/articles/my");
    } else if (isEditing) {
      // updated existing, navigate back to my articles
      navigate("/articles/my");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? "Edit Article" : "Create New Article"}
          </h1>
          <p className="text-gray-600">{isEditing ? "Make changes to your article" : "Write and publish your story"}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
            <input name="title" value={formData.title} onChange={handleInput} type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary" placeholder="Enter title (min 10 chars)" />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length} characters</p>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
            <textarea name="summary" value={formData.summary} onChange={handleInput} rows="3" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary" placeholder="Brief summary (optional)" />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
            <select name="category" value={formData.category} onChange={handleInput} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary">
              {ARTICLE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
            </select>
          </div>

          {/* Featured Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>

            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"><FaTimes /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaImage className="text-4xl text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            )}
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content <span className="text-red-500">*</span></label>
            <textarea name="content" value={formData.content} onChange={handleInput} rows="14" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm" placeholder="Write content (min 200 chars)" />
            <p className="text-xs text-gray-500 mt-1">{formData.content.length} characters{formData.content.length < 200 && (<span className="text-red-500 ml-2">(Need {200 - formData.content.length} more)</span>)}</p>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())} className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary" placeholder="Add tag and press Enter" />
              <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-primary text-white rounded-lg"><FaPlus /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((t, i) => <span key={i} className="px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-sm flex items-center gap-2">{t}<button type="button" onClick={() => handleRemoveTag(t)} className="text-primary hover:text-red-500 transition"><FaTimes size={12} /></button></span>)}
            </div>
          </div>

          {/* Sources */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sources <span className="text-red-500">*</span></label>
            <div className="space-y-2 mb-3">
              <input type="text" value={currentSource.name} onChange={(e) => setCurrentSource((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary" placeholder="Source name (e.g., Times of India)" />
              <div className="flex gap-2">
                <input type="url" value={currentSource.url} onChange={(e) => setCurrentSource((p) => ({ ...p, url: e.target.value }))} className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary" placeholder="Source URL (https://...)" />
                <button type="button" onClick={handleAddSource} className="px-4 py-2 bg-primary text-white rounded-lg"><FaPlus /></button>
              </div>
            </div>

            <div className="space-y-2">
              {formData.sources.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-sm text-gray-500 truncate">{s.url}</p>
                  </div>
                  <button type="button" onClick={() => handleRemoveSource(i)} className="text-red-500 hover:text-red-700 transition ml-4"><FaTimes /></button>
                </div>
              ))}
            </div>
            {formData.sources.length === 0 && <p className="text-xs text-red-500 mt-2">At least one source is required for publication</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row gap-4">
          <button type="button" onClick={() => upsertArticle({ publish: false })} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 transition">
            <FaSave /> Save Draft
          </button>

          <button type="button" onClick={handleSubmitForReview} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition">
            {loading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Processing...</>) : (<><FaPaperPlane /> {isEditing ? "Update & Submit" : "Submit for Review"}</>)}
          </button>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Article Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Title must be at least 10 characters</li>
            <li>• Content must be at least 200 characters</li>
            <li>• At least one source is required for publication</li>
            <li>• Featured image is optional but recommended</li>
            <li>• Use clear, factual language and cite your sources</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
