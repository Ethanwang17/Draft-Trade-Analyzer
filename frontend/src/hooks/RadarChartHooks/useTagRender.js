import React from 'react';
import { Tag } from 'antd';

/**
 * Hook for generating props for custom tag rendering in the Select component.
 * @param {Array} axisOptions - Array of axis options with colors.
 * @returns {Function} A function that takes Ant Design's tagRender props and returns props for the Tag component.
 */
export function useTagRender(axisOptions) {
	return (props) => {
		const { label, value, closable, onClose } = props;
		const option = axisOptions.find((opt) => opt.value === value);
		const color = option ? option.color : '#1677ff';

		const onPreventMouseDown = (event) => {
			event.preventDefault();
			event.stopPropagation();
		};

		return {
			color,
			onMouseDown: onPreventMouseDown,
			closable,
			onClose,
			className: 'radar-chart-tag',
			children: label,
		};
	};
}
