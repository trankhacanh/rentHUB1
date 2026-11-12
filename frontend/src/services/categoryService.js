import axiosClient from './axiosClient';

let categoriesCache = null;
let categoriesPromise = null;

export const getCategories = async () => {
  if (categoriesCache) {
    return categoriesCache;
  }

  if (!categoriesPromise) {
    categoriesPromise = axiosClient
      .get('/equipments/categories')
      .then((response) => {
        const items = Array.isArray(response.data) ? response.data : [];
        categoriesCache = items;
        return items;
      })
      .catch((error) => {
        console.error('Failed to fetch categories:', error);
        categoriesCache = [];
        return categoriesCache;
      })
      .finally(() => {
        categoriesPromise = null;
      });
  }

  return categoriesPromise;
};

export const refreshCategories = async () => {
  clearCategoriesCache();
  return getCategories();
};

export const clearCategoriesCache = () => {
  categoriesCache = null;
  categoriesPromise = null;
};
