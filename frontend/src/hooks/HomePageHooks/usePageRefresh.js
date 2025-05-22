import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook that checks if the current navigation was a full page refresh and, if so,
 * clears out any React-Router location state by redirecting back to the same route.
 *
 * This prevents stale trade data from lingering in the Home page after a hard refresh.
 */
export const usePageRefresh = () => {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		// A clean page load/refresh will not have a referrer from the same site
		const isPageRefresh = !document.referrer || !document.referrer.includes(window.location.origin);

		// If this is a page refresh and location.state exists, clear it by navigating to /home
		if (isPageRefresh && location.state) {
			navigate('/home', { replace: true, state: null });
		}
	}, [navigate, location]);
};
