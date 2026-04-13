export const validationRules = {
  auth: {
    emailMax: 255,
    passwordMin: 8,
    passwordMax: 128,
  },
  user: {
    nameMin: 2,
    nameMax: 120,
    emailMax: 255,
    passwordMin: 8,
    passwordMax: 128,
  },
  tournament: {
    nameMin: 2,
    nameMax: 100,
    descriptionMax: 2000,
  },
  score: {
    goalsMin: 0,
  },
} as const
