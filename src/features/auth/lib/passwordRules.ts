export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'No more than 72 characters', test: (value: string) => value.length <= 72 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value: string) => /[0-9]/.test(value) },
];
