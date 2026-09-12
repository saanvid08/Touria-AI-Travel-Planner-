/*
File created date: July 21, 2026
Created by: Aswitha
Updated by: Aswitha (July 29, 2026) — hero marquees, lightbox, interactive world map
Function of file: Build scrolling destination columns, lightbox, and world-map destination picker for Touria home.
*/

(function () {
    // Popular destinations — use stable Unsplash IDs + fallbacks for missing images
    var DESTINATIONS = [
        {
            city: "Paris",
            country: "France",
            alt: "Eiffel Tower in Paris",
            thumb: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Tokyo",
            country: "Japan",
            alt: "Tokyo cityscape at dusk",
            thumb: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1536098561742-ca998e48bdff?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Santorini",
            country: "Greece",
            alt: "White buildings and blue domes in Santorini",
            thumb: "https://images.unsplash.com/photo-1570077186671-e62122502040?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1570077186671-e62122502040?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Bali",
            country: "Indonesia",
            alt: "Temple and tropical landscape in Bali",
            thumb: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1518548417151-7bdf4d8d5e43?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Cape Town",
            country: "South Africa",
            alt: "Table Mountain and Cape Town coastline",
            thumb: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1576485290814-2c78d0f0f9c4?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Machu Picchu",
            country: "Peru",
            alt: "Machu Picchu ruins in the mountains",
            thumb: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "New York City",
            country: "United States",
            alt: "New York City skyline",
            thumb: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1485871981521-5b1fd3805ebe?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Grand Canyon",
            country: "United States",
            alt: "Grand Canyon at sunset",
            thumb: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "San Francisco",
            country: "United States",
            alt: "Golden Gate Bridge in San Francisco",
            thumb: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Maui, Hawaii",
            country: "United States",
            alt: "Tropical beach in Maui, Hawaii",
            thumb: "https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "London",
            country: "United Kingdom",
            alt: "Big Ben and the London skyline",
            thumb: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Dubai",
            country: "United Arab Emirates",
            alt: "Dubai skyline with Burj Khalifa",
            thumb: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Rome",
            country: "Italy",
            alt: "Colosseum in Rome",
            thumb: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Sydney",
            country: "Australia",
            alt: "Sydney Opera House and harbour",
            thumb: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1523482580745-df8a3f93cc14?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Barcelona",
            country: "Spain",
            alt: "Sagrada Familia in Barcelona",
            thumb: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1562883676-8c7feb52d81b?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Reykjavik",
            country: "Iceland",
            alt: "Northern lights over Iceland landscape",
            thumb: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Maldives",
            country: "Maldives",
            alt: "Overwater bungalows in the Maldives",
            thumb: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Cairo",
            country: "Egypt",
            alt: "Pyramids of Giza near Cairo",
            thumb: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Taj Mahal",
            country: "India",
            alt: "Taj Mahal in Agra, India",
            thumb: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Bangkok",
            country: "Thailand",
            alt: "Temple in Bangkok",
            thumb: "https://images.unsplash.com/photo-1508009601479-162a26b3f3d4?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1508009601479-162a26b3f3d4?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=800&q=80"
        },
        {
            city: "Amalfi Coast",
            country: "Italy",
            alt: "Colorful cliffside towns on the Amalfi Coast",
            thumb: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
            full: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
            fallback: "https://images.unsplash.com/photo-1530187549642-a2d692666a7d?auto=format&fit=crop&w=800&q=80"
        }
    ];

    var lightbox = document.getElementById("destination-lightbox");
    var lightboxImage = document.getElementById("lightbox-image");
    var lightboxCaption = document.getElementById("lightbox-caption");
    var closeBtn = document.getElementById("lightbox-close");
    var leftTrack = document.getElementById("marquee-left");
    var rightTrack = document.getElementById("marquee-right");

    if (!lightbox || !lightboxImage || !lightboxCaption || !closeBtn || !leftTrack || !rightTrack) {
        return;
    }

    function createCard(dest) {
        var article = document.createElement("article");
        article.className = "destination-card";

        var button = document.createElement("button");
        button.type = "button";
        button.className = "destination-photo";
        button.setAttribute("data-full", dest.full);
        button.setAttribute("data-caption", dest.city + ", " + dest.country);
        button.setAttribute("aria-label", "View " + dest.city + " photo larger");

        var img = document.createElement("img");
        img.src = dest.thumb;
        img.alt = dest.alt;
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        // If primary Unsplash URL fails, try fallback once
        if (dest.fallback) {
            img.addEventListener("error", function onImgError() {
                img.removeEventListener("error", onImgError);
                img.src = dest.fallback;
                button.setAttribute("data-full", dest.fallback);
            });
        }
        button.appendChild(img);

        var meta = document.createElement("div");
        meta.className = "destination-meta";

        var tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = dest.country;

        var title = document.createElement("h3");
        title.textContent = dest.city;

        meta.appendChild(tag);
        meta.appendChild(title);
        article.appendChild(button);
        article.appendChild(meta);
        return article;
    }

    function fillTrack(track, items) {
        // Duplicate list so CSS translateY(-50%) loops seamlessly
        var fragment = document.createDocumentFragment();
        var pass;
        for (pass = 0; pass < 2; pass += 1) {
            items.forEach(function (dest) {
                fragment.appendChild(createCard(dest));
            });
        }
        track.appendChild(fragment);
    }

    // Left column: first half (scrolls top → bottom). Right: second half (bottom → top).
    fillTrack(leftTrack, DESTINATIONS.slice(0, Math.ceil(DESTINATIONS.length / 2)));
    fillTrack(rightTrack, DESTINATIONS.slice(Math.ceil(DESTINATIONS.length / 2)));

    function openLightbox(fullSrc, caption, altText) {
        lightboxImage.src = fullSrc;
        lightboxImage.alt = altText || caption || "Destination photo";
        lightboxCaption.textContent = caption || "";
        lightbox.hidden = false;
        document.body.classList.add("lightbox-open");
        closeBtn.focus();
    }

    function closeLightbox() {
        lightbox.hidden = true;
        lightboxImage.src = "";
        lightboxImage.alt = "";
        lightboxCaption.textContent = "";
        document.body.classList.remove("lightbox-open");
    }

    document.querySelectorAll(".destination-photo").forEach(function (button) {
        button.addEventListener("click", function () {
            var fullSrc = button.getAttribute("data-full");
            var caption = button.getAttribute("data-caption") || "";
            var img = button.querySelector("img");
            var altText = img ? img.alt : caption;
            if (fullSrc) {
                openLightbox(fullSrc, caption, altText);
            }
        });
    });

    closeBtn.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !lightbox.hidden) {
            closeLightbox();
        }
    });

    /* ---- Interactive world map (after How it works) ---- */
    var COORDS = {
        "Paris": [48.8566, 2.3522],
        "Tokyo": [35.6762, 139.6503],
        "Santorini": [36.3932, 25.4615],
        "Bali": [-8.4095, 115.1889],
        "Cape Town": [-33.9249, 18.4241],
        "Machu Picchu": [-13.1631, -72.545],
        "New York City": [40.7128, -74.006],
        "Grand Canyon": [36.1069, -112.1129],
        "San Francisco": [37.7749, -122.4194],
        "Maui, Hawaii": [20.7984, -156.3319],
        "London": [51.5074, -0.1278],
        "Dubai": [25.2048, 55.2708],
        "Rome": [41.9028, 12.4964],
        "Sydney": [-33.8688, 151.2093],
        "Barcelona": [41.3874, 2.1686],
        "Reykjavik": [64.1466, -21.9426],
        "Maldives": [3.2028, 73.2207],
        "Cairo": [30.0444, 31.2357],
        "Taj Mahal": [27.1751, 78.0421],
        "Bangkok": [13.7563, 100.5018],
        "Amalfi Coast": [40.634, 14.6027]
    };

    function startPlanningFor(city, country) {
        var countryName = country || "";
        var isUs =
            countryName === "United States" ||
            countryName === "United States of America" ||
            countryName === "USA";
        localStorage.setItem("touriaTripType", isUs ? "national" : "international");
        localStorage.setItem(
            "touriaTripLabel",
            "I want to go to " + city + (countryName ? ", " + countryName : "")
        );
        localStorage.setItem("touriaStartChat", "1");
        window.location.href = "touria-chatbot.html";
    }

    function escapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function buildMapPopupHtml(opts) {
        var photoSrc = opts.photoSrc || "";
        var title = escapeHtml(opts.title || "Selected place");
        var subtitle = escapeHtml(opts.subtitle || "");
        var photoId = opts.photoId;
        var planId = opts.planId;

        var photoBlock = opts.loading
            ? '<div class="map-popup-photo map-popup-photo--loading" aria-hidden="true"><span>Finding a photo…</span></div>'
            : '<button type="button" class="map-popup-photo" id="' + photoId + '" aria-label="View photo of ' + title + '">' +
              (photoSrc
                  ? '<img src="' + photoSrc + '" alt="' + title + '" loading="lazy" referrerpolicy="no-referrer">'
                  : '<div class="map-popup-photo-fallback">No photo found</div>') +
              "</button>";

        return (
            '<div class="map-popup">' +
            photoBlock +
            '<p class="map-popup-title">' + title + "</p>" +
            (subtitle ? '<p class="map-popup-country">' + subtitle + "</p>" : "") +
            '<div class="map-popup-actions">' +
            '<button type="button" class="map-popup-btn" id="' + planId + '"' +
            (opts.loading ? " disabled" : "") +
            ">Plan this trip</button>" +
            "</div>" +
            "</div>"
        );
    }

    function fetchPlacePhoto(placeName, countryName) {
        var candidates = [];
        if (placeName) {
            candidates.push(placeName);
            if (countryName && placeName.toLowerCase() !== countryName.toLowerCase()) {
                candidates.push(placeName + ", " + countryName);
            }
        }
        if (countryName) {
            candidates.push(countryName);
        }

        function tryNext(i) {
            if (i >= candidates.length) {
                return Promise.resolve(null);
            }
            var title = candidates[i];
            var url =
                "https://en.wikipedia.org/api/rest_v1/page/summary/" +
                encodeURIComponent(title.replace(/ /g, "_"));

            return fetch(url, { headers: { Accept: "application/json" } })
                .then(function (res) {
                    if (!res.ok) {
                        throw new Error("no page");
                    }
                    return res.json();
                })
                .then(function (data) {
                    var src =
                        (data.originalimage && data.originalimage.source) ||
                        (data.thumbnail && data.thumbnail.source) ||
                        null;
                    if (src) {
                        return {
                            src: src,
                            label: data.title || title
                        };
                    }
                    return tryNext(i + 1);
                })
                .catch(function () {
                    return tryNext(i + 1);
                });
        }

        return tryNext(0);
    }

    function reverseGeocode(lat, lng) {
        var url =
            "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" +
            encodeURIComponent(lat) +
            "&longitude=" +
            encodeURIComponent(lng) +
            "&localityLanguage=en";

        return fetch(url)
            .then(function (res) {
                if (!res.ok) {
                    throw new Error("geocode failed");
                }
                return res.json();
            })
            .then(function (data) {
                var city =
                    data.city ||
                    data.locality ||
                    data.principalSubdivision ||
                    data.countryName ||
                    "Selected place";
                var country = data.countryName || "";
                if (data.locality && data.city && data.locality !== data.city) {
                    city = data.locality;
                }
                return {
                    city: city,
                    country: country,
                    label: country ? city + ", " + country : city
                };
            });
    }

    function wirePopupActions(opts) {
        var planBtn = document.getElementById(opts.planId);
        if (planBtn) {
            planBtn.onclick = function () {
                startPlanningFor(opts.city, opts.country);
            };
        }
        var photoBtn = document.getElementById(opts.photoId);
        if (photoBtn && opts.photoSrc) {
            photoBtn.onclick = function () {
                openLightbox(opts.photoSrc, opts.caption, opts.alt || opts.caption);
            };
        }
    }

    function initWorldMap() {
        var mapEl = document.getElementById("world-map");
        var hintEl = document.getElementById("map-selected-hint");
        if (!mapEl || typeof L === "undefined") {
            return;
        }

        var map = L.map(mapEl, {
            worldCopyJump: true,
            minZoom: 2,
            maxZoom: 8,
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([20, 10], 2);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 18
        }).addTo(map);

        var pinIcon = L.divIcon({
            className: "touria-map-pin",
            html: '<div class="touria-pin-dot" aria-hidden="true"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            popupAnchor: [0, -10]
        });

        var clickMarker = null;
        var clickSeq = 0;

        function showPlacePopup(latlng, place, photo, ids) {
            var caption = place.label;
            var photoSrc = photo && photo.src ? photo.src : "";
            var html = buildMapPopupHtml({
                photoSrc: photoSrc,
                title: place.city,
                subtitle: place.country,
                photoId: ids.photoId,
                planId: ids.planId,
                loading: false
            });

            if (!clickMarker) {
                clickMarker = L.marker(latlng, { icon: pinIcon }).addTo(map);
            } else {
                clickMarker.setLatLng(latlng);
            }

            clickMarker.bindPopup(html, {
                maxWidth: 280,
                className: "touria-map-popup",
                autoPan: true
            });

            clickMarker.off("popupopen");
            clickMarker.on("popupopen", function () {
                if (hintEl) {
                    hintEl.hidden = false;
                    hintEl.textContent = "Selected: " + caption;
                }
                wirePopupActions({
                    planId: ids.planId,
                    photoId: ids.photoId,
                    city: place.city,
                    country: place.country,
                    photoSrc: photoSrc,
                    caption: caption,
                    alt: (photo && photo.label) || caption
                });
            });

            clickMarker.openPopup();
        }

        // Click anywhere → resolve that place + popular photo
        map.on("click", function (event) {
            clickSeq += 1;
            var seq = clickSeq;
            var latlng = event.latlng;
            var ids = {
                photoId: "map-any-photo-" + seq,
                planId: "map-any-plan-" + seq
            };

            if (!clickMarker) {
                clickMarker = L.marker(latlng, { icon: pinIcon }).addTo(map);
            } else {
                clickMarker.setLatLng(latlng);
            }

            clickMarker
                .bindPopup(
                    buildMapPopupHtml({
                        title: "Looking up this place…",
                        subtitle: "",
                        photoId: ids.photoId,
                        planId: ids.planId,
                        loading: true
                    }),
                    { maxWidth: 280, className: "touria-map-popup", autoPan: true }
                )
                .openPopup();

            if (hintEl) {
                hintEl.hidden = false;
                hintEl.textContent = "Finding place details…";
            }

            reverseGeocode(latlng.lat, latlng.lng)
                .then(function (place) {
                    if (seq !== clickSeq) {
                        return null;
                    }
                    return fetchPlacePhoto(place.city, place.country).then(function (photo) {
                        return { place: place, photo: photo };
                    });
                })
                .then(function (result) {
                    if (!result || seq !== clickSeq) {
                        return;
                    }
                    showPlacePopup(latlng, result.place, result.photo, ids);
                })
                .catch(function () {
                    if (seq !== clickSeq) {
                        return;
                    }
                    showPlacePopup(
                        latlng,
                        { city: "Selected place", country: "", label: "Selected place" },
                        null,
                        ids
                    );
                    if (hintEl) {
                        hintEl.textContent = "Could not identify this place — try nearby.";
                    }
                });
        });

        DESTINATIONS.forEach(function (dest, index) {
            var latLng = COORDS[dest.city];
            if (!latLng) {
                return;
            }

            var marker = L.marker(latLng, { icon: pinIcon }).addTo(map);
            var caption = dest.city + ", " + dest.country;
            var popupId = "map-plan-" + index;
            var photoId = "map-photo-" + index;
            var photoSrc = dest.thumb || dest.full;
            var fullSrc = dest.full || dest.thumb;

            marker.bindPopup(
                buildMapPopupHtml({
                    photoSrc: photoSrc,
                    title: dest.city,
                    subtitle: dest.country,
                    photoId: photoId,
                    planId: popupId,
                    loading: false
                }),
                { maxWidth: 280, className: "touria-map-popup" }
            );

            marker.on("click", function (e) {
                L.DomEvent.stopPropagation(e);
            });

            marker.on("popupopen", function () {
                if (hintEl) {
                    hintEl.hidden = false;
                    hintEl.textContent = "Selected: " + caption;
                }
                wirePopupActions({
                    planId: popupId,
                    photoId: photoId,
                    city: dest.city,
                    country: dest.country,
                    photoSrc: fullSrc,
                    caption: caption,
                    alt: dest.alt
                });
                var photoBtn = document.getElementById(photoId);
                var popupImg = photoBtn && photoBtn.querySelector("img");
                if (popupImg && dest.fallback) {
                    popupImg.addEventListener("error", function onPopupImgError() {
                        popupImg.removeEventListener("error", onPopupImgError);
                        popupImg.src = dest.fallback;
                    });
                }
            });

            marker.on("mouseover", function () {
                marker.setZIndexOffset(500);
            });
            marker.on("mouseout", function () {
                marker.setZIndexOffset(0);
            });
        });

        setTimeout(function () {
            map.invalidateSize();
        }, 250);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initWorldMap);
    } else {
        initWorldMap();
    }
})();

