/* Map of GeoJSON data from IndiaGSDP.geojson */
//declare map var in global scope
//declare vars globally so all functions have access
var map;
var minValue;

//create map
function createMap(){
     //create the map
     map = L.map('mapid', {
          center: [22, 78],
          zoom: 5
     });
     //add OSM base tilelayer
     L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
     }).addTo(map);
     //call getData function
     getData(map);
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


//collect all the year info from the data
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


//Add circle markers for point features to the map
function createPropSymbols(data, attributes){
      L.geoJson(data, {
                  pointToLayer: function(feature, latlng){
                      return pointToLayer(feature, latlng, attributes);
        }
          }).addTo(map);
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
    var popupContent = new PopupContent(feature.properties, attribute)
    //bind the popup to the circle marker
    //Adding an offset to each circle marker
    layer.bindPopup(popupContent.formatted, {
      offset: new L.Point(0,-options.radius)
    });
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
     //constant factor adjusts symbol sizes evenly
     var minRadius = 1.5;
     //Flannery Appearance Compensation formula
     var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
     return radius;
};


// new object-oriented coding for popup content
function PopupContent (properties, attribute){
    this.properties = properties;
    this.attribute = attribute;
    this.year1 = attribute.split("–")[0];
    this.year2 = "20" + attribute.split("–")[1];
    this.gdp = this.properties[attribute];
    //deal with no data
    if (this.gdp != 0) {
      this.formatted = "<p><b>Region:</b> " + this.properties["State/Union territory"] + "<p><b>Gross State Domestic Product in " + this.year1 + " to " + this.year2 + ":</b> " + this.gdp + " crores of Indian rupees.</p>";
    } else {
      this.formatted = "<p><b>Region:</b> " + this.properties["State/Union territory"] + "<p><b>Gross State Domestic Product in " + this.year1 + " to " + this.year2 + ":</b> " + " Record currently unavailable.</p>";
    }
};


//Create new sequence controls
function createSequenceControls(attributes){
    var SequenceControl = L.Control.extend({
      options: {
        position: "bottomleft"
      },

      onAdd: function(){
        // create the control container div with a particular class name
        var container = L.DomUtil.create('div', 'sequence-control-container');
        //create range input element (slider)
        $(container).append('<input class="range-slider" type="range">');
        //add skip buttons
        $(container).append('<button class="step" id="backward" title="Backward">Backward</button>');
        $(container).append('<button class="step" id="forward" title="Forward">Forward</button>');

        //disable any mouse event listeners for the container (pan or zoom in the container area)
        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    });
    map.addControl(new SequenceControl());
    //attach event listeners AFTER adding the controls
    //set slider attributes
    $('.range-slider').attr({
      max: 8,
      min: 0,
      value: 0,
      step: 1
    });
    $('#backward').html('<img src="img/backward.png">');
    $('#forward').html('<img src="img/forward.png">');
    //add an event listener that support the click on the step
    $('.step').click(function(){
        //get the old index value
        var index = $('.range-slider').val();
        //increment or decrement depending on button clicked
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

     //add an event listener that support the click on the slider
     $('.range-slider').on('input', function(){
         //get the new index value
         var index = $(this).val();
         //Called in both step button and slider event listener handlers
         //pass new attribute to update symbols
         updatePropSymbols(attributes[index]);
     });
}



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
           var att = attribute;
           var popupContent = new PopupContent(props, att);

           //update popup content
           popup = layer.getPopup();
           popup.setContent(popupContent.formatted).update();
        };
    });
};


$(document).ready(createMap);
