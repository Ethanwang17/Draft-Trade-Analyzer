// Import React and hooks
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import { useState, useEffect } from 'react';

// Import Ant Design and custom styles
import 'antd/dist/reset.css';
import './App.css';

// Import custom components and pages
import NavBar from './components/Layout/NavBar/NavBar';
import HomePage from './pages/HomePage';
import SavedTradesPage from './pages/SavedTradesPage';
import AnalyzeTrade from './pages/AnalyzeTrade';
import ValuationModelPage from './pages/ValuationModelPage';

const { Content } = Layout;

function App() {
	// State to track sidebar collapse and if user manually toggled it
	const [collapsed, setCollapsed] = useState(false);
	const [userToggled, setUserToggled] = useState(false);

	// Automatically collapse the sidebar on smaller screens unless user has manually toggled it
	useEffect(() => {
		const handleResize = () => {
			if (!userToggled) {
				if (window.innerWidth < 769) {
					setCollapsed(true);
				} else {
					setCollapsed(false);
				}
			}
		};

		window.addEventListener('resize', handleResize);
		handleResize(); // Perform initial screen size check

		return () => window.removeEventListener('resize', handleResize);
	}, [userToggled]);

	// Manually toggle the sidebar collapse state
	const handleToggleCollapse = (value) => {
		setUserToggled(true);
		setCollapsed(value);
	};

	// Navigation links for the sidebar
	const navItems = [
		{
			label: 'Home',
			href: '/home',
		},
		{
			label: 'Saved Trades',
			href: '/saved',
		},
		{
			label: 'Valuations',
			href: '/valuations',
		},
	];

	return (
		// Set Ant Design theme
		<ConfigProvider
			theme={{
				token: {
					colorPrimary: '#5b21b6',
				},
			}}
		>
			<Router>
				<Layout style={{ minHeight: '100vh' }}>
					{/* Sidebar Navigation */}
					<NavBar items={navItems} collapsed={collapsed} setCollapsed={handleToggleCollapse} />
					
					{/* Main Content Area */}
					<Layout className="site-layout" style={{ marginLeft: collapsed ? 80 : 180 }}>
						<Content className="content">
							{/* Define app routes */}
							<Routes>
								<Route path="/home" element={<HomePage />} />
								<Route path="/saved" element={<SavedTradesPage />} />
								<Route path="/analyze" element={<AnalyzeTrade />} />
								<Route path="/valuations" element={<ValuationModelPage />} />
								<Route path="/" element={<Navigate to="/home" />} />
							</Routes>
						</Content>
					</Layout>
				</Layout>
			</Router>
		</ConfigProvider>
	);
}

export default App;
