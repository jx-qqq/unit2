//Step 3: Add circle markers for point features to the map
function createPropSymbols(data){
    //create marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
    }).addTo(map);
};

//Step 2: Import GeoJSON data
function getData(){
    //load the data
    $.getJSON("data/IndiaGSDP.geojson", function(response){
            //call function to create proportional symbols
            createPropSymbols(response);
    });
};
