type ValidationErrorPayload = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

type ApiErrorResponse = {
  error?: string;
  errors?: ValidationErrorPayload;
};

export function translateApiErrorMessage(
  data: ApiErrorResponse | undefined,
  fallback: string,
  t: (key: string) => string,
) {
  if (!data) return fallback;

  const firstFieldError = Object.values(data.errors?.fieldErrors ?? {})
    .flat()
    .find((message): message is string => Boolean(message));

  return t(data.error ?? data.errors?.formErrors?.[0] ?? firstFieldError ?? fallback);
}

export function translateApiErrorFromUnknown(
  error: unknown,
  fallback: string,
  t: (key: string) => string,
) {
  const data = (error as { response?: { data?: ApiErrorResponse } })?.response?.data;
  return translateApiErrorMessage(data, fallback, t);
}
