type Props = {
  onClick?: () => void;
};

export default function FloatingChatButton({ onClick }: Props) {
  return (
    <button className="floating-chat" aria-label="Abrir chat" onClick={onClick}>
      💬
    </button>
  );
}
