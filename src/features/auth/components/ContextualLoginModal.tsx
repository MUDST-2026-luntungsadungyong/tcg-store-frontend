import { useNavigate } from 'react-router-dom';
import { FeedbackPopup } from '@/shared/components/FeedbackPopup';

interface ContextualLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function ContextualLoginModal({
  isOpen,
  onClose,
  message = 'Log in to save cards and reserve seller listings.',
}: ContextualLoginModalProps) {
  const navigate = useNavigate();

  function handleLogin() {
    onClose();
    navigate('/login', { state: { from: window.location.pathname } });
  }

  return (
    <FeedbackPopup
      isOpen={isOpen}
      tone="auth"
      title="Sign in to collect this card"
      message={message}
      meta="You'll return to this card after login."
      primaryAction={{ label: 'Log in', onClick: handleLogin }}
      secondaryAction={{ label: 'Not now', onClick: onClose }}
    />
  );
}
