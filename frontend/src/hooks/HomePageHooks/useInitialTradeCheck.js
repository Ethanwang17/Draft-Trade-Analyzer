import { useEffect } from 'react';

/**
 * Runs once after mount (and whenever the `teamGroups` array changes) to set the
 * `hasTradesMade` flag. Extracted out of HomePage to keep the component concise.
 */
export const useInitialTradeCheck = ({ teamGroups, checkForTradesMade, setHasTradesMade }) => {
	useEffect(() => {
		if (checkForTradesMade && teamGroups.length > 0) {
			const hasTrades = checkForTradesMade(teamGroups);
			setHasTradesMade(hasTrades);
		}
	}, [checkForTradesMade, teamGroups, setHasTradesMade]);
};
