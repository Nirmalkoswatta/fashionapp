const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterForm(values) {
    const errors = [];

    if (!values.username || values.username.trim().length < 2) {
        errors.push("Username must be at least 2 characters.");
    }

    if (!values.email || !EMAIL_REGEX.test(values.email)) {
        errors.push("Enter a valid email address.");
    }

    const password = values.password || "";
    if (password.length < 6) errors.push("Password must be at least 6 characters.");

    if (values.confirmPassword !== password) {
        errors.push("Confirm password must match password.");
    }

    return errors;
}

export function validateLoginForm(values) {
    const errors = [];

    if (!values.email || !EMAIL_REGEX.test(values.email)) {
        errors.push("Enter a valid email address.");
    }

    if (!values.password) {
        errors.push("Password is required.");
    }

    return errors;
}