/* ---- Home profile menu (logout + account details) ---- */
(function () {
    var trigger = document.getElementById("profile-trigger");
    var dropdown = document.getElementById("profile-dropdown");
    var avatar = document.getElementById("profile-avatar");
    var triggerLabel = document.getElementById("profile-trigger-label");
    var nameEl = document.getElementById("profile-name");
    var emailEl = document.getElementById("profile-email");
    var detailsEl = document.getElementById("profile-details");
    var actionsEl = document.getElementById("profile-actions");

    if (!trigger || !dropdown) {
        return;
    }

    var userType = localStorage.getItem("userType") || "guest";
    var firstName = localStorage.getItem("firstName") || "";
    var lastName = localStorage.getItem("lastName") || "";
    var email = localStorage.getItem("email") || "";
    var userId = localStorage.getItem("userId") || "";
    var createdAt = localStorage.getItem("userCreatedAt") || "";
    var isRegistered = userType === "registered" && (!!email || !!userId);
    var displayName = (firstName + " " + lastName).trim() || (isRegistered ? "Traveler" : "Guest");

    function formatJoined(iso) {
        if (!iso) return "—";
        try {
            return new Date(iso).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch (e) {
            return "—";
        }
    }

    avatar.textContent = (firstName || displayName || "G").charAt(0).toUpperCase();
    triggerLabel.textContent = isRegistered ? firstName || "Account" : "Guest";
    nameEl.textContent = displayName;
    emailEl.textContent = isRegistered ? email || "Signed in" : "Browsing without an account";

    detailsEl.innerHTML = "";
    function addDetail(label, value) {
        var wrap = document.createElement("div");
        var dt = document.createElement("dt");
        var dd = document.createElement("dd");
        dt.textContent = label;
        dd.textContent = value;
        wrap.appendChild(dt);
        wrap.appendChild(dd);
        detailsEl.appendChild(wrap);
    }

    addDetail("Status", isRegistered ? "Registered" : "Guest");
    if (isRegistered) {
        addDetail("Email", email || "—");
        addDetail("Member since", formatJoined(createdAt));
        if (userId) {
            addDetail("User ID", userId.slice(0, 8) + "…");
        }
    } else {
        addDetail("Saved trips", "Not saved in guest mode");
    }

    actionsEl.innerHTML = "";
    if (isRegistered) {
        var chatLink = document.createElement("a");
        chatLink.href = "touria-chatbot.html";
        chatLink.className = "profile-action-btn profile-action-btn--ghost";
        chatLink.textContent = "My trip chats";
        actionsEl.appendChild(chatLink);

        var logoutBtn = document.createElement("button");
        logoutBtn.type = "button";
        logoutBtn.className = "profile-action-btn profile-action-btn--danger";
        logoutBtn.textContent = "Log out";
        logoutBtn.addEventListener("click", function () {
            [
                "userType",
                "email",
                "firstName",
                "lastName",
                "userId",
                "userCreatedAt",
                "touriaActiveConversationId",
                "touriaStartChat",
                "touriaTripLabel",
                "touriaTripType"
            ].forEach(function (key) {
                localStorage.removeItem(key);
            });
            window.location.href = "login.html";
        });
        actionsEl.appendChild(logoutBtn);
    } else {
        var loginLink = document.createElement("a");
        loginLink.href = "login.html";
        loginLink.className = "profile-action-btn profile-action-btn--primary";
        loginLink.textContent = "Log in";
        actionsEl.appendChild(loginLink);

        var registerLink = document.createElement("a");
        registerLink.href = "register.html";
        registerLink.className = "profile-action-btn profile-action-btn--ghost";
        registerLink.textContent = "Create account";
        actionsEl.appendChild(registerLink);
    }

    // Enrich profile from backend when we have an id/email
    if (isRegistered && (userId || email)) {
        var qs = userId
            ? "user_id=" + encodeURIComponent(userId)
            : "email=" + encodeURIComponent(email);
        fetch("http://127.0.0.1:8000/profile?" + qs)
            .then(function (res) {
                return res.ok ? res.json() : null;
            })
            .then(function (profile) {
                if (!profile) return;
                if (profile.firstName) localStorage.setItem("firstName", profile.firstName);
                if (profile.lastName) localStorage.setItem("lastName", profile.lastName);
                if (profile.id) localStorage.setItem("userId", profile.id);
                if (profile.createdAt) localStorage.setItem("userCreatedAt", profile.createdAt);
                var full = ((profile.firstName || "") + " " + (profile.lastName || "")).trim();
                if (full) {
                    nameEl.textContent = full;
                    triggerLabel.textContent = profile.firstName || full;
                    avatar.textContent = full.charAt(0).toUpperCase();
                }
                if (profile.email) {
                    emailEl.textContent = profile.email;
                }
                detailsEl.innerHTML = "";
                addDetail("Status", "Registered");
                addDetail("Email", profile.email || email || "—");
                addDetail("Member since", formatJoined(profile.createdAt || createdAt));
            })
            .catch(function () {});
    }

    function closeMenu() {
        dropdown.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
        dropdown.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
    }

    trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        if (dropdown.hidden) {
            openMenu();
        } else {
            closeMenu();
        }
    });

    document.addEventListener("click", function (event) {
        if (!dropdown.hidden && !dropdown.contains(event.target) && event.target !== trigger) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMenu();
        }
    });
})();
