import { useState, useEffect } from 'react';

// Custom hook to fetch and process draft pick valuation data based on selected model
export const useValuationData = (selectedValuation) => {
	// State to store the processed pick values
	const [pickValues, setPickValues] = useState([]);

	// Loading and error states for UI feedback
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// X-axis tick marks for chart visualization
	const [xAxisTicks, setXAxisTicks] = useState([]);

	useEffect(() => {
		const fetchPickValues = async () => {
			try {
				setLoading(true);
				setError(null);

				// Fetch list of draft pick positions
				const pickPositionsResponse = await fetch('/api/pick-values');
				if (!pickPositionsResponse.ok) {
					throw new Error('Failed to fetch pick positions data');
				}
				const pickPositionsData = await pickPositionsResponse.json();

				// Sort picks numerically by position
				const sortedPickPositions = [...pickPositionsData].sort(
					(a, b) => parseInt(a.pick_position, 10) - parseInt(b.pick_position, 10)
				);

				// Fetch valuation data for each pick position with selected model
				const valuesPromises = sortedPickPositions.map(async (pick) => {
					try {
						const response = await fetch(
							`/api/pick-value/${pick.pick_position}/${selectedValuation}`
						);
						if (!response.ok) {
							// If custom valuation fails, fall back to standard values
							return {
								key: pick.id,
								pickNumber: parseInt(pick.pick_position, 10),
								value: parseFloat(pick.value),
								normalized: parseFloat(pick.normalized),
								valuationName: 'Standard',
							};
						}
						const valueData = await response.json();
						return {
							key: pick.id,
							pickNumber: parseInt(pick.pick_position, 10),
							value: parseFloat(valueData.value),
							normalized: parseFloat(valueData.normalized),
							valuationName: valueData.valuation_name,
						};
					} catch (error) {
						console.error(`Error fetching value for pick ${pick.pick_position}:`, error);
						// Fallback to original pick value if request fails
						return {
							key: pick.id,
							pickNumber: parseInt(pick.pick_position, 10),
							value: parseFloat(pick.value),
							normalized: parseFloat(pick.normalized),
							valuationName: 'Standard',
						};
					}
				});

				// Wait for all valuation requests to complete
				const valueResults = await Promise.all(valuesPromises);
				setPickValues(valueResults);

				// Generate x-axis ticks for chart (every 5 picks, plus min/max)
				if (valueResults.length > 0) {
					const pickNumbers = valueResults.map((item) => item.pickNumber);
					const minPick = Math.min(...pickNumbers);
					const maxPick = Math.max(...pickNumbers);
					const ticks = [];
					if (minPick > 0) {
						ticks.push(minPick);
					}
					for (let i = Math.ceil(minPick / 5) * 5; i <= maxPick; i += 5) {
						if (i >= minPick && !ticks.includes(i)) {
							ticks.push(i);
						}
					}
					if (maxPick > 0 && !ticks.includes(maxPick) && maxPick % 5 !== 0 && maxPick > minPick) {
						ticks.push(maxPick);
					}
					ticks.sort((a, b) => a - b);
					setXAxisTicks([...new Set(ticks)]);
				} else {
					setXAxisTicks([]);
				}

				setLoading(false);
			} catch (err) {
				console.error('Error fetching pick values:', err);
				setError('Failed to load pick values data. Please try again later.');
				setLoading(false);
			}
		};

		// Fetch data whenever the selected valuation model changes
		fetchPickValues();
	}, [selectedValuation]);

	// Return relevant data and states for use in components
	return { pickValues, loading, error, xAxisTicks };
};
