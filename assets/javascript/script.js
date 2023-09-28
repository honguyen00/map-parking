let map;
let service;

function initMap() {
    // location of Sydney
    const initialPositon = { lat: -33.865, lng:  151.210 };

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 8,
        center: initialPositon,
        mapId: "default_map",
        mapTypeControl: false,
        streetViewControl: false,
    });

    const request = {
        keyword: "parking",
        location: initialPositon,
        radius: 50000,
        type: 'parking',
    }; 

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            for (let i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        }
        map.setCenter(results[0].geometry.location);
        map.setZoom(15);
    })
}

function createMarker(place) {
    if (!place.geometry || !place.geometry.location) return;

    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
    });

    var infowindow = new google.maps.InfoWindow(
        {
            content: place.name,
        }
    );
    marker.addListener("click", () => {
        infowindow.open({
            anchor: marker,
            map,
        });
    })
}

window.initMap = initMap;