const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const fetchFromAPI = async (endpoint, options = {}) => {
	const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`API request failed: ${response.statusText}`);
	}

	return response.json();
};

export const get = (endpoint) => fetchFromAPI(endpoint);

export const post = (endpoint, data) =>
	fetchFromAPI(endpoint, {
		method: 'POST',
		body: JSON.stringify(data),
	});

export const put = (endpoint, data) =>
	fetchFromAPI(endpoint, {
		method: 'PUT',
		body: JSON.stringify(data),
	});

export const del = (endpoint) =>
	fetchFromAPI(endpoint, {
		method: 'DELETE',
	});
