(function () {
    const namespace = window.ZLon = window.ZLon || {};
    let supabase = null;
    let currentUser = null;
    let userType = 'customer';

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
    }

    function init() {
        try {
            supabase = namespace.getSupabaseClient();
        } catch (error) {
            console.warn(error.message);
        }

        // Start with loading screen
        showScreen('loading-screen');

        // After animation, show login
        setTimeout(() => {
            showScreen('login-screen');
        }, 1500); // Match animation duration

        // Check if user is logged in
        checkAuth();

        // Event listeners
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('google-login').addEventListener('click', handleGoogleLogin);
        document.getElementById('phone-login').addEventListener('click', handlePhoneLogin);
        document.getElementById('hamburger').addEventListener('click', toggleMenu);
        document.getElementById('busy-toggle').addEventListener('change', handleBusyToggle);
        document.getElementById('upload-btn').addEventListener('click', handleImageUpload);
    }

    async function checkAuth() {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            await loadUserProfile();
            if (userType === 'owner') {
                if (window.location.hostname !== 'mybusiness.zlon.in') {
                    window.location.href = 'https://mybusiness.zlon.in';
                } else {
                    showOwnerDashboard();
                }
            } else {
                showCustomerHome();
            }
        }
    }

    async function loadUserProfile() {
        if (!currentUser) return;
        const { data, error } = await supabase
            .from('profiles')
            .select('user_type, is_premium')
            .eq('id', currentUser.id)
            .single();
        if (!error && data) {
            userType = data.user_type;
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert('Login failed: ' + error.message);
        } else {
            await checkAuth();
        }
    }

    async function handleGoogleLogin() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) alert('Google login failed: ' + error.message);
    }

    async function handlePhoneLogin() {
        // Implement phone OTP
        const phone = prompt('Enter phone number:');
        if (phone) {
            const { error } = await supabase.auth.signInWithOtp({ phone });
            if (error) alert('Phone login failed: ' + error.message);
            else alert('OTP sent');
        }
    }

    function showCustomerHome() {
        showScreen('customer-home');
        loadLocation();
        loadSalons();
    }

    function showOwnerDashboard() {
        showScreen('owner-dashboard');
        loadAppointments();
        loadEarnings();
    }

    async function loadLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocode or use coords
                document.getElementById('location-name').textContent = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            });
        }
    }

    async function loadSalons() {
        // Load salons near user
        const { data, error } = await supabase.from('salons').select('*');
        if (!error) {
            const list = document.getElementById('salons-list');
            list.innerHTML = data.map(salon => `<div>${salon.name}</div>`).join('');
        }
    }

    async function loadAppointments() {
        // Load owner's appointments
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('salon_id', currentUser.id); // Assuming owner id
        if (!error) {
            const list = document.getElementById('appointments-list');
            list.innerHTML = data.map(app => `<li>${app.customer_name}</li>`).join('');
        }
    }

    async function loadEarnings() {
        // Calculate earnings
        document.getElementById('earnings').textContent = '₹1000'; // Placeholder
    }

    async function handleBusyToggle(event) {
        const busy = event.target.checked;
        // Update salon status
        await supabase
            .from('salons')
            .update({ queue_status: busy ? 'busy' : 'available' })
            .eq('owner_id', currentUser.id);
    }

    async function handleImageUpload() {
        const file = document.getElementById('image-upload').files[0];
        if (file) {
            const { data, error } = await supabase.storage
                .from('salon-assets')
                .upload(`${currentUser.id}/logo.png`, file);
            if (error) alert('Upload failed: ' + error.message);
            else alert('Uploaded');
        }
    }

    function toggleMenu() {
        const overlay = document.getElementById('menu-overlay');
        overlay.classList.toggle('hidden');
        document.getElementById('hamburger').classList.toggle('active');
    }

    function init() {
        // ... existing ...

        // Menu events
        document.getElementById('menu-local-salons').addEventListener('click', () => {
            toggleMenu();
            requestGPSAndLoadSalons();
        });
        document.getElementById('menu-my-bookings').addEventListener('click', () => {
            toggleMenu();
            // Show bookings
        });
        document.getElementById('menu-support').addEventListener('click', () => {
            toggleMenu();
            // Show support
        });
    }

    async function requestGPSAndLoadSalons() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                // Filter salons by proximity
                const { data, error } = await supabase
                    .from('salons')
                    .select('*')
                    .eq('queue_status', 'available'); // Only available
                if (!error) {
                    // Calculate distance and sort
                    const sorted = data.map(salon => ({
                        ...salon,
                        distance: getDistance(latitude, longitude, salon.lat, salon.lng)
                    })).sort((a, b) => a.distance - b.distance);
                    renderSalons(sorted.slice(0, 10)); // Top 10
                }
            });
        }
    }

    function getDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula
        const R = 6371; // Radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function renderSalons(salons) {
        const list = document.getElementById('salons-list');
        list.innerHTML = salons.map(salon => `
            <div class="salon-card">
                <div>${salon.name} - ${salon.distance.toFixed(1)} km</div>
                <a href="#" class="book-btn">Book</a>
            </div>
        `).join('');
    }

    window.addEventListener('DOMContentLoaded', init);
})();