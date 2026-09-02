let map;
let stores = [];
let markers = [];
let markerMap = {};
let countryStoreMap = {};

document.addEventListener("DOMContentLoaded", () => {
    fetch("./assets/js/stores.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            stores = data;
            sortStores();
            groupStoresByCountry();
            initMap();
            populateCountryList();
            resetStores();
        })
        .catch(error => console.error("Error fetching store data:", error));

    document.getElementById("reset-button").addEventListener("click", resetStores);

    const searchBar = document.getElementById("search-bar");
    searchBar.addEventListener("input", searchStores);

    // Modal close button event
    const closeButton = document.querySelector(".close-button");
    closeButton.addEventListener("click", closeModal);

    window.addEventListener("click", (event) => {
        const modal = document.getElementById("store-modal");
        if (event.target == modal) {
            closeModal();
        }
    });
});

function sortStores() {
    stores.sort((a, b) => {
        if (a.country < b.country) return -1;
        if (a.country > b.country) return 1;
        if (a.state < b.state) return -1;
        if (a.state > b.state) return 1;
        return 0;
    });
}

function initMap() {
    map = L.map('map').setView([37.7749, -122.4194], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    markers = [];
}

function groupStoresByCountry() {
    countryStoreMap = stores.reduce((acc, store) => {
        if (!acc[store.country]) {
            acc[store.country] = [];
        }
        acc[store.country].push(store);
        return acc;
    }, {});
}

function populateCountryList() {
    const storeList = document.getElementById("store-items");
    storeList.innerHTML = "";

    Object.keys(countryStoreMap).forEach(country => {
        const li = document.createElement("li");
        li.classList.add("country-card");
        li.innerHTML = `
            <div class="country">${country}</div>
        `;
        li.addEventListener("click", () => showStoresInCountry(country));
        storeList.appendChild(li);
    });
}

function showStoresInCountry(country) {
    clearMapMarkers();

    const storeList = document.getElementById("store-items");
    storeList.innerHTML = "";

    countryStoreMap[country].forEach(store => {
        const li = document.createElement("li");
        li.innerHTML = `
            <img src="${store.image}" alt="${store.name}">
            <div>
                <div class="store-name">${store.name}</div>
                <p>${store.address}</p>
                <p>${store.phone}</p>
            </div>
        `;
        li.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                openModal(store);
            } else {
                map.setView([store.lat, store.lng], 12);
                if (markerMap[store.name]) {
                    markerMap[store.name].openPopup();
                }
            }
        });
        storeList.appendChild(li);

        const marker = L.marker([store.lat, store.lng]).addTo(map);
        marker.bindPopup(`
            <div>
                <h4>${store.name}</h4>
                <img src="${store.image}" alt="${store.name}" style="width:100%;">
                <p>${store.address}</p>
                <p><a href="tel:${store.phone}">${store.phone}</a></p>
                <p><a href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}" target="_blank">Get Directions</a></p>
            </div>
        `);
        markerMap[store.name] = marker;
        markers.push(marker);
    });

    fitMapToMarkers();
}

function resetStores() {
    clearMapMarkers();
    populateCountryList();
    showAllStores();
}

function showAllStores() {
    stores.forEach(store => {
        const marker = L.marker([store.lat, store.lng]).addTo(map);
        marker.bindPopup(`
            <div>
                <h4>${store.name}</h4>
                <img src="${store.image}" alt="${store.name}" style="width:100%;">
                <p>${store.address}</p>
                <p><a href="tel:${store.phone}">${store.phone}</a></p>
                <p><a href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}" target="_blank">Get Directions</a></p>
            </div>
        `);
        markerMap[store.name] = marker;
        markers.push(marker);
    });

    fitMapToMarkers();
}

function clearMapMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

function fitMapToMarkers() {
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds());
    }
}

function searchStores() {
    const searchTerm = document.getElementById("search-bar").value.toLowerCase();
    const storeList = document.getElementById("store-items");
    storeList.innerHTML = "";

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm) ||
        store.address.toLowerCase().includes(searchTerm) ||
        store.city.toLowerCase().includes(searchTerm) ||
        store.country.toLowerCase().includes(searchTerm)
    );

    filteredStores.forEach(store => {
        const li = document.createElement("li");
        li.innerHTML = `
            <img src="${store.image}" alt="${store.name}">
            <div>
                <div class="store-name">${store.name}</div>
                <p>${store.address}</p>
                <p>${store.phone}</p>
            </div>
        `;
        li.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                openModal(store);
            } else {
                map.setView([store.lat, store.lng], 12);
                if (markerMap[store.name]) {
                    markerMap[store.name].openPopup();
                }
            }
        });
        storeList.appendChild(li);
    });

    clearMapMarkers();

    filteredStores.forEach(store => {
        const marker = L.marker([store.lat, store.lng]).addTo(map);
        marker.bindPopup(`
            <div>
                <h4>${store.name}</h4>
                <img src="${store.image}" alt="${store.name}" style="width:100%;">
                <p>${store.address}</p>
                <p><a href="tel:${store.phone}">${store.phone}</a></p>
                <p><a href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}" target="_blank">Get Directions</a></p>
            </div>
        `);
        markerMap[store.name] = marker;
        markers.push(marker);
    });

    fitMapToMarkers();
}

function openModal(store) {
    const modal = document.getElementById("store-modal");
    const modalBody = document.getElementById("modal-body");
    modalBody.innerHTML = `
        <h4>${store.name}</h4>
        <img src="${store.image}" alt="${store.name}" style="width:100%;">
        <p>${store.address}</p>
        <p><a href="tel:${store.phone}">${store.phone}</a></p>
        <p><a href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}" target="_blank">Get Directions</a></p>
    `;
    modal.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById("store-modal");
    modal.style.display = "none";
}
