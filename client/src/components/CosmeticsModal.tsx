import { useState } from 'react';
import {
  AVATARS,
  CARD_SKINS,
  THEMES,
  getSavedCosmetics,
  saveCosmetics,
  type UserCosmetics,
} from '../cosmetics';
import { playClickSound } from '../audio';
import Card from './Card';

interface CosmeticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHost?: boolean;
  currentRoomTheme?: string;
  onThemeChange?: (themeId: string) => void;
  onCosmeticsChange?: (cosmetics: UserCosmetics) => void;
}

export default function CosmeticsModal({
  isOpen,
  onClose,
  isHost = false,
  currentRoomTheme,
  onThemeChange,
  onCosmeticsChange,
}: CosmeticsModalProps) {
  const [cosmetics, setCosmetics] = useState<UserCosmetics>(() => getSavedCosmetics());
  const [activeTab, setActiveTab] = useState<'avatar' | 'card' | 'theme'>('avatar');

  if (!isOpen) return null;

  const handleSelectAvatar = (emoji: string) => {
    playClickSound();
    const updated = saveCosmetics({ avatar: emoji });
    setCosmetics(updated);
    onCosmeticsChange?.(updated);
  };

  const handleSelectCardSkin = (skinId: string) => {
    playClickSound();
    const updated = saveCosmetics({ cardSkin: skinId });
    setCosmetics(updated);
    onCosmeticsChange?.(updated);
  };

  const handleSelectTheme = (themeId: string) => {
    playClickSound();
    const updated = saveCosmetics({ theme: themeId });
    setCosmetics(updated);
    onCosmeticsChange?.(updated);
    onThemeChange?.(themeId);
  };

  const handleToggleSound = () => {
    playClickSound();
    const updated = saveCosmetics({ soundEnabled: !cosmetics.soundEnabled });
    setCosmetics(updated);
    onCosmeticsChange?.(updated);
  };

  return (
    <div className="cosmetics-overlay" onClick={onClose}>
      <div className="cosmetics-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="title-row">
            <h2>🎨 Tùy Chỉnh & Ngoại Trang (Cosmetics)</h2>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
          <p className="modal-subtitle">Cá nhân hóa nhân vật, phong cách lá bài và bối cảnh bàn chơi</p>

          {/* Navigation Tabs */}
          <div className="modal-tabs">
            <button
              className={`tab-btn ${activeTab === 'avatar' ? 'active' : ''}`}
              onClick={() => {
                playClickSound();
                setActiveTab('avatar');
              }}
            >
              👤 Avatar ({cosmetics.avatar})
            </button>
            <button
              className={`tab-btn ${activeTab === 'card' ? 'active' : ''}`}
              onClick={() => {
                playClickSound();
                setActiveTab('card');
              }}
            >
              🃏 Vỏ Bài (Skins)
            </button>
            <button
              className={`tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => {
                playClickSound();
                setActiveTab('theme');
              }}
            >
              🏰 Theme Bàn Chơi
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* TAB 1: AVATARS */}
          {activeTab === 'avatar' && (
            <div className="avatar-grid-wrapper">
              <h3>Chọn biểu tượng Avatar đại diện:</h3>
              <div className="avatar-grid">
                {AVATARS.map((av) => {
                  const isSelected = cosmetics.avatar === av.emoji;
                  return (
                    <div
                      key={av.id}
                      className={`avatar-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectAvatar(av.emoji)}
                    >
                      <span className="avatar-emoji">{av.emoji}</span>
                      <span className="avatar-name">{av.name}</span>
                      {isSelected && <span className="active-badge">✓ Đang dùng</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CARD SKINS */}
          {activeTab === 'card' && (
            <div className="skins-wrapper">
              <h3>Chọn mẫu mặt sau lá bài của bạn:</h3>
              <div className="skins-grid">
                {CARD_SKINS.map((sk) => {
                  const isSelected = cosmetics.cardSkin === sk.id;
                  return (
                    <div
                      key={sk.id}
                      className={`skin-card-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectCardSkin(sk.id)}
                    >
                      <div className="skin-card-preview">
                        <Card faceDown size="md" skin={sk.id} />
                      </div>
                      <div className="skin-info">
                        <span className="skin-name">
                          {sk.badge} {sk.name}
                        </span>
                        {isSelected && <span className="active-badge">✓ Đang dùng</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: THEMES */}
          {activeTab === 'theme' && (
            <div className="themes-wrapper">
              <div className="theme-banner-info">
                <h3>Không gian bàn chơi & Phòng chờ:</h3>
                {!isHost && (
                  <p className="theme-note">
                    (Lưu ý: Chỉ Chủ Phòng - Host mới có thể đổi Theme cho tất cả người chơi trong phòng)
                  </p>
                )}
              </div>
              <div className="themes-list">
                {THEMES.map((th) => {
                  const isCurrent =
                    (currentRoomTheme || cosmetics.theme) === th.id;
                  return (
                    <div
                      key={th.id}
                      className={`theme-card ${isCurrent ? 'selected' : ''}`}
                      onClick={() => handleSelectTheme(th.id)}
                    >
                      <div
                        className="theme-preview-box"
                        style={{ background: th.bgGradient }}
                      >
                        <span className="theme-badge-icon">{th.badge}</span>
                      </div>
                      <div className="theme-card-body">
                        <div className="theme-header">
                          <span className="theme-title">{th.name}</span>
                          {isCurrent && <span className="active-badge">✓ Đang áp dụng</span>}
                        </div>
                        <p className="theme-desc">{th.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="sound-toggle-btn" onClick={handleToggleSound}>
            {cosmetics.soundEnabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT'}
          </button>
          <button className="btn btn-primary done-btn" onClick={onClose}>
            Xong (Done)
          </button>
        </div>

        <style>{`
          .cosmetics-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 500;
            animation: fadeIn 0.2s ease-out;
          }

          .cosmetics-modal {
            background: #0f172a;
            border: 2px solid #3b82f6;
            box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.35);
            border-radius: 20px;
            width: 92%;
            max-width: 650px;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .modal-header {
            padding: 1.25rem 1.75rem 0.75rem;
            background: #1e293b;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .title-row h2 {
            font-size: 1.35rem;
            margin: 0;
            color: #f8fafc;
            font-weight: 800;
          }

          .close-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #cbd5e1;
            font-size: 1rem;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          .close-btn:hover {
            background: #ef4444;
            color: white;
          }

          .modal-subtitle {
            color: #94a3b8;
            font-size: 0.85rem;
            margin: 0.25rem 0 1rem;
          }

          .modal-tabs {
            display: flex;
            gap: 0.5rem;
          }

          .tab-btn {
            flex: 1;
            padding: 0.6rem 0.5rem;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #cbd5e1;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .tab-btn.active {
            background: #3b82f6;
            color: white;
            border-color: #60a5fa;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }

          .modal-body {
            padding: 1.5rem 1.75rem;
            overflow-y: auto;
            flex: 1;
            scrollbar-width: thin;
          }

          .modal-body h3 {
            font-size: 1rem;
            color: #e2e8f0;
            margin-bottom: 1rem;
          }

          .avatar-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 0.75rem;
          }

          .avatar-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.75rem 0.5rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .avatar-item:hover {
            transform: translateY(-3px);
            border-color: #60a5fa;
            background: rgba(59, 130, 246, 0.15);
          }

          .avatar-item.selected {
            border-color: #fbbf24;
            background: rgba(251, 191, 36, 0.15);
            box-shadow: 0 0 14px rgba(251, 191, 36, 0.3);
          }

          .avatar-emoji {
            font-size: 2.25rem;
            margin-bottom: 0.25rem;
          }

          .avatar-name {
            font-size: 0.75rem;
            font-weight: 600;
            color: #cbd5e1;
            text-align: center;
          }

          .active-badge {
            font-size: 0.7rem;
            background: #fbbf24;
            color: #78350f;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 999px;
            margin-top: 0.25rem;
          }

          .skins-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
          }

          .skin-card-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .skin-card-item:hover {
            transform: translateY(-4px);
            border-color: #60a5fa;
          }

          .skin-card-item.selected {
            border-color: #fbbf24;
            background: rgba(251, 191, 36, 0.1);
            box-shadow: 0 0 16px rgba(251, 191, 36, 0.35);
          }

          .skin-card-preview {
            margin-bottom: 0.75rem;
          }

          .skin-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
          }

          .skin-name {
            font-size: 0.85rem;
            font-weight: 700;
            color: #f1f5f9;
          }

          .themes-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .theme-banner-info {
            margin-bottom: 0.75rem;
          }

          .theme-note {
            color: #fbbf24;
            font-size: 0.75rem;
            font-style: italic;
          }

          .theme-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .theme-card:hover {
            border-color: #60a5fa;
            transform: translateX(4px);
          }

          .theme-card.selected {
            border-color: #fbbf24;
            background: rgba(251, 191, 36, 0.12);
            box-shadow: 0 0 16px rgba(251, 191, 36, 0.3);
          }

          .theme-preview-box {
            width: 52px;
            height: 52px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255, 255, 255, 0.2);
            flex-shrink: 0;
          }

          .theme-badge-icon {
            font-size: 1.5rem;
          }

          .theme-card-body {
            flex: 1;
          }

          .theme-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.2rem;
          }

          .theme-title {
            font-weight: 800;
            font-size: 0.95rem;
            color: #f8fafc;
          }

          .theme-desc {
            font-size: 0.75rem;
            color: #94a3b8;
            margin: 0;
          }

          .modal-footer {
            padding: 1rem 1.75rem;
            background: #1e293b;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .sound-toggle-btn {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #e2e8f0;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .sound-toggle-btn:hover {
            background: rgba(255, 255, 255, 0.18);
          }

          .done-btn {
            padding: 0.5rem 1.5rem;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes popIn {
            from { opacity: 0; transform: scale(0.92); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
