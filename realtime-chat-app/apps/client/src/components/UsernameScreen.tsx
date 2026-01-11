import { useState, FormEvent } from 'react';

interface UsernameScreenProps {
  onUsernameSubmit: (username: string) => void;
}

/**
 * Username entry screen
 * Shown before chat interface opens
 */
export function UsernameScreen({ onUsernameSubmit }: UsernameScreenProps): JSX.Element {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length === 0) {
      setError('Please enter your name');
      return;
    }

    if (trimmedUsername.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    setError(null);
    onUsernameSubmit(trimmedUsername);
  };

  return (
    <div className="username-screen">
      <div className="username-screen-container">
        <div className="username-screen-header">
          <h1>Welcome to Chat App</h1>
          <p>Enter your name to start chatting</p>
        </div>
        <form onSubmit={handleSubmit} className="username-screen-form">
          {error && (
            <div className="username-screen-error" role="alert">
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            className="username-screen-input"
            autoFocus
            maxLength={50}
          />
          <button type="submit" className="username-screen-button">
            Start Chatting
          </button>
        </form>
      </div>
    </div>
  );
}
