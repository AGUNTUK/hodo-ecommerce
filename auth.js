// Hodo Authentication System
// Handles login, registration, and role-based access control

// ============================================
// ADMIN EMAILS - Configure admin users here
// ============================================
const ADMIN_EMAILS = [
  'admin@hodo.com',
  'sohel@hodo.com',
  // Add more admin emails as needed
];

// ============================================
// AUTHENTICATION STATE
// ============================================
let currentUser = null;
let userRole = null;

// ============================================
// DOM ELEMENTS
// ============================================
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginStatus = document.getElementById('loginStatus');
const registerStatus = document.getElementById('registerStatus');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showError(message, element) {
  element.textContent = message;
  element.classList.add('error');
  element.classList.remove('success');
}

function showSuccess(message, element) {
  element.textContent = message;
  element.classList.remove('error');
  element.classList.add('success');
}

function clearStatus(element) {
  element.textContent = '';
  element.classList.remove('error', 'success');
}

function isAdmin(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ============================================
// CHECK AUTHENTICATION STATE
// ============================================
async function checkAuthState() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error) throw error;
    
    if (session && session.user) {
      currentUser = session.user;
      userRole = isAdmin(session.user.email) ? 'admin' : 'customer';
      
      // If on login page and already logged in, redirect
      if (window.location.pathname.includes('login.html')) {
        redirectBasedOnRole();
      }
    }
    
    return { user: currentUser, role: userRole };
  } catch (error) {
    console.error('Error checking auth state:', error);
    return { user: null, role: null };
  }
}

// ============================================
// REDIRECT BASED ON ROLE
// ============================================
function redirectBasedOnRole() {
  if (userRole === 'admin') {
    window.location.href = 'admin/index.html';
  } else {
    window.location.href = 'shop.html';
  }
}

// ============================================
// LOGIN HANDLER
// ============================================
async function handleLogin(event) {
  event.preventDefault();
  clearStatus(loginStatus);

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showError('Please fill in all fields', loginStatus);
    return;
  }

  try {
    showSuccess('Signing in...', loginStatus);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    currentUser = data.user;
    userRole = isAdmin(email) ? 'admin' : 'customer';

    showSuccess('Login successful! Redirecting...', loginStatus);

    // Store user role in localStorage for quick access
    localStorage.setItem('hodo_user_role', userRole);
    localStorage.setItem('hodo_user_email', email);

    // Redirect after short delay
    setTimeout(() => {
      redirectBasedOnRole();
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password. Please try again.';
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Please check your email and confirm your account.';
    } else if (error.message.includes('Too many requests')) {
      errorMessage = 'Too many login attempts. Please wait a moment.';
    }
    
    showError(errorMessage, loginStatus);
  }
}

// ============================================
// REGISTER HANDLER
// ============================================
async function handleRegister(event) {
  event.preventDefault();
  clearStatus(registerStatus);

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const phone = document.getElementById('registerPhone').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    showError('Please fill in all required fields', registerStatus);
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters', registerStatus);
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match', registerStatus);
    return;
  }

  try {
    showSuccess('Creating your account...', registerStatus);

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
          phone: phone
        }
      }
    });

    if (error) throw error;

    // Create profile in profiles table
    if (data.user) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: data.user.id,
          name: name,
          email: email,
          phone: phone
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail registration if profile creation fails
      }
    }

    userRole = isAdmin(email) ? 'admin' : 'customer';
    localStorage.setItem('hodo_user_role', userRole);
    localStorage.setItem('hodo_user_email', email);

    showSuccess('Account created! Please check your email to confirm.', registerStatus);

    // If email confirmation is disabled, redirect immediately
    if (data.session) {
      currentUser = data.user;
      setTimeout(() => {
        redirectBasedOnRole();
      }, 1500);
    }

  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.message.includes('already registered')) {
      errorMessage = 'This email is already registered. Please sign in.';
    } else if (error.message.includes('Password')) {
      errorMessage = 'Password does not meet requirements.';
    }
    
    showError(errorMessage, registerStatus);
  }
}

// ============================================
// LOGOUT HANDLER
// ============================================
async function handleLogout() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) throw error;
    
    // Clear local storage
    localStorage.removeItem('hodo_user_role');
    localStorage.removeItem('hodo_user_email');
    localStorage.removeItem('hodo_session_id');
    
    currentUser = null;
    userRole = null;
    
    // Redirect to login
    window.location.href = 'login.html';
    
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even on error
    window.location.href = 'login.html';
  }
}

// ============================================
// PROTECT ADMIN ROUTES
// ============================================
async function protectAdminRoute() {
  const { user, role } = await checkAuthState();
  
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  
  if (role !== 'admin') {
    alert('Access denied. Admin privileges required.');
    window.location.href = 'shop.html';
    return false;
  }
  
  return true;
}

// ============================================
// PROTECT CUSTOMER ROUTES (require login)
// ============================================
async function protectCustomerRoute() {
  const { user } = await checkAuthState();
  
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  
  return true;
}

// ============================================
// GET CURRENT USER INFO
// ============================================
async function getCurrentUser() {
  if (currentUser) {
    return { user: currentUser, role: userRole };
  }
  
  return await checkAuthState();
}

// ============================================
// UPDATE UI FOR LOGGED IN USER
// ============================================
function updateUIForUser(user, role) {
  // Update profile links and show user info
  const profileLinks = document.querySelectorAll('[data-page-link="profile"]');
  const profileName = document.querySelector('.profile-name');
  const profileRole = document.querySelector('.profile-role');
  const profileImage = document.querySelector('.profile-section img');
  
  if (user) {
    // Update profile name if elements exist
    if (profileName) {
      profileName.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    }
    if (profileRole) {
      profileRole.textContent = role === 'admin' ? 'Admin' : 'Customer';
    }
    
    // Add logout functionality to logout links
    const logoutLinks = document.querySelectorAll('[data-action="logout"]');
    logoutLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
    });
  }
}

// ============================================
// FORM TOGGLE HANDLERS
// ============================================
function showLoginForm() {
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  authTitle.textContent = 'Welcome Back';
  authSubtitle.textContent = 'Sign in to continue to your account';
  clearStatus(loginStatus);
  clearStatus(registerStatus);
}

function showRegisterForm() {
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
  authTitle.textContent = 'Create Account';
  authSubtitle.textContent = 'Join Hodo for premium menswear';
  clearStatus(loginStatus);
  clearStatus(registerStatus);
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Check if already logged in
  await checkAuthState();
  
  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Register form
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Toggle forms
  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      showRegisterForm();
    });
  }
  
  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }
});

// ============================================
// EXPORT FUNCTIONS FOR OTHER MODULES
// ============================================
window.HodoAuth = {
  getCurrentUser,
  checkAuthState,
  handleLogout,
  protectAdminRoute,
  protectCustomerRoute,
  updateUIForUser,
  isAdmin,
  get user() { return currentUser; },
  get role() { return userRole; }
};
