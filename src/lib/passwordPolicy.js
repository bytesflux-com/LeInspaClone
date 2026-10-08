// Mirrors passwordProblems() in functions/src/passwordRecovery.js, which is
// what actually enforces it.
export const passwordRules = [
  { id: 'length', label: 'At least 12 characters', test: (p) => p.length >= 12 && p.length <= 128 },
  { id: 'case', label: 'Upper and lower case letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'number', label: 'At least one number', test: (p) => /[0-9]/.test(p) },
  { id: 'symbol', label: 'At least one symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
]
