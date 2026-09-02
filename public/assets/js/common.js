// // DOM slection
// const storeContainer = document.querySelector('.map-sidebar');
// const mapModalUI = document.getElementById('mapModal');
// const mapModal = new bootstrap.Modal(mapModalUI);
// const mapReset = document.querySelector('.map-reset');

// // Function to render store on UI
// const renderStore = store => {
//   const html = `
//                 <article class="map-store-card"  data-id=${store.id}>
//                 <div class="map-store-card-img">
//                   <img src=${store.img} alt=${store.name} />
//                 </div>
//                 <div class="map-store-card-content">
//                   <p>
//                     ${store.country} / ${store.city} / ${store.name}
                    
//                   </p>
//                 </div>
//               </article>
//               `;

//   return html;
// };

// // Generate html of all stores in the array
// const storeHtml = storeDataSorted.map(store => renderStore(store)).join('');

// // Insert generated html to UI
// storeContainer.innerHTML = storeHtml;

// // Function to update store modal
// const storeModalUpdate = store => {
//   mapModalUI.querySelector('.modal-title').textContent = store.name;
//   mapModalUI.querySelector('.shop-modal-img').setAttribute('src', store.img);
//   mapModalUI.querySelector('.shop-modal-img').setAttribute('alt', store.name);
//   mapModalUI
//     .querySelector('.shop-modal-num')
//     .setAttribute('href', `tel:${store.contactNum}`);
//   mapModalUI.querySelector('.shop-modal-num').textContent = store.contactNum;
//   mapModalUI
//     .querySelector('.shop-modal-address-link')
//     .setAttribute('href', store.googleMapLink);
//   mapModalUI.querySelector('.shop-modal-address').textContent = store.address;
// };

// // Render map
// const map = L.map('map').setView([51.505, -0.09], 2);

// L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
//   attribution:
//     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// }).addTo(map);

// // Function to close all markers
// const closeAllMarkers = () => {
//   map.eachLayer(function (layer) {
//     // Check if the layer is a marker
//     if (layer instanceof L.Marker) {
//       // Remove the marker from the map
//       map.removeLayer(layer);
//     }
//   });
// };

// /////////////////////////////////////////////////
// // Display markers for shops of respective country when clicked on store ui
// storeContainer.addEventListener('click', function (e) {
//   // Make sure user clicked on store card else return
//   const el = e.target.closest('.map-store-card');
//   if (!el) return;

//   // Close all markers to begin with
//   closeAllMarkers();

//   // Get country using clicked element
//   const country = storeDataSorted.find(
//     store => store.id == el.dataset.id
//   ).country;

//   // Select all elements with country
//   const allCountries = storeDataSorted.filter(
//     store => store.country === country
//   );

//   map.setView([allCountries[0].lat, allCountries[0].lng], 8, {
//     animate: true,
//     pan: {
//       duration: 1,
//     },
//   });

//   // Display markers to all countries with store modal attached
//   allCountries.forEach(store => {
//     L.marker([store.lat, store.lng])
//       .addTo(map)
//       .bindPopup(
//         L.popup({
//           maxWidth: 250,
//           minWidth: 100,
//         })
//       )
//       .setPopupContent(store.name)
//       .on('click', function (e) {
//         map.setView([e.latlng.lat, e.latlng.lng], 13, {
//           animate: true,
//           pan: {
//             duration: 1,
//           },
//         });
//         storeModalUpdate(store);
//         mapModal.show();
//       });
//   });
// });

// // Run fake click on first element of the array
// document.querySelector('.map-store-card').click();

// // Reset map to initail position and zoom
// mapReset.addEventListener('click', function () {
//   closeAllMarkers();
//   map.setView([51.505, -0.09], 2);
// });

/////////////////////////////////////////////////////////////////////////
// Contact form

const contactSuccessToastEl = document.querySelector('#contactSuccessToast');
const contactSuccessToast = new bootstrap.Toast(contactSuccessToastEl);
const contactErrorToastEl = document.querySelector('#contactErrorToast');
const contactErrorToast = new bootstrap.Toast(contactErrorToastEl);

const contactForm = document.querySelector('#contactForm');
const spinnerHtml = `<div class="spinner-border text-dark" role="status">
  <span class="visually-hidden">Loading...</span>
</div>`;
const submitBtn = contactForm.querySelector('button');
const contactModal = new bootstrap.Modal('#contactModal');

contactForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.querySelector('#name');
  const email = document.querySelector('#email');
  const phone = document.querySelector('#phone');
  const city = document.querySelector('#city');
  const buisnessType = document.querySelector(
    'input[name="contact-type"]:checked'
  ).value;
  const nameError = document.querySelector('#nameError');
  const emailError = document.querySelector('#emailError');

  if (!name.value) {
    nameError.classList.remove('opacity-0');
    return;
  }
  if (!email.value) {
    emailError.classList.remove('opacity-0');
    return;
  }

  nameError.classList.add('opacity-0');
  emailError.classList.add('opacity-0');

  const contactData = {
    buisnessType,
    name: name.value,
    email: email.value,
    phone: phone.value,
    city: city.value,
  };

  submitBtn.innerHTML = spinnerHtml;

  try {
    const response = await fetch('./backend/contact-us.php', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    const data = await response.json();
    contactForm.reset();
    submitBtn.textContent = 'Contact';
    contactModal.hide();
    if (data.status === 'success') contactSuccessToast.show();
    if (data.status === 'error') contactErrorToast.show();
  } catch (err) {
    console.log(err);
    contactForm.reset();
    submitBtn.textContent = 'Contact';
    contactModal.hide();
    contactErrorToast.show();
  }
});

document
  .querySelector('#contactModal')
  .addEventListener('hide.bs.modal', () => {
    submitBtn.textContent = 'Contact';
    contactForm.reset();
  });
