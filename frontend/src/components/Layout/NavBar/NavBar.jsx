import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
	HomeOutlined,
	SaveOutlined,
	BarChartOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
} from '@ant-design/icons';
import './NavBar.css';

const { Sider } = Layout;

// Collapsible sidebar navigation with icons and labels
const NavBar = ({ items, collapsed, setCollapsed }) => {
	const navigate = useNavigate();
	const location = useLocation();

	// Determine current page path for highlighting selected menu item
	const selectedKey = location.pathname;

	// Handle sidebar navigation to selected route
	const handleMenuClick = ({ key }) => {
		navigate(key);
	};

	// Dynamically assign icons to menu items based on label
	const menuItems = items.map((item) => {
		// Determine the icon based on the label
		let icon;
		if (item.label === 'Home') {
			icon = <HomeOutlined />;
		} else if (item.label === 'Saved Trades') {
			icon = <SaveOutlined />;
		} else if (item.label === 'Valuations') {
			icon = <BarChartOutlined />;
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
			<div className="logo-container">
				<img
					src="lakersLogo.svg"
					alt="Lakers Logo"
					className={collapsed ? 'logo-small' : 'logo-large'}
				/>
			</div>
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
