export default {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
  },
  '/uploads': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
  },
  '/static': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
  },
  '/images': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
  }
};
