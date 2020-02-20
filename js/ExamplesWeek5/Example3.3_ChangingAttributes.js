//declare vars globally so all functions have access
var map;
var minValue;

//create map
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


//Build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with GSDP values (string starts with '20')
        if (attribute.indexOf("20") > -1){
            attributes.push(attribute);
        };
    };
    return attributes;
};


function calcMinValue(data){
     //create empty array to store all data values
     var allValues = [];
     //loop through each city
     for(var region of data.features){
          //loop through each year
          for(var year = 11; year <= 19; year+=1){
                //get population for current year
               var value = region.properties["20"+ String(year) + '–' + String(year+1)];
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
function pointToLayer(feature, latlng, attributes){
    //Assign the current attribute starting with the very first index of the attributes array
    var attribute = attributes[0];
    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    //For each feature, determine its value for the selected attribute
    var attValue = feature.properties[attribute];
    if (attValue) {
      attValue = Number(attValue);
    } else {
      attValue = 0;
    }
    //Give each feature's circle marker a radius based on its attribute value
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


//Add circle markers for point features to the map
function createPropSymbols(data, attributes){
      L.geoJson(data, {
                  pointToLayer: function(feature, latlng){
                      return pointToLayer(feature, latlng, attributes);
        }
          }).addTo(map);
};



//Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');
    //set slider attributes
    $('.range-slider').attr({
      max: 8,
      min: 0,
      value: 0,
      step: 1
   });
   $('#panel').append('<button class="step" id="backward">Backward</button>');
   $('#panel').append('<button class="step" id="forward">Forward</button>');
   //replace button content with images
   $('#backward').html('<img src="img/backward.png">');
   $('#forward').html('<img src="img/forward.png">');


   //click listener for buttons
    $('.step').click(function(){
      //get the old index value
      var index = $('.range-slider').val();

      //Step 6: increment or decrement depending on button clicked
      if ($(this).attr('id') == 'forward'){
          index++;
          //Make it a cycle: if past the last attribute, wrap around to first attribute
          index = index > 8 ? 0 : index;
      } else if ($(this).attr('id') == 'backward'){
          index--;
          //Make it a cycle: if past the first attribute, wrap around to last attribute
          index = index < 0 ? 8 : index;
      };
      //update slider
      $('.range-slider').val(index);
      //Called in both step button and slider event listener handlers
      //pass new attribute to update symbols
      updatePropSymbols(attributes[index]);
    });

    //input listener for slider
    $('.range-slider').on('input', function(){
        //get the new index value
        var index = $(this).val();
        //Called in both step button and slider event listener handlers
        //pass new attribute to update symbols
        updatePropSymbols(attributes[index]);
    });
};


//Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties){
            //update the layer style and popup
            //access feature properties
            //deal with no record of data
           var props = layer.feature.properties;
           if (props[attribute]) {
             props[attribute] = Number(props[attribute]);
           } else {
             props[attribute] = 0;
           }
           //update each feature's radius based on new attribute values
           var radius = calcPropRadius(props[attribute]);
           layer.setRadius(radius);

           //add the region name to popup content string
           var popupContent = "<p><b>Region:</b> " + props["State/Union territory"] + "</p>";

           //add formatted attribute to panel content string
           var year1 = attribute.split("–")[0];
           var year2 = "20" + attribute.split("–")[1];
           //deal with no record of data
           if (props[attribute] != 0){
             popupContent += "<p><b>Gross State Domestic Product in " + year1 + " to " + year2 + ":</b> " + props[attribute] + " crores of Indian rupees.</p>";
           } else{
             popupContent += "<p><b>Gross State Domestic Product in " + year1 + " to " + year2 + ":</b> " + "Record currently unavailable."
           }

           //update popup content
           popup = layer.getPopup();
           popup.setContent(popupContent).update();
        };
    });
};


//Import GeoJSON data
function getData(map){
     //load the data
     $.getJSON("data/IndiaGSDP.geojson", function(response){
          //create an attributes array
          var attributes = processData(response);

          //calculate minimum data value
          minValue = calcMinValue(response);
          //call function to create proportional symbols
          createPropSymbols(response, attributes);
          createSequenceControls(attributes);
     });
};

$(document).ready(createMap);
