import type { CardColor } from '@uno/shared';

interface ColorPickerProps {
  onSelectColor: (color: CardColor) => void;
  onCancel: () => void;
}

const COLORS: { key: CardColor; label: string; bg: string; hover: string }[] = [
  { key: 'red', label: 'Red', bg: '#e11d48', hover: '#f43f5e' },
  { key: 'blue', label: 'Blue', bg: '#2563eb', hover: '#3b82f6' },
  { key: 'yellow', label: 'Yellow', bg: '#d97706', hover: '#f59e0b' },
  { key: 'green', label: 'Green', bg: '#059669', hover: '#10b981' },
];

export default function ColorPicker({ onSelectColor, onCancel }: ColorPickerProps) {
  return (
    <div className="color-picker-overlay">
      <div className="color-picker-modal">
        <h3 className="picker-title">Choose a Color</h3>
        <p className="picker-subtitle">Select the active color for the next play</p>

        <div className="color-grid">
          {COLORS.map((c) => (
            <button
              key={c.key}
              className="color-btn"
              style={{ backgroundColor: c.bg }}
              onClick={() => onSelectColor(c.key)}
            >
              <span className="color-label">{c.label}</span>
            </button>
          ))}
        </div>

        <button className="btn btn-secondary cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <style>{`
        .color-picker-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.15s ease-out;
        }

        .color-picker-modal {
          background: #1e1b4b;
          border: 2px solid #4338ca;
          border-radius: 16px;
          padding: 2rem;
          width: 90%;
          max-width: 420px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        }

        .picker-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.25rem;
          color: #f8fafc;
        }

        .picker-subtitle {
          font-size: 0.9rem;
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }

        .color-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .color-btn {
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 1.75rem 1rem;
          cursor: pointer;
          font-weight: 800;
          font-size: 1.15rem;
          color: #ffffff;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .color-btn:hover {
          transform: scale(1.05);
          border-color: #ffffff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }

        .cancel-btn {
          width: 100%;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
