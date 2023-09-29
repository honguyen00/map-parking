let map;
let service;
let infoWindow;
let markers = [];


function initMap() {
    const location = {
        au: {
            center: { lat: -25.3, lng: 133.8 },
            zoom: 4,
      }}
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: location.au.zoom,
        center: location.au.center,
        mapId: "My-map-id-1",
        mapTypeControl: false,
        streetViewControl: false,
    });

    infoWindow = new google.maps.InfoWindow();
    // const currentLocationButton = document.createElement("button");
    // currentLocationButton.textContent = "Jump to current location";
    // currentLocationButton.classList.add("current-butt");
    const currentLocationButton = $("<button class='custom-map-control-button'>Jump to current location</button>")
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(currentLocationButton[0]);
    currentLocationButton.on("click", getCurrentPos);
    service = new google.maps.places.PlacesService(map);
}

function getCurrentPos() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            }
            createMarker(pos);
        },
        () => {
            handleLocationError(true, infoWindow, map.getCenter)
        }
        );
    }
    else {
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function searchParkingAroundRadius(position) {
    if (typeof position == String) {
        console.log("Is a string");
    }
    else {
        var location = position.latLng.toJSON();
        const search = {
            location: {lat: location["lat"], lng: location["lng"]},
            radius: 1000,
            types: ["parking"],
            keyword: "parking"
        };
        service.nearbySearch(search, (results, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                // clearResults();
                // clearMarkers();
                for (var i=0; i<results.length; i++) {
                    markers[i] = new google.maps.Marker({
                        position: results[i].geometry.location,
                        animation: google.maps.Animation.DROP,
                        icon: "./assets/images/icon1.png",
                    });

                    markers[i].placeResult = results[i];
                    markers[i].addListener("click", showParkingInfo);
                    setTimeout(dropMarker(i), i*100);
                    // addResult(results[i], i);
                }

            }
        })
    }
}


function dropMarker(i) {
    return function () {
        markers[i].setMap(map);
    }
}

function showParkingInfo() {
    const marker = this;
    service.getDetails({placeId: marker.placeResult.place_id}, (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
            return;
        }
        infoWindow.open(map, marker);
    })
}


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
      browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation.",
    );
    infoWindow.open(map);
  }

function createMarker(place) {
    if (!place) return;
    map.setCenter(place);
    map.setZoom(12)
    const marker = new google.maps.Marker({
        map: map,
        position: place,
        animation: google.maps.Animation.DROP,
    });

    infowindow = new google.maps.InfoWindow(
        {
            content: "{ "+ place.lat + ", " + place.lng + "}",
        }
    );
    marker.addListener("dbclick", searchParkingAroundRadius, {passive: true})
}

window.initMap = initMap;