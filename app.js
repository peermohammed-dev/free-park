// Global variables
let map;
let pickerMap;
let markers = [];
let parkingSpots = [];
let currentFilter = 'all';
let selectedLocation = null;
let pickerMarker = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadParkingSpots();
    initializeMap();
    updateStats();
});

// View Management
function showView(viewName) {
    // Hide all views
    document.getElementById('hero-section').style.display = 'none';
    document.getElementById('map-view').style.display = 'none';
    document.getElementById('add-view').style.display = 'none';

    // Show selected view
    if (viewName === 'map') {
        document.getElementById('map-view').style.display = 'block';
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 100);
        displayParkingSpots();
    } else if (viewName === 'add') {
        document.getElementById('add-view').style.display = 'block';
        document.getElementById('success-message').style.display = 'none';
        // Reset selected location
        selectedLocation = null;
        document.getElementById('coordinates-display').style.display = 'none';
    } else {
        document.getElementById('hero-section').style.display = 'block';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize Leaflet Map
function initializeMap() {
    // Default view - will be replaced by user location or first parking spot
    let defaultLat = 20.5937; // Center of India
    let defaultLng = 78.9629;
    let defaultZoom = 5;

    map = L.map('map').setView([defaultLat, defaultLng], defaultZoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Try to get user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Add marker for user location
            L.marker([userLat, userLng], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: '<div style="background: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                    iconSize: [16, 16]
                })
            }).addTo(map).bindPopup('📍 You are here');

            // Center map on user location
            map.setView([userLat, userLng], 13);
        }, function(error) {
            console.log('Location access denied or unavailable');
            // If there are parking spots, center on the first one
            if (parkingSpots.length > 0) {
                map.setView([parkingSpots[0].lat, parkingSpots[0].lng], 13);
            }
        });
    }
}

// Open Map Picker Modal
function openMapPicker() {
    document.getElementById('map-picker-modal').style.display = 'flex';
    
    // Initialize picker map if not already done
    setTimeout(() => {
        if (!pickerMap) {
            initializePickerMap();
        } else {
            pickerMap.invalidateSize();
        }
    }, 100);
}

// Close Map Picker Modal
function closeMapPicker() {
    document.getElementById('map-picker-modal').style.display = 'none';
}

// Initialize Picker Map
function initializePickerMap() {
    // Start at user location or world center
    let startLat = 20.5937;
    let startLng = 78.9629;
    let startZoom = 5;

    // Try to use user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            startLat = position.coords.latitude;
            startLng = position.coords.longitude;
            pickerMap.setView([startLat, startLng], 13);
        });
    }

    pickerMap = L.map('picker-map').setView([startLat, startLng], startZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(pickerMap);

    // Add click event to select location
    pickerMap.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Remove previous marker if exists
        if (pickerMarker) {
            pickerMap.removeLayer(pickerMarker);
        }
        
        // Add new marker
        pickerMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'selected-location-marker',
                html: '<div style="background: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 4px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4);"></div>',
                iconSize: [30, 30]
            })
        }).addTo(pickerMap);
        
        // Store selected location
        selectedLocation = { lat, lng };
        
        // Update display
        document.getElementById('picker-coordinates').innerHTML = `
            <strong>Latitude:</strong> ${lat.toFixed(6)}<br>
            <strong>Longitude:</strong> ${lng.toFixed(6)}
        `;
        
        // Enable confirm button
        document.getElementById('confirm-location-btn').disabled = false;
    });
}

// Confirm selected location
function confirmLocation() {
    if (selectedLocation) {
        // Update the form
        document.getElementById('selected-lat').textContent = selectedLocation.lat.toFixed(6);
        document.getElementById('selected-lng').textContent = selectedLocation.lng.toFixed(6);
        document.getElementById('coordinates-display').style.display = 'block';
        
        // Close modal
        closeMapPicker();
        
        // Scroll to form
        document.getElementById('location').focus();
    }
}

// Load parking spots from localStorage
function loadParkingSpots() {
    const stored = localStorage.getItem('parkingSpots');
    if (stored) {
        parkingSpots = JSON.parse(stored);
    } else {
        // Add diverse demo data from different locations
        parkingSpots = [
            {
                id: Date.now() + 1,
                location: 'Marina Beach Road, Chennai, India',
                lat: 13.0499,
                lng: 80.2824,
                type: 'no-parking',
                description: 'No parking zone during weekends and public holidays. Heavy fines enforced.',
                reportedBy: 'Raj Kumar',
                timestamp: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                location: 'Connaught Place, New Delhi, India',
                lat: 28.6304,
                lng: 77.2177,
                type: 'paid',
                description: 'Municipal parking lot. ₹40 per hour. Open 24/7.',
                reportedBy: 'Priya S',
                timestamp: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: Date.now() + 3,
                location: 'Gateway of India, Mumbai, India',
                lat: 18.9220,
                lng: 72.8347,
                type: 'free',
                description: 'Free parking available on weekdays before 10 AM. Safe area.',
                reportedBy: 'Anonymous',
                timestamp: new Date(Date.now() - 172800000).toISOString()
            }
        ];
        saveParkingSpots();
    }
}

