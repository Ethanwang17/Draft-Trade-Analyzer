import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import './ValuationSelector.css';

const ValuationSelector = ({ onChange, defaultValue = 1 }) => {
	const [valuations, setValuations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedValuation, setSelectedValuation] = useState(defaultValue);

	// Update selectedValuation when defaultValue prop changes
	useEffect(() => {
		setSelectedValuation(defaultValue);
	}, [defaultValue]);

	useEffect(() => {
		const fetchValuations = async () => {
			try {
				setLoading(true);
				const response = await fetch('/api/valuations');
				if (!response.ok) {
					throw new Error('Failed to fetch valuations');
				}
				const data = await response.json();
				setValuations(data);
				setLoading(false);
			} catch (error) {
				console.error('Error fetching valuations:', error);
				setLoading(false);
			}
		};

		fetchValuations();
	}, []);

	const handleChange = (value) => {
		setSelectedValuation(value);
		if (onChange) {
			onChange(value);
		}
	};

	// Get the name of the selected valuation
	const getSelectedValuationName = () => {
		const selected = valuations.find((v) => v.id === selectedValuation);
		return selected ? selected.name : '';
	};

	return (
		<div className="valuation-select">
			<Select
				id="valuation-selector"
				value={selectedValuation}
				onChange={handleChange}
				className="valuation-dropdown"
				disabled={loading}
				loading={loading}
				optionLabelProp="label"
				options={valuations.map((valuation) => ({
					value: valuation.id,
					label: valuation.name,
				}))}
				// Custom render for the selected option
				labelRender={() => (
					<div className="valuation-selected">
						Valuation Model: <strong>{getSelectedValuationName()}</strong>
					</div>
				)}
			/>
		</div>
	);
};

export default ValuationSelector;
