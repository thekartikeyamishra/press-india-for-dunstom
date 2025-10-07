import React from 'react';
import { motion as Motion } from 'framer-motion';
import { CATEGORIES } from '../../config/constants';

const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  return (
    <div className="bg-white border-t">
      <div className="container mx-auto px-4 py-3">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((category) => (
            <Motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-2 ${
                activeCategory === category.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </Motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;