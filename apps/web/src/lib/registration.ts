export const isDevelopmentCompanySignupEnabled = import.meta.env.DEV;

export function getPublicRegistrationHref() {
  return isDevelopmentCompanySignupEnabled ? "/register" : "/register?paid=1";
}
