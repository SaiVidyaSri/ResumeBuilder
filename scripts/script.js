
document.addEventListener('DOMContentLoaded', function() {
    
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    
    const signupBtn = document.querySelector('.signup-btn');
    const getStartedBtn = document.querySelector('.get-started-btn');
    
    
    const signupModal = document.getElementById('signupModal');
    const signinModal = document.getElementById('signinModal');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const otpModal = document.getElementById('otpModal');
    
    
    const showSignIn = document.getElementById('showSignIn');
    const showSignUp = document.getElementById('showSignUp');
    const showForgotPassword = document.getElementById('showForgotPassword');
    
    
    const closeButtons = document.querySelectorAll('.close-modal');
    
    
    const servicesPrev = document.querySelector('.services .prev');
    const servicesNext = document.querySelector('.services .next');
    const faqsPrev = document.querySelector('.faqs .prev');
    const faqsNext = document.querySelector('.faqs .next');
    
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    
    function openModal(modal) {
        if (modal) {
            closeAllModals();
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                modal.querySelector('.modal-content').classList.add('fade-in');
            }, 10);
        }
    }
    
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
            if (modal.querySelector('.modal-content')) {
                modal.querySelector('.modal-content').classList.remove('fade-in');
            }
        });
        document.body.style.overflow = 'auto';
    }
    
    
    if (signupBtn) {
        signupBtn.addEventListener('click', function() {
            openModal(signupModal);
        });
    }
    
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            openModal(signupModal);
        });
    }
    
    
    if (showSignIn) {
        showSignIn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(signinModal);
        });
    }
    
    if (showSignUp) {
        showSignUp.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(signupModal);
        });
    }
    
    if (showForgotPassword) {
        showForgotPassword.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(forgotPasswordModal);
        });
    }
    
    
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    
const sendOTPBtn = document.getElementById('send-otp-btn');
const setPasswordInput = document.getElementById('set-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const finalSignupBtn = document.getElementById('final-signup-btn');
const signupEmail = document.getElementById('signup-email');

if (finalSignupBtn && setPasswordInput && confirmPasswordInput && signupEmail) {
    finalSignupBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const password = setPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const email = signupEmail.value.trim();

        if (!password || !confirmPassword) {
            alert('Please enter and confirm your password.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        finalSignupBtn.disabled = true;
        finalSignupBtn.textContent = 'Signing up...';
        try {
            const res = await fetch('/api/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                alert('🎉 Registration successful! You can now sign in.');
                
                
                setPasswordInput.value = '';
                confirmPasswordInput.value = '';

                
                closeAllModals();
                openModal(signinModal);
            }
            else {
                alert(data.message || 'Signup failed');
            }
        } catch (err) {
            alert('Error during signup');
        }
        finalSignupBtn.disabled = false;
        finalSignupBtn.textContent = 'Sign up';
    });
}

if (sendOTPBtn && signupEmail) {
    sendOTPBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const email = signupEmail.value.trim();
        if (!email) {
            alert('Please enter your email.');
            return;
        }
        sendOTPBtn.disabled = true;
        sendOTPBtn.textContent = 'Sending...';
        setTimeout(() => {
            sendOTPBtn.disabled = false;
        }, 30000); 
        try {
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                alert('OTP sent to your email!');
                openModal(otpModal);
            } else {
                alert(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            alert('Error sending OTP');
        }
        sendOTPBtn.disabled = false;
        sendOTPBtn.textContent = 'Send OTP';
    });
}
    
const verifyOTPBtn = document.getElementById('verify-otp-btn');
const otpInput = document.getElementById('otp-input');

if (verifyOTPBtn && otpInput && signupEmail) {
    verifyOTPBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const otp = otpInput.value.trim();
        const email = signupEmail.value.trim();
        if (!otp) {
            alert('Please enter the OTP.');
            return;
        }
        verifyOTPBtn.disabled = true;
        verifyOTPBtn.textContent = 'Verifying...';
        try {
            const res = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (res.ok) {
                alert('OTP verified successfully!');
                
                otpModal.style.display = 'none';
                signupModal.style.display = 'block';
                document.getElementById('step1').style.display = 'none';
                document.getElementById('step2').style.display = 'block';
            } else {
                alert(data.message || 'Invalid OTP');
            }
        } catch (err) {
            alert('Error verifying OTP');
        }
        verifyOTPBtn.disabled = false;
        verifyOTPBtn.textContent = 'Verify OTP';
    });
}

const signinBtn = document.getElementById('signin-btn');
const signinEmail = document.getElementById('signin-email');
const signinPassword = document.getElementById('signin-password');

