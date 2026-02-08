export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
  return { valid: errors.length === 0, errors };
}

export function validateWeight(weight: number): boolean {
  return weight > 0 && weight < 1000;
}

export function validateReps(reps: number): boolean {
  return Number.isInteger(reps) && reps > 0 && reps <= 999;
}

export function validateServings(servings: number): boolean {
  return servings > 0 && servings <= 100;
}
