import { createRoot } from 'react-dom/client';

import Panel from './Panel';
import './index.css';

const container = document.getElementById('app-container');
const root = createRoot(container);
root.render(<Panel />);
