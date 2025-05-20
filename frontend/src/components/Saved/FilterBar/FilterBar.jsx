import React, { useState, useEffect } from 'react';
import { Row, Col, Select } from 'antd';
import './FilterBar.css';

const { Option } = Select;

const FilterBar = ({
	teams,
	onApplyFilters,
	onClearFilters,
	selectedValuation,
	onValuationChange,
}) => {
	const [selectedTeams, setSelectedTeams] = useState([]);
	const [sortOption, setSortOption] = useState('date_newest');
	const [valuationModels, setValuationModels] = useState([]);
	const [loading, setLoading] = useState(false);

	// Fetch valuation models
	useEffect(() => {
		const fetchValuationModels = async () => {
			try {
				setLoading(true);
				const response = await fetch('/api/valuations');
				if (response.ok) {
					const data = await response.json();
					setValuationModels(data);
				}
			} catch (error) {
				console.error('Error fetching valuation models:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchValuationModels();
	}, []);

	// Auto-apply filters when any filter changes
	useEffect(() => {
		onApplyFilters({
			teams: selectedTeams,
			sortOption,
		});
	}, [selectedTeams, sortOption, onApplyFilters]);

	const handleTeamChange = (values) => {
		setSelectedTeams(values);
	};

	const handleSortChange = (value) => {
		setSortOption(value);
	};

	const handleValuationChange = (value) => {
		if (onValuationChange) {
			onValuationChange(value);
		}
	};

	return (
		<div className="filter-bar">
			<Row gutter={[16, 16]} align="middle">
				<Col xs={24} sm={24} md={8} lg={8} xl={8}>
					<div className="filter-item">
						<label htmlFor="teams-filter">Team</label>
						<Select
							id="teams-filter"
							mode="multiple"
							placeholder="Select teams"
							value={selectedTeams}
							onChange={handleTeamChange}
							style={{ width: '100%' }}
							allowClear
						>
							{teams.map((team) => (
								<Option key={team.id} value={team.id}>
									{team.name}
								</Option>
							))}
						</Select>
					</div>
				</Col>

				<Col xs={24} sm={12} md={8} lg={8} xl={8}>
					<div className="filter-item">
						<label htmlFor="sort-option">Sort By</label>
						<Select
							id="sort-option"
							value={sortOption}
							onChange={handleSortChange}
							style={{ width: '100%' }}
						>
							<Option value="date_newest">Date (Newest First)</Option>
							<Option value="date_oldest">Date (Oldest First)</Option>
						</Select>
					</div>
				</Col>

				<Col xs={24} sm={12} md={8} lg={8} xl={8}>
					<div className="filter-item">
						<label htmlFor="valuation-model">Valuation Model</label>
						<Select
							id="valuation-model"
							value={selectedValuation}
							onChange={handleValuationChange}
							style={{ width: '100%' }}
							loading={loading}
						>
							{valuationModels.map((model) => (
								<Option key={model.id} value={model.id}>
									{model.name}
								</Option>
							))}
						</Select>
					</div>
				</Col>
			</Row>
		</div>
	);
};

export default FilterBar;
