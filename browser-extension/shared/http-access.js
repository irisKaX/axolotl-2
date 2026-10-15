/** Recognize authentication responses without retaining login HTML or SSO query strings. */
export function authenticationIssue(url, response, kind = 'page') {
  let requested, destination;
  try {
    requested = new URL(url);
    destination = new URL(response.url || url);
  } catch {
    return null;
  }
  const redirected = destination.origin !== requested.origin || destination.pathname !== requested.pathname;
  const loginPath = /(?:^|\/)(?:login|sign-?in|prihlaseni|prihlasit)(?:\/|\.|$)/i.test(destination.pathname);
  const reason = response.status === 401 ? 'http-401' : redirected && loginPath ? 'login-redirect' : null;
  if (!reason) return null;
  return { reason, kind, url, status: response.status, destination: destination.origin + destination.pathname };
}
