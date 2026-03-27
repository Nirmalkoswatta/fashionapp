const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput(input) {
    const errors = [];

    if (!input.username || input.username.trim().length < 2) {
        errors.push("Username must be at least 2 characters long.");
    }

    if (!input.email || !EMAIL_REGEX.test(input.email)) {
        errors.push("Please provide a valid email address.");
    }

    const password = input.password || "";
    if (password.length < 6) {
        errors.push("Password must be at least 6 characters long.");
    }

    if (input.confirmPassword !== undefined && password !== input.confirmPassword) {
        errors.push("Confirm password does not match password.");
    }

    return errors;
}

function validateLoginInput(input) {
    const errors = [];

    if (!input.email || !EMAIL_REGEX.test(input.email)) {
        errors.push("Please provide a valid email address.");
    }

    if (!input.password || input.password.length < 1) {
        errors.push("Password is required.");
    }

    return errors;
}

module.exports = {
    validateRegisterInput,
    validateLoginInput,
};
