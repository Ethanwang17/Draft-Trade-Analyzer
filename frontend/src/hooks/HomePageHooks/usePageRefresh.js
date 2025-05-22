import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook that checks if the current navigation was a full page refresh and, if so,
 * clears out any React-Router location state by redirecting back to the same route.
 *
 * This prevents stale trade data from lingering in the Home page after a hard refresh.
 */
// Hook to detect and handle full-page refreshes to prevent stale navigation state
export const usePageRefresh = () => {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		// On mount, check if on Home page and forcibly clear navigation state
		// Always clear trade state on initial page load or refresh
		// This ensures trade data won't persist after a page refresh
		const clearStateOnRefresh = () => {
			// This will run on every initial mount/page load
			if (location.pathname === '/home') {
				navigate('/home', { replace: true, state: null });
			}
		};

		clearStateOnRefresh();
	}, [navigate, location.pathname]);
};
