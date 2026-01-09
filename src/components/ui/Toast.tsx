type Props = {
  message: string;
  type: "success" | "error";
  onClose: () => void;
};

export default function Toast({ message, type, onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: type === "success" ? "#16a34a" : "#dc2626",
        color: "white",
        padding: "12px 16px",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        zIndex: 9999,
        cursor: "pointer",
      }}
      onClick={onClose}
    >
      {message}
    </div>
  );
}
