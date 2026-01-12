type Props = {
  checked?: boolean;
  label: string;
  onToggle?: () => void;
  onDelete: () => void;
};

export default function ItemRow({
  checked,
  label,
  onToggle,
  onDelete,
}: Props) {
  return (
    <div className={`item-row ${checked ? "done" : ""}`}>
      {typeof checked === "boolean" && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
        />
      )}

      <span>{label}</span>

      <button className="delete-btn" onClick={onDelete}>
        ✕
      </button>
    </div>
  );
}
