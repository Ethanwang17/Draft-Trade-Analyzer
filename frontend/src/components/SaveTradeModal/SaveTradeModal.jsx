import React from 'react';
import { Modal, Input } from 'antd';
import './SaveTradeModal.css';

function SaveTradeModal({ visible, tradeName, setTradeName, onSave, onCancel }) {
	return (
		<Modal
			title="Save Trade"
			open={visible}
			onOk={onSave}
			onCancel={onCancel}
			okText="Save"
			cancelText="Cancel"
		>
			<p>Enter a name for this trade:</p>
			<Input
				placeholder="Trade Name"
				value={tradeName}
				onChange={(e) => setTradeName(e.target.value)}
			/>
		</Modal>
	);
}

export default SaveTradeModal;
