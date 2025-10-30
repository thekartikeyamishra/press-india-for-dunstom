// E:\press-india\src\components\article\ArticleSubmission.jsx
// ===================================================================
// Simple submission wrapper that uses articleService functions as-is.
// Defensive against nulls; no flow changes for the rest of the app.
// ===================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  createArticle,
  updateArticle,
  submitArticleForPublication,
} from '/src/services/articleService';

const ArticleSubmission = ({ draftId = null, draftData = {} }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);

      let articleId = draftId;
      const toSave = {
        title: (draftData.title || '').trim(),
        summary: (draftData.summary || '').trim(),
        content: (draftData.content || '').trim(),
        category: draftData.category || 'general',
        tags: Array.isArray(draftData.tags) ? draftData.tags : [],
        sources: Array.isArray(draftData.sources) ? draftData.sources : [],
      };

      if (!toSave.title) throw new Error('Title is required');
      if (!toSave.content) throw new Error('Content is required');

      if (!articleId) {
        const res = await createArticle(toSave);
        articleId = res?.id;
        if (!articleId) throw new Error('Failed to create article');
      } else {
        await updateArticle(articleId, toSave);
      }

      const res = await submitArticleForPublication(articleId);
      if (res?.published) {
        toast.success('🎉 Article published successfully!');
      } else {
        toast.success('✨ Article submitted for review!');
      }
      navigate('/');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={loading}
      className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {loading ? 'Submitting…' : 'Submit Article'}
    </button>
  );
};

export default ArticleSubmission;