// Save parking spots to localStorage
function saveParkingSpots() {
    localStorage.setItem('parkingSpots', JSON.stringify(parkingSpots));
}

// Add parking spot
function addParkingSpot(event) {
    event.preventDefault();

    const location = document.getElementById('location').value;
    const type = document.getElementById('parking-type').value;
    const description = document.getElementById('description').value;
    const reportedBy = document.getElementById('reported-by').value || 'Anonymous';

    // Use selected location from map picker, or generate random coordinates
    let lat, lng;
    
    if (selectedLocation) {
        // Use manually selected location
        lat = selectedLocation.lat;
        lng = selectedLocation.lng;
    } else {
        // If no location selected, try to use user's current location
        // Or use a default location and warn user
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                lat = position.coords.latitude + (Math.random() - 0.5) * 0.01;
                lng = position.coords.longitude + (Math.random() - 0.5) * 0.01;
                saveSpot(location, lat, lng, type, description, reportedBy);
            }, function(error) {
                // Fallback to asking user to select on map
                alert('Please use "Pick on Map" button to select the exact location of the parking spot.');
                return;
            });
            return; // Wait for geolocation
        } else {
            alert('Please use "Pick on Map" button to select the location of the parking spot.');
            return;
        }
    }
    
    saveSpot(location, lat, lng, type, description, reportedBy);
}

function saveSpot(location, lat, lng, type, description, reportedBy) {
    const newSpot = {
        id: Date.now(),
        location,
        lat,
        lng,
        type,
        description,
        reportedBy,
        timestamp: new Date().toISOString()
    };

    parkingSpots.unshift(newSpot);
    saveParkingSpots();
    updateStats();

    // Show success message
    document.getElementById('add-spot-form').reset();
    document.getElementById('success-message').style.display = 'block';
    document.getElementById('coordinates-display').style.display = 'none';
    selectedLocation = null;

    // Hide success message and redirect after 2 seconds
    setTimeout(() => {
        showView('map');
    }, 2000);
}

// Display parking spots on map and list
function displayParkingSpots() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Filter spots
    const filteredSpots = currentFilter === 'all' 
        ? parkingSpots 
        : parkingSpots.filter(spot => spot.type === currentFilter);

    // Add markers to map
    filteredSpots.forEach(spot => {
        const iconColor = {
            'free': '#10b981',
            'no-parking': '#ef4444',
            'paid': '#f59e0b'
        }[spot.type];

        const marker = L.marker([spot.lat, spot.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="background: ${iconColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24]
            })
        }).addTo(map);

        const popupContent = `
            <div class="popup-content">
                <h3>${spot.location}</h3>
                <p><strong>Type:</strong> ${formatType(spot.type)}</p>
                <p>${spot.description || 'No additional details'}</p>
                <p><small>Reported by ${spot.reportedBy}</small></p>
            </div>
        `;

        marker.bindPopup(popupContent);
        markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    // Display list
    displaySpotsList(filteredSpots);
}

// Display spots as cards
function displaySpotsList(spots) {
    const listContainer = document.getElementById('spots-list');
    
    if (spots.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No parking spots found for this filter.</p>';
        return;
    }

    listContainer.innerHTML = spots.map(spot => `
        <div class="spot-card ${spot.type}">
            <div class="spot-header">
                <span class="spot-type ${spot.type}">${formatType(spot.type)}</span>
            </div>
            <h3 class="spot-location">${spot.location}</h3>
            <p class="spot-description">${spot.description || 'No additional details provided'}</p>
            <div class="spot-footer">
                <span class="spot-reporter">👤 ${spot.reportedBy}</span>
                <span class="spot-time">${formatTime(spot.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

// Filter spots
function filterSpots(filter) {
    currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    displayParkingSpots();
}

// Update statistics
function updateStats() {
    const total = parkingSpots.length;
    const free = parkingSpots.filter(s => s.type === 'free').length;
    const uniqueContributors = new Set(parkingSpots.map(s => s.reportedBy)).size;

    animateNumber('total-spots', total);
    animateNumber('free-spots', free);
    animateNumber('contributors', uniqueContributors);
}

// Animate number counting
function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Format parking type
function formatType(type) {
    const types = {
        'free': 'Free Parking',
        'no-parking': 'No Parking',
        'paid': 'Paid Parking'
    };
    return types[type] || type;
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}