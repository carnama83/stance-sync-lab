import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_DISABLE_EXTERNAL_INTEGRATIONS = 'true';