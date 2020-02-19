//declare vars globally so all functions have access
var map;
var minValue;

//step 1 create map
function createMap(){
     //create the map
     map = L.map('mapid', {
          center: [20, 78],
          zoom: 5
     });
     //add OSM base tilelayer
     L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
     }).addTo(map);
     //call getData function
     getData(map);
};


function calcMinValue(data){
     //create empty array to store all data values
     var allValues = [];
     //loop through each city
     for(var city of data.features){
          //loop through each year
          for(var year = 11; year <= 19; year+=1){
                //get population for current year
               var value = city.properties["20"+ String(year) + '–' + String(year+1)];
               //add value that are not empty to the array
               if (value){
                 allValues.push(value);
               }
           }
     }
     //get minimum value of our array
     var minValue = Math.min(...allValues)
     return minValue;
};


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
     //constant factor adjusts symbol sizes evenly
     var minRadius = 1.5;
     //Flannery Appearance Compensation formula
     var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
     return radius;
};


//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    //Step 4: Determine which attribute to visualize with proportional symbols
    var attribute = "2015–16";
    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    //Step 5: For each feature, determine its value for the selected attribute
    var attValue = feature.properties[attribute];
    if (attValue) {
      attValue = Number(attValue);
    } else {
      attValue = 0;
    }
    //Step 6: Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);
    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    //build popup content string
    var popupContent = "<p><b>Region:</b> " + feature.properties["State/Union territory"];
    //add formatted attribute to popup content string
    var year1 = attribute.split("–")[0];
    var year2 = "20" + attribute.split("–")[1];
    popupContent += "<p><b>Gross State Domestic Product in " + year1 + " to " + year2 + ":</b> " + feature.properties[attribute] + " crores of Indian rupees.</p>";
    //bind the popup to the circle marker
    //Adding an offset to each circle marker
    layer.bindPopup(popupContent, {
      offset: new L.Point(0,-options.radius)
    });
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


//Step 3: Add circle markers for point features to the map
function createPropSymbols(data){
      L.geoJson(data, {
          pointToLayer : pointToLayer
          }).addTo(map);
};



//Step 2: Import GeoJSON data
function getData(map){
     //load the data
     $.getJSON("data/IndiaGSDP.geojson", function(response){
          //calculate minimum data value
          minValue = calcMinValue(response);
          //call function to create proportional symbols
          createPropSymbols(response);
     });
};

$(document).ready(createMap);
