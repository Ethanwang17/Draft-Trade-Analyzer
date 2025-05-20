import { useState, useCallback } from 'react';
import { sortPicks } from '../utils/pickSorter';

/**
 * Hook for trade reset functionality
 * @param {Object} originalPicksRef - Reference to original picks for each team
 * @param {Function} updateTeamGroups - Function to update team groups
 * @param {Boolean} externalHasTradesMade - External state for tracking if trades have been made
 * @param {Function} externalSetHasTradesMade - External function to update the trade status
 * @returns {Object} Reset functionality and state
 */
export const useTradeReset = (
	originalPicksRef,
	updateTeamGroups,
	externalHasTradesMade = null,
	externalSetHasTradesMade = null
) => {
	const [isResetting, setIsResetting] = useState(false);
	const [resetModalVisible, setResetModalVisible] = useState(false);
	const [localHasTradesMade, setLocalHasTradesMade] = useState(false);

	// Use external state if provided, otherwise use local state
	const hasTradesMade = externalHasTradesMade !== null ? externalHasTradesMade : localHasTradesMade;
	const setHasTradesMade = externalSetHasTradesMade || setLocalHasTradesMade;

	// Check if any picks have been moved from their original teams
	const checkForTradesMade = useCallback(
		(currentGroups) => {
			if (!currentGroups) {
				console.log('No groups provided to checkForTradesMade');
				return false;
			}

			// Check each team to see if they have picks from other teams
			const hasTrades = currentGroups.some((group) => {
				if (!group.teamId) return false;

				// Check if any pick in this group belongs to a different team originally
				const hasNonOriginalPicks = group.picks.some(
					(pick) => pick.originalTeamId && pick.originalTeamId !== group.teamId
				);

				if (hasNonOriginalPicks) {
					console.log(`Team ${group.name} has picks from other teams`);
					return true;
				}

				// Also check if any original picks are missing
				const originalPicks = originalPicksRef.current[group.teamId] || [];
				if (originalPicks.length === 0) return false;

				const originalPickIds = new Set(originalPicks.map((p) => p.id));
				const currentPickIds = new Set(group.picks.map((p) => p.id));

				// Check if any original picks are missing from this team
				for (const id of originalPickIds) {
					if (!currentPickIds.has(id)) {
						console.log(`Team ${group.name} is missing original pick ${id}`);
						return true;
					}
				}

				return false;
			});

			console.log('checkForTradesMade result:', hasTrades);
			return hasTrades;
		},
		[originalPicksRef] // Stable dependency
	);

	// Show reset confirmation modal
	const showResetConfirmation = (teamGroups) => {
		console.log('showResetConfirmation called, hasTradesMade:', hasTradesMade);
		// Only show confirmation if trades have been made
		if (hasTradesMade) {
			console.log('Setting modal visible to true');
			setResetModalVisible(true);
		} else {
			// If no trades have been made, just proceed with reset
			console.log('No trades made, skipping modal');
			performReset(teamGroups);
		}
	};

	// Handle confirmation modal OK button
	const handleResetConfirm = (teamGroups) => {
		setResetModalVisible(false);
		performReset(teamGroups);
	};

	// Handle confirmation modal Cancel button
	const handleResetCancel = () => {
		setResetModalVisible(false);
	};

	// Perform the actual reset
	const performReset = (teamGroups) => {
		// If no trades have been made, no need to reset
		if (!hasTradesMade) return;

		// Start the animation
		setIsResetting(true);

		// Create new team groups with original picks for each team
		const resetTeamGroups = teamGroups.map((group) => {
			// If this group has a team selected, restore its original picks only
			if (group.teamId) {
				const originalPicks = originalPicksRef.current[group.teamId] || [];
				return {
					...group,
					// Sort the picks to ensure they appear in the correct order
					picks: sortPicks(
						[...originalPicks].map((pick) => ({
							...pick,
							className: '', // Explicitly remove any classes like traded-pick
						}))
					),
				};
			}
			// Otherwise return the group as is (empty)
			return {
				...group,
				picks: [],
			};
		});

		// Update the team groups
		updateTeamGroups(resetTeamGroups);

		// Reset animation state after animation completes
		setTimeout(() => {
			setIsResetting(false);
			// Remove animation classes
			const updatedGroups = resetTeamGroups.map((group) => ({
				...group,
				// Make sure picks remain sorted after animation
				picks: sortPicks(
					group.picks.map((pick) => {
						return {
							...pick,
							className: '', // Ensure no classes remain like traded-pick
						};
					})
				),
			}));
			updateTeamGroups(updatedGroups);

			// After reset, no trades have been made
			setHasTradesMade(false);
		}, 500); // Match animation duration
	};

	return {
		isResetting,
		resetModalVisible,
		hasTradesMade,
		setHasTradesMade,
		checkForTradesMade,
		showResetConfirmation,
		handleResetConfirm,
		handleResetCancel,
	};
};
