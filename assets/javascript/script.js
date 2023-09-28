let map;
let service;

async function initMap() {
    // location of Sydney
    const initialPositon = { lat: -33.865, lng:  151.210 };
    const { Map } = await google.maps.importLibrary("maps");
    const { PlacesService } = await google.maps.importLibrary("places");

    map = new Map(document.getElementById("map"), {
        zoom: 8,
        center: initialPositon,
        mapId: "default_map",
        mapTypeControl: false,
        streetViewControl: false,
    });

    const request = {
        keyword: "parking",
        location: initialPositon,
        radius: 10000,
        type: 'parking',
    };  

    service = new PlacesService(map);
    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            for (let i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        }
        map.setCenter(results[0].geometry.location);
        map.setZoom(10);
    })
}

async function createMarker(place) {
    const { InfoWindow } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    if (!place.geometry || !place.geometry.location) return;

    const marker = new AdvancedMarkerElement({
        map: map,
        position: place.geometry.location,
    });

    var infowindow = new InfoWindow();

    marker.addListener("click", () => {
        infowindow.setContent(place.name || "");
        infowindow.open(map);
    })
}

window.initMap = initMap;