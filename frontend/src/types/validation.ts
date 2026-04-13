export type ValidationErrorCode =
  | 'required'
  | 'min'
  | 'max'
  | 'email'
  | 'isoDate'
  | 'compareDate'
  | 'positiveInt'
  | 'distinctIds'

export type FieldErrors<T extends string = string> = Partial<Record<T, string[]>>
