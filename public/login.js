document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginToggle = document.getElementById('loginToggle');
    const registerToggle = document.getElementById('registerToggle');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const passwordInput = document.getElementById('registerPassword');
    const strengthMeter = document.querySelector('.strength-meter');
    const strengthText = document.querySelector('.strength-text');

    
    loginToggle.addEventListener('click', () => {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        loginToggle.classList.add('active');
        registerToggle.classList.remove('active');
    });

    registerToggle.addEventListener('click', () => {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        registerToggle.classList.add('active');
        loginToggle.classList.remove('active');
    });

   
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = '🔒';
            } else {
                input.type = 'password';
                button.textContent = '👁';
            }
        });
    });


    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);
        updateStrengthMeter(strength);
    });

    function calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/\d/)) strength++;
        if (password.match(/[^a-zA-Z\d]/)) strength++;
        return strength;
    }

    function updateStrengthMeter(strength) {
        const width = (strength / 4) * 100;
        strengthMeter.style.width = `${width}%`;
        
        let color, text;
        switch (strength) {
            case 0:
            case 1:
                color = '#ff4d4d';
                text = 'Weak';
                break;
            case 2:
                color = '#ffa64d';
                text = 'Moderate';
                break;
            case 3:
                color = '#99cc00';
                text = 'Strong';
                break;
            case 4:
                color = '#22cc00';
                text = 'Very Strong';
                break;
        }
        
        strengthMeter.style.background = color;
        strengthText.textContent = text;
        strengthText.style.color = color;
    }

    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
    
        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
              
                localStorage.setItem('userId', data.userId); 
                alert(data.message);
                window.location.href = 'home.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Error logging in');
        }
    });
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('http://localhost:3001/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                
                loginToggle.click(); 
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Error registering user');
        }
    });
});