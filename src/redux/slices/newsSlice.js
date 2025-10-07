import { createSlice } from '@reduxjs/toolkit';

const newsSlice = createSlice({
  name: 'news',
  initialState: {
    articles: [],
    loading: false,
    error: null,
    category: 'all',
    language: 'en'
  },
  reducers: {
    setArticles: (state, action) => {
      state.articles = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setCategory: (state, action) => {
      state.category = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    }
  }
});

export const { setArticles, setLoading, setError, setCategory, setLanguage } = newsSlice.actions;
export default newsSlice.reducer;