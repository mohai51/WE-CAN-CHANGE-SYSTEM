// Generic Registration Handler
const forms = ['donor-form', 'volunteer-form', 'beneficiary-form'];

forms.forEach(formId => {
    const formElement = document.getElementById(formId);
    if (formElement) {
        formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const password = formElement.querySelector('#password').value;
            const confirmPassword = formElement.querySelector('#confirmPassword').value;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            if (password.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }

            console.log(`Registration submitted for ${formId}`);
            alert("Registration successful!");
            // window.location.href = "login.html";
        });
    }
});