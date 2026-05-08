const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  if (API_BASE_URL) {
    return `${API_BASE_URL}/${cleanPath}`;
  }
  return `/${cleanPath}`;
};

export default API_BASE_URL;
