import { useState, useEffect } from 'react';

export const useValuationData = (selectedValuation) => {
	const [pickValues, setPickValues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [xAxisTicks, setXAxisTicks] = useState([]);

	useEffect(() => {
		const fetchPickValues = async () => {
			try {
				setLoading(true);
				setError(null);

				const pickPositionsResponse = await fetch('/api/pick-values');
				if (!pickPositionsResponse.ok) {
					throw new Error('Failed to fetch pick positions data');
				}
				const pickPositionsData = await pickPositionsResponse.json();
				const sortedPickPositions = [...pickPositionsData].sort(
					(a, b) => parseInt(a.pick_position, 10) - parseInt(b.pick_position, 10)
				);

				const valuesPromises = sortedPickPositions.map(async (pick) => {
					try {
						const response = await fetch(
							`/api/pick-value/${pick.pick_position}/${selectedValuation}`
						);
						if (!response.ok) {
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
						return {
							key: pick.id,
							pickNumber: parseInt(pick.pick_position, 10),
							value: parseFloat(pick.value),
							normalized: parseFloat(pick.normalized),
							valuationName: 'Standard',
						};
					}
				});

				const valueResults = await Promise.all(valuesPromises);
				setPickValues(valueResults);

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

		fetchPickValues();
	}, [selectedValuation]);

	return { pickValues, loading, error, xAxisTicks };
};
