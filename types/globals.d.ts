export { }

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            onboarding_completed?: boolean;
        };
    }
}
