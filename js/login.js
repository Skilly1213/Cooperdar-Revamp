const form = document.querySelector('#login-form');
const password = document.querySelector('#password');
const togglePassword = document.querySelector('#toggle-password');
const message = document.querySelector('#form-message');

togglePassword.addEventListener('click', () => {
	const isPassword = password.type === 'password';
	password.type = isPassword ? 'text' : 'password';
	togglePassword.textContent = isPassword ? 'HIDE' : 'SHOW';
	togglePassword.setAttribute('aria-label', `${isPassword ? 'Hide' : 'Show'} password`);
});

form.addEventListener('submit', (event) => {
	event.preventDefault();
	if (!form.reportValidity()) return;
	message.textContent = 'Demo access enabled. Opening radar…';
	message.style.color = '#087f78';
	setTimeout(() => { window.location.href = 'index.html'; }, 450);
});
