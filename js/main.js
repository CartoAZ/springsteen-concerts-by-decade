//function to instantiate the Leaflet map
function createMap(){

    var southWest = L.latLng(21, -140);
    var northEast = L.latLng(65, -44);
    var bounds = L.latLngBounds(southWest, northEast);

    //creates our map with default center/zoom
    var map = L.map('map', {
        center: [42, -96],
        maxBounds: bounds,
        zoom: 3
    });

//loads tilelayer onto map
L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
  	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  	subdomains: 'abcd',
  	minZoom: 3,
  	maxZoom: 7,
  	ext: 'png'
}).addTo(map);


    getData(map);
};

//calculate the radius of each proportional symbols
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scalFactor = 30;
    //area based on attribute value and scale factor
    var area = attValue * scalFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

function createPopup(properties, attribute, layer, radius){
    //checks if the state has a 0 for the specified attribute
    if(properties[attribute] == 0){
        //removes popup for states that didn't have any concerts
        layer.unbindPopup();
    } else {
        //checks for underscore to format popups when viewing data by decade vs format popup for
        //individual tours that don't have a from/to date
        if (attribute.indexOf("_") > -1){
            //define text to be in popup
            var popupContent = "<p><b>State:</b> " + properties.FullState + "</p>";

            //add formatted attribute to popup content string
            var year1 = attribute.split("_")[0];
            var year2 = attribute.split("_")[1];
            popupContent += "<p><b>Concerts between " + year1 + " and " + year2 + ":</b> " + properties[attribute] + "</p>";
        } else {
          //define text to be in popup
          var popupContent = "<p><b>State:</b> " + properties.FullState + "</p>";

          //add formatted attribute to popup content string
          popupContent += "<p><b>Concerts on " + attribute + " Tour in " + properties.State + ":</b> " + properties[attribute] + "</p>";
        };
        //bind popup to circle marker and offset popup
        layer.bindPopup(popupContent, {
            offset: new L.Point(0,-radius),
            closeButton: false
        });
    }
};

//function to iterate over each record in geojson and create a point marker for it
//also creates/defines popup content for each point marker
function pointToLayer(feature, latlng, attributes){

    //determines which attribute to visualize with proportional symbols upon loading map
    var attribute = attributes[0];
    //TRANSFER TO CSS
    //create marker options
    var options = {
       fillColor: "#00ccff",
       color: "#336699",
       weight: 1,
       opacity: 1,
       fillOpacity: 0.8
    };

    //determine value of selected attribute for each feature
    var attValue = Number(feature.properties[attribute]);

    //give each feature's circle marker a radius based on its attribute
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    if (attribute != 0){
        //call function and sent necessary data to create popup for circleMarkers
        createPopup(feature.properties, attribute, layer, options.radius);
        //event listeners to open popup on hover
        layer.on({
            mouseover: function(){
                this.openPopup();
            },
            mouseout: function(){
                this.closePopup();
            }
        });
    };
    //return circle marker to the L.geoJson pointToLayer options
    return layer;
};

//create circle markers for point features to map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and places it on map
    L.geoJson(data, {
      pointToLayer: function(feature, latlng){
          return pointToLayer(feature, latlng, attributes);
      }
    }).addTo(map);
};

//function to udpate the attribute based on user inputs (i.e., clicking and sliding)
function updatePropSymbols(map, attribute){
    //iterates through each layer (i.e., point) on map
    map.eachLayer(function(layer){
        // //conditional to make sure we're processing a layer with an attribute and ignore basemap
        if (layer.feature){
            //checks if the attribute of the property we are checking is equal to zero
            //need to check this because attribute value of 0 are not considered as existing (using the && operator)
            //by explicitly checking that attribute value is 0, we ensure that feature is passed to createPopup to update popup accordingly
            if (layer.feature.properties[attribute] == 0){
                //access feature properties
                var props = layer.feature.properties;
                //update each feature's radius based on new attribute values
                var radius = calcPropRadius(props[attribute]);
                layer.setRadius(radius);

                //call function and send necessary data to create popup for circleMarkers
                createPopup(props, attribute, layer, radius);

            } else {
                //access feature properties
                var props = layer.feature.properties;
                //update each feature's radius based on new attribute values
                var radius = calcPropRadius(props[attribute]);
                layer.setRadius(radius);

                //call function and send necessary data to create popup for circleMarkers
                createPopup(props, attribute, layer, radius);
            }
        };
    })
};

