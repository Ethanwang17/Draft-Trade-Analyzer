import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
	HomeOutlined,
	SaveOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
} from '@ant-design/icons';
import './NavBar.css';

const { Sider } = Layout;

const NavBar = ({ items, collapsed, setCollapsed }) => {
	const navigate = useNavigate();
	const location = useLocation();

	// Get the current path to determine which menu item should be selected
	const selectedKey = location.pathname;

	// Handle menu item click
	const handleMenuClick = ({ key }) => {
		navigate(key);
	};

	// Map navigation items to Ant Design Menu items
	const menuItems = items.map((item) => {
		// Determine the icon based on the label
		let icon;
		if (item.label === 'Home') {
			icon = <HomeOutlined />;
		} else if (item.label === 'Saved Trades') {
			icon = <SaveOutlined />;
		}

		return {
			key: item.href,
			icon,
			label: item.label,
		};
	});

	return (
		<Sider
			collapsible
			collapsed={collapsed}
			trigger={null}
			className="navbar-sider"
			theme="light"
			width={180}
			collapsedWidth={80}
		>
			<div className="logo-container">{collapsed ? 'DTA' : 'Draft Trade Analyzer'}</div>
			<Menu
				mode="inline"
				selectedKeys={[selectedKey]}
				items={menuItems}
				onClick={handleMenuClick}
				className="navbar-menu"
			/>
			<div className="collapse-button-container">
				<Button type="text" onClick={() => setCollapsed(!collapsed)} className="collapse-button">
					{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
				</Button>
			</div>
		</Sider>
	);
};

export default NavBar;
