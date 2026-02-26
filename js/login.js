/*
 * Login and signup logic for AtlasRegion7 with backend API integration.
 *
 * This script submits login and registration forms to the Express API
 * endpoints.  Upon successful authentication a JWT token and user
 * details are stored in localStorage under ar7_token and ar7_user.
 * Region preference defaults to North America but can be changed
 * elsewhere in the app.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  // Handle login submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
      alert('Email and password are required');
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Login failed');
        return;
      }
      // Store token and user in localStorage
      localStorage.setItem('ar7_token', data.token);
      localStorage.setItem('ar7_user', JSON.stringify(data.user));
      // Default region preference if not previously set
      if (!localStorage.getItem('ar7_region')) {
        setRegionPreference('north-america');
      }
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      alert('An error occurred during login');
    }
  });

  // Handle signup submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const plan = document.getElementById('signup-plan').value;
    if (!username || !email || !password) {
      alert('All fields are required');
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, plan })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Registration failed');
        return;
      }
      // Automatically log the user in after successful registration
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        alert('Registration succeeded but login failed');
        return;
      }
      localStorage.setItem('ar7_token', loginData.token);
      localStorage.setItem('ar7_user', JSON.stringify(loginData.user));
      if (!localStorage.getItem('ar7_region')) {
        setRegionPreference('north-america');
      }
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      alert('An error occurred during registration');
    }
  });
});