//function to create sequence controls
//need to add something that when you adjust slider, it changes dropdown back to Select a tour
function createSequenceControls(map, attributes){
    //create sequence control to add to leaflet map in bottom left corner
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function(map) {
            //create the container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element, i.e. a slider
            $(container).append('<input class="range-slider" type="range">');

            //add the skip buttons to range slider
            $(container).append('<button class="skip" id="reverse" title="Reverse"><img src="img/backward.png"></button>');
            $(container).append('<button class="skip" id="forward" title="Skip"><img src="img/forward.png"></button>');

            //kill any mouse event listeners on the map when clicking on container
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });

            return container;
        }
    });

    //adds the control to 'map'
    map.addControl(new SequenceControl());

    //set slider attributes
    $('.range-slider').attr({
        max: 4,
        min: 0,
        value: 0,
        step: 1
    });

    //add the skip buttons to range slider
    $('#reverse').html('<img src="img/backward.png">');
    $('#forward').html('<img src="img/forward.png">');

    //click listener for buttons
    $('.skip').click(function(){
        //retrieve index value before click
        var index = $('.range-slider').val();
        if ($(this).attr('id') == 'forward'){
            index++;

            //if this will make it go over the last attribute, return to first attribute
            index = index > 4 ? 0 : index;

        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //if this will make it go below first attribute, return to last attribute
            index = index < 0 ? 4 : index;
        };
        //updates the slider based on clicking buttons
        $('.range-slider').val(index);

        //pass new index to function so it can update prop symbols accordingly
        updatePropSymbols(map, attributes[index]);
        updateLegend(map, attributes[index]);
        updatePanel(map, attributes, index);
    });

    //input listener for slider
    $('.range-slider').on('input', function(){
        //retrieve new index value
        var index = $(this).val();

        //pass new index to function so it can update prop symbols accordingly
        updatePropSymbols(map, attributes[index]);
        updateLegend(map, attributes[index]);
        updatePanel(map, attributes, index);
    });
};

//function to put AJAX query data into array and return to callback function
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties) {
        //only take attributes with population values
        if (attribute.indexOf("_") || attribute.indexOf(" ") > -1){
            //remove 'State' and 'FullState' properties from array
            if (attribute.indexOf("State") == -1){
                //add attribute to attributes array
                attributes.push(attribute);
            };
        };
    };
    //passes attributes back to anonymous callback function to add to variable
    return attributes;
};

function createPanelFilter(map, attributes){
    //create variable to hold unnumbered list of tours
    var panelContent = '<ul id="tours">'
    //for loop adding the first tours to variable
    for (i = 5; i <10 ; i++){
        panelContent += '<li class="tour" value="'+ i + '">' + attributes[i] + '</li>';
    };
    //close HTML unnumbered list
    panelContent += "</li>"
    //add html content to panel
    $("#panel").html(panelContent);

    //call function for panel event listeners
    panelEvents(map, attributes);
};

function panelEvents(map, attributes){
    //affordance to highlight tour when moused over
    $('ul li.tour').mouseover(function(){
        $(this).css({'text-decoration': 'underline', 'color': '#00ccff'});
    });
    $('li').mouseout(function(){
        $(this).css({'text-decoration': 'none', 'color': 'black'});
    });

    //click listener for buttons
    $('ul li').click(function(){

        //allows for styling of selected tour by adding/removing class
        $('ul li').removeClass("active");
        $(this).addClass("active");

        //retrieve index value from list
        var index = $(this).val();
    //update prop symbols based on new filter choice
    updatePropSymbols(map, attributes[index]);
    updateLegend(map, attributes[index]);
    });
};

//function to update panel based on decade selected with sequencer
function updatePanel(map, attributes, index){
    //conditional to check for tours in the 1970s
    if (index == 0){
        //create variable to hold unnumbered list of tours
        var panelContent = '<ul id="tours">'
        //for loop adding the first tours to variable
        for (i = 5; i <10 ; i++){
            panelContent += '<li class="tour" value="'+ i + '">' + attributes[i] + '</li>';
        };
        //close HTML unnumbered list
        panelContent += "</li>"
        //add html content to panel
        $("#panel").html(panelContent);
        panelEvents(map, attributes);

    } else if (index == 1) {
        //create variable to hold unnumbered list of tours
        var panelContent = '<ul id="tours">'
        //for loop adding the first tours to variable
        for (i = 10; i <13 ; i++){
          panelContent += '<li class="tour" value="'+ i + '">' + attributes[i] + '</li>';
      };
      //close HTML unnumbered list
      panelContent += "</li>"
      //add html content to panel
      $("#panel").html(panelContent);

      //call function for panel event listeners
      panelEvents(map, attributes);

    } else if (index == 2) {
        //create variable to hold unnumbered list of tours
        var panelContent = '<ul id="tours">'
        //for loop adding the first tours to variable
        for (i = 13; i <16 ; i++){
            panelContent += '<li class="tour" value="'+ i + '">' + attributes[i] + '</li>';
        };
        //close HTML unnumbered list
        panelContent += "</li>"
        //add html content to panel
        $("#panel").html(panelContent);

        //call function for panel event listeners
        panelEvents(map, attributes);

    } else if (index == 3) {
        //create variable to hold unnumbered list of tours
        var panelContent = '<ul id="tours">'
        //for loop adding the first tours to variable
        for (i = 16; i <21 ; i++){
            panelContent += '<li class="tour" value="'+ i + '">' + attributes[i] + '</li>';
        };
        //close HTML unnumbered list
        panelContent += "</li>"
        //add html content to panel
        $("#panel").html(panelContent);

        //call function for panel event listeners
        panelEvents(map, attributes);

    } else if (index == 4) {
        //create variable to hold unnumbered list of tours
        var panelContent = '<ul id="tours">'
        //for loop adding the first tours to variable
        for (i = 21; i <24 ; i++){
            panelContent += '<li class="tour" value="'+ i + '">' + attributes[i] + '</li>';
        };
        //close HTML unnumbered list
        panelContent += "</li>"
        //add html content to panel
        $("#panel").html(panelContent);

        //call function for panel event listeners
        panelEvents(map, attributes);

    };
};

