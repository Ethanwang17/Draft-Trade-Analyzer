// Base URL for API requests, can be overridden by environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper function to make a fetch request to the API
export const fetchFromAPI = async (endpoint, options = {}) => {
	const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

	// Perform the fetch request with default and custom headers
	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	// Throw an error if the response is not OK
	if (!response.ok) {
		throw new Error(`API request failed: ${response.statusText}`);
	}

	// Parse and return the JSON response
	return response.json();
};

// Shorthand method for a GET request
export const get = (endpoint) => fetchFromAPI(endpoint);

// Shorthand method for a POST request with a JSON body
export const post = (endpoint, data) =>
	fetchFromAPI(endpoint, {
		method: 'POST',
		body: JSON.stringify(data),
	});

// Shorthand method for a PUT request with a JSON body
export const put = (endpoint, data) =>
	fetchFromAPI(endpoint, {
		method: 'PUT',
		body: JSON.stringify(data),
	});

// Shorthand method for a DELETE request
export const del = (endpoint) =>
	fetchFromAPI(endpoint, {
		method: 'DELETE',
	});
