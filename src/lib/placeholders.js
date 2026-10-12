// Neutral images shown when a record has no photo. Never substitute a stock
// photo for a real person or business — admins compare photos against IDs.
const svg = (body) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/>${body}</svg>`)}`

export const AVATAR_PLACEHOLDER = svg('<circle cx="50" cy="38" r="18" fill="#94a3b8"/><path d="M18 92c4-20 18-30 32-30s28 10 32 30z" fill="#94a3b8"/>')
export const IMAGE_PLACEHOLDER = svg('<path d="M22 70l18-22 14 16 10-12 14 18z" fill="#94a3b8"/><circle cx="66" cy="34" r="7" fill="#94a3b8"/>')
