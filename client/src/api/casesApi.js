import { getAuthToken } from '../utils/token';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

export const submitCase = async (payload) => {
  // Remove countryCode as backend only needs the full phone number
  const { countryCode, ...caseData } = payload;
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('You must be logged in to submit a case');
  }
  
  const response = await fetch(`${API_BASE}/api/cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(caseData)
  });

  return handleResponse(response);
};

export const fetchCases = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('You must be logged in to view cases');
  }

  const response = await fetch(`${API_BASE}/api/cases`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return handleResponse(response);
};
