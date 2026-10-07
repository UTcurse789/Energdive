// UI hint only: server-side access continues to use the saved database profile.
const COMPLETED_USER_KEY = "onboarding_completed_user";

export function hasCompletedOnboarding(userId: string): boolean {
    try {
        return sessionStorage.getItem(COMPLETED_USER_KEY) === userId;
    } catch {
        return false;
    }
}

export function rememberOnboardingCompletion(userId: string): void {
    try {
        sessionStorage.setItem(COMPLETED_USER_KEY, userId);
    } catch { /* Storage may be unavailable in private browsing. */ }
}
