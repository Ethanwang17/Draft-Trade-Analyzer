import { useState } from 'react';

/**
 * Hook for managing the selected axes in the RadarChart
 * @returns {object} The axes state and handlers
 */
export function useSelectedAxes() {
	// Axis options definition with colors assigned
	const axisOptions = [
		{ value: 'Total Incoming Value', label: 'Total Incoming Value', color: '#D5F3E5' },
		{ value: 'Total Outgoing Value', label: 'Total Outgoing Value', color: '#CDC1FF' },
		{ value: '# of Incoming Picks', label: '# of Incoming Picks', color: '#FFF5BA' },
		{ value: '# of Outgoing Picks', label: '# of Outgoing Picks', color: '#D6F0FF' },
		{ value: 'Net Pick Value', label: 'Net Pick Value', color: '#FADADD' },
	];

	// Selected axes state – default all
	const [selectedAxes, setSelectedAxes] = useState(axisOptions.map((o) => o.value));

	// Handle selection change
	const handleAxisChange = (values) => {
		setSelectedAxes(values);
	};

	return {
		axisOptions,
		selectedAxes,
		setSelectedAxes,
		handleAxisChange,
	};
}