// //5th interaction operator
// //function to create dropdown filter menu
// function createFilter(map, attributes){
//     //variable to hold dropdown
//     var filter = L.control({position: 'topright'});
//
//     //when filter menu is added, do this function
//     filter.onAdd = function (map) {
//
//         //creates a div element to add to map
//         var div = L.DomUtil.create('div', 'info legend');
//
//         //variable to hold HTML string; add numeric value to reference index in tours array
//         var dropdown = '<select id="list"><option value=20>Select a Tour</option>'
//
//         //for loop to add each tour from 'tours' array to dropdown menu
//         for (i = 24; i > 4; i--){
//
//           dropdown += '<option class="tour" value="' + i + '">' + attributes[i] + '</option>'
//         };
//         dropdown += '</select>';
//
//         //adds HTML string fromd dropdown to innerHTML of div
//         div.innerHTML = dropdown
//
//         //what does this do??????
//         div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
//
//         return div;
//     };filter.addTo(map);
// };



// //5th interaction operator
// //updates map appropriately when choosing tour from dropdown menu control
// function filterIndex(map, attributes){
//     //click listener for filter list
//     $('#list').change(function(){
//       var index = $('#list').val();
//       //update prop symbols based on new filter choice
//       updatePropSymbols(map, attributes[index]);
//       updateLegend(map, attributes[index]);
//     });
// };

//add in stopPropagation
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
    },

        onAdd: function(map){
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            // add div to container for temporal legend
            $(container).append('<div id="temporal-legend">');

            //variable with HTML code to add to legend container
            var svg = '<svg id="attribute-legend" width="150px" height="100px">';

            //object for circles to hold valeus and y coord.
            var circles = {
                max: 33,
                mean: 66,
                min: 95
            };

            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle +
                '" fill="#00ccff" fill-opacity="0.8" stroke="#336699" cx="40"/>';

                //text string for circles
                svg += '<text id="' + circle + '-text" x="92" y="' + circles[circle] +'"></text>';
            };
            //closes svg HTML string
            svg += "</svg>";

            //add svg to attribute legendContent
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

    updateLegend(map, attributes[0]);
};

function updateLegend(map, attribute) {
    //if attribute is decade, make this temporal legend
    if (attribute.indexOf("_") > -1){
        //add formatted attribute to popup content string
        var year1 = attribute.split("_")[0];
        var year2 = attribute.split("_")[1];
        var legendContent = year1 + " through " + year2;

    //if attribute is a tour, make this temporal legend
    } else {
        var legendContent = attribute;
    }
    //replaces legend content
    $('#temporal-legend').html(legendContent);
    //get max, mean, min values and return as object stored in circleValues
    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues){
        //get radius for legend based on min, max, mean attribute values in circleValues object
        var radius = calcPropRadius(circleValues[key]);

        $('#'+key).attr({
            cy: 99 - radius,
            r: radius
        });

        //step 4: add legend text
        $('#'+key+'-text').text(circleValues[key] + " shows");
    };
};

//function to calculate mzx, mean, min values for an attribute-legend
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible values
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get attribute value
        //include second part of conditional so that attribute values of 0 are not included
        //because if a 0 is passed as min, the circle will have radius 0 and not show up
        if (layer.feature && layer.feature.properties[attribute]){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean; round to avoid decimals
    var mean = Math.round((max + min) / 2);

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};


//function to retrieve data and place on map
function getData(map){
    //jQuery AJAX method to retrieve data
    $.ajax("data/springsteenByState.geojson", {
        dataType: "json",
        success: function(response){
            //create/returns attributes array
            var attributes = processData(response);

            // createFilter(map, attributes);
            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);
            //call function to create sequence controls
            createSequenceControls(map, attributes);

            // filterIndex(map, attributes);

            createLegend(map, attributes);

            createPanelFilter(map, attributes);

            // updatePanel(map, attributes);
        }
    });
};

$(document).ready(createMap);