if (signinBtn && signinEmail && signinPassword) {
    signinBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const email = signinEmail.value.trim();
        const password = signinPassword.value.trim();
        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }
        signinBtn.disabled = true;
        signinBtn.textContent = 'Signing in...';
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("userId", data.userId); // Store the userId
                console.log("User signed in. User ID stored:", data.userId);
                window.location.href = data.redirectUrl;
            } else {
                alert(data.message || 'Sign in failed');
            }
        } catch (err) {
            alert('Error during sign in');
        }
        signinBtn.disabled = false;
        signinBtn.textContent = 'Sign In';
    });
}
    const cancelBtn = document.querySelector('#forgotPasswordModal .secondary-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            openModal(signinModal);
        });
    }
    
    
    function slideServices(direction) {
        const container = document.querySelector('.services-container');
        const cardWidth = document.querySelector('.service-card').offsetWidth + 30; 
        
        if (direction === 'next') {
            container.scrollLeft += cardWidth;
        } else {
            container.scrollLeft -= cardWidth;
        }
    }
    
    function slideFAQs(direction) {
        const container = document.querySelector('.faqs-container');
        const cardWidth = document.querySelector('.faq-card').offsetWidth + 30; 
        
        if (direction === 'next') {
            container.scrollLeft += cardWidth;
        } else {
            container.scrollLeft -= cardWidth;
        }
    }
    
    
    if (servicesPrev) {
        servicesPrev.addEventListener('click', function() {
            slideServices('prev');
        });
    }
    
    if (servicesNext) {
        servicesNext.addEventListener('click', function() {
            slideServices('next');
        });
    }
    
    if (faqsPrev) {
        faqsPrev.addEventListener('click', function() {
            slideFAQs('prev');
        });
    }
    
    if (faqsNext) {
        faqsNext.addEventListener('click', function() {
            slideFAQs('next');
        });
    }

window.addEventListener('load', function() {
    
    if (window.location.hash === '#reset-password-modal') {
        const token = sessionStorage.getItem('resetToken');
        if (token) {
            
            openModal(resetPasswordModal);
            
            
            sessionStorage.removeItem('resetToken');
            history.replaceState(null, '', window.location.pathname);
            
            
            const tokenInput = document.getElementById('reset-token');
            if (tokenInput) {
                tokenInput.value = token;
            }
        }
    }
});

const sendResetLinkBtn = document.getElementById('send-reset-link-btn');
const forgotCancelBtn = document.getElementById('forgot-cancel-btn');
const resetPasswordBtn = document.getElementById('reset-password-btn');
const forgotEmailInput = document.getElementById('forgot-email');

if (sendResetLinkBtn && forgotEmailInput) {
    sendResetLinkBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log("Send reset link clicked"); 
        
        const email = forgotEmailInput.value.trim();
        
        if (!email) {
            alert('Please enter your email address.');
            return;
        }
        
        sendResetLinkBtn.disabled = true;
        sendResetLinkBtn.textContent = 'Sending...';
        
        try {
            const res = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }) 
            });
            
            const data = await res.json();
            
            if (res.ok) {
                alert('Password reset link sent to your email!');
                closeAllModals();
            } else {
                alert(data.message || 'Failed to send reset link');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error sending reset link');
        }
        
        sendResetLinkBtn.disabled = false;
        sendResetLinkBtn.textContent = 'Send Reset Link';
    });
}

if (forgotCancelBtn) {
    forgotCancelBtn.addEventListener('click', function() {
        closeAllModals();
        openModal(signinModal);
    });
}

if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-new-password').value.trim();
        const token = document.getElementById('reset-token').value || sessionStorage.getItem('resetToken');

        if (!token) {
            alert('Invalid reset token. Please request a new password reset.');
            return;
        }
        if (!newPassword || !confirmPassword) {
            alert('Please enter and confirm your new password.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        
        
        const urlParams = new URLSearchParams(window.location.search);
        
        if (!token) {
            alert('Invalid reset link');
            return;
        }
        
        resetPasswordBtn.disabled = true;
        resetPasswordBtn.textContent = 'Resetting...';
        
        try {
            const res = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token,
                    newPassword 
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                alert('Password reset successfully! You can now login with your new password.');
                closeAllModals();
                openModal(signinModal);
                
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                alert(data.message || 'Password reset failed');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error resetting password');
        }
        
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.textContent = 'Reset Password';
    });
}
    
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, 
                    behavior: 'smooth'
                });
                
                
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
    
    
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        
        document.querySelectorAll('section').forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
        
        
        const navbar = document.querySelector('.navbar');
        if (scrollPosition > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.service-card, .faq-card, .review-card, .about-text, .about-image');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 100) {
                element.classList.add('fade-in');
            }
        });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); 

    if (window.location.hash === '#loginModal') {
    openModal(signinModal);
    history.replaceState(null, '', window.location.pathname); 
    }

});
