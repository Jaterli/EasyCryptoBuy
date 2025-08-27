const API_URL = import.meta.env.VITE_API_URL;

export const API_PATHS = {
  base: API_URL,
  accounts: `${API_URL}/accounts`,
  company: `${API_URL}/company`,
  users: `${API_URL}/users`,
  payments: `${API_URL}/payments`,
};
