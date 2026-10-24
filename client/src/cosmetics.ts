// ============================================================
// COSMETICS & THEMES DEFINITIONS
// ============================================================

export interface AvatarOption {
  id: string;
  emoji: string;
  name: string;
}

export interface ThemeOption {
  id: string;
  name: string;
  badge: string;
  bgGradient: string;
  tableBg: string;
  accentColor: string;
  description: string;
}

export interface CardSkinOption {
  id: string;
  name: string;
  badge: string;
  bg: string;
  border: string;
  pattern: string;
}

export const AVATARS: AvatarOption[] = [
  { id: 'boy', emoji: '🧑', name: 'Thanh Niên' },
  { id: 'girl', emoji: '👧', name: 'Thiếu Nữ' },
  { id: 'robot', emoji: '🤖', name: 'Người Máy' },
  { id: 'fox', emoji: '🦊', name: 'Cáo Thông Thái' },
  { id: 'cat', emoji: '🐱', name: 'Mèo Neko' },
  { id: 'panda', emoji: '🐼', name: 'Gấu Trúc' },
  { id: 'lion', emoji: '🦁', name: 'Sư Tử' },
  { id: 'wizard', emoji: '🧙', name: 'Pháp Sư' },
  { id: 'ninja', emoji: '🥷', name: 'Ninja' },
  { id: 'king', emoji: '👑', name: 'Hoàng Gia' },
  { id: 'unicorn', emoji: '🦄', name: 'Kỳ Lân' },
  { id: 'alien', emoji: '👽', name: 'Người Ngoài Hành Tinh' },
];

export const THEMES: ThemeOption[] = [
  {
    id: 'neon',
    name: 'Midnight Neon',
    badge: '🌌',
    bgGradient: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)',
    tableBg: 'rgba(30, 41, 59, 0.75)',
    accentColor: '#818cf8',
    description: 'Phong cách viễn tưởng huyền bí với ánh sáng Neon huyền ảo',
  },
  {
    id: 'casino',
    name: 'Casino Royale',
    badge: '♠️',
    bgGradient: 'radial-gradient(circle at center, #064e3b 0%, #022c22 100%)',
    tableBg: 'rgba(6, 78, 59, 0.85)',
    accentColor: '#fbbf24',
    description: 'Bàn nỉ xanh ngọc bích sang trọng như sòng bạc Las Vegas',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    badge: '⚡',
    bgGradient: 'radial-gradient(circle at center, #4a044e 0%, #18021c 100%)',
    tableBg: 'rgba(88, 28, 135, 0.75)',
    accentColor: '#f43f5e',
    description: 'Ánh đèn hồng tím rực lửa tương lai công nghệ cao',
  },
  {
    id: 'sunset',
    name: 'Sunset Dunes',
    badge: '🌅',
    bgGradient: 'radial-gradient(circle at center, #451a03 0%, #1c0a00 100%)',
    tableBg: 'rgba(120, 53, 15, 0.75)',
    accentColor: '#f59e0b',
    description: 'Hoàng hôn ấm áp rực rỡ bên bờ biển vàng',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Minimal',
    badge: '🖤',
    bgGradient: 'radial-gradient(circle at center, #18181b 0%, #09090b 100%)',
    tableBg: 'rgba(24, 24, 27, 0.85)',
    accentColor: '#38bdf8',
    description: 'Tối giản sang trọng với tông đen tuyền thạch anh',
  },
];

export const CARD_SKINS: CardSkinOption[] = [
  {
    id: 'classic',
    name: 'UNO Cổ Điển',
    badge: '🔴',
    bg: '#e11d48',
    border: '#ffffff',
    pattern: 'rotate(-15deg)',
  },
  {
    id: 'cyber',
    name: 'Cyber Matrix',
    badge: '💠',
    bg: '#0284c7',
    border: '#38bdf8',
    pattern: 'rotate(0deg)',
  },
  {
    id: 'luxury',
    name: 'Vàng Hoàng Kim',
    badge: '✨',
    bg: '#b45309',
    border: '#fbbf24',
    pattern: 'rotate(-15deg)',
  },
  {
    id: 'obsidian',
    name: 'Hắc Thạch Carbon',
    badge: '🌑',
    bg: '#18181b',
    border: '#52525b',
    pattern: 'rotate(0deg)',
  },
  {
    id: 'galaxy',
    name: 'Tinh Vân Galaxy',
    badge: '🔮',
    bg: '#7c3aed',
    border: '#c084fc',
    pattern: 'rotate(-15deg)',
  },
];

export interface UserCosmetics {
  avatar: string;
  cardSkin: string;
  theme: string;
  soundEnabled: boolean;
}

const STORAGE_KEY = 'uno_user_cosmetics';

export function getSavedCosmetics(): UserCosmetics {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        avatar: parsed.avatar || '🦊',
        cardSkin: parsed.cardSkin || 'classic',
        theme: parsed.theme || 'neon',
        soundEnabled: parsed.soundEnabled ?? true,
      };
    }
  } catch {
    // fallback
  }

  return {
    avatar: '🦊',
    cardSkin: 'classic',
    theme: 'neon',
    soundEnabled: true,
  };
}

export function saveCosmetics(cosmetics: Partial<UserCosmetics>): UserCosmetics {
  const current = getSavedCosmetics();
  const updated = { ...current, ...cosmetics };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full/unavailable
  }
  return updated;
}
