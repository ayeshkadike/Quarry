import { ThemeProvider } from '@/lib/useTheme';
import { ChatPage } from '@/pages/ChatPage';

function App() {
  return (
    <ThemeProvider>
      <ChatPage />
    </ThemeProvider>
  );
}

export default App;
