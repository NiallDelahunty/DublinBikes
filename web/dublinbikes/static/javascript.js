
// dublin.json file saved as a variable
window.map = undefined;
// Location of Dublin
var dublin = {
    lat: 53.350140,
    lng: -6.266155
};
var infoWindow = null;


var locations = new Array();
var cityID = 7778677;
var day=new Date();
var weekday=day.getDay(); //after showing today's weekday at initialization, the value might be altered.
var weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var station="";
var origin;
var stop;
var destination;
var bicyclingMatrix;
var walkingMatrix;
var apiCount;
var stationArray;
var polylines;
var chartsLoaded=false;
var histData;
var distanceIDs;
var intermediateStation;

// Centre map on Dublin
function centerDublin(controlDiv, map) {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '2px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.height = '40px';
    controlUI.style.width = '40px';
    controlUI.style.marginTop = '10px';
    controlUI.style.marginLeft = '10px';
    controlUI.style.alignContent = 'space-around';
    controlUI.title = 'Center the map on Dublin';
    controlDiv.appendChild(controlUI);
    

    // Set CSS for the control interior.
    var controlImg = document.createElement('img');
    controlImg.src = 'static/Imgs/mapicons/centre.png';
    controlImg.setAttribute("height", "35");
    controlImg.setAttribute("width", "35");
    controlUI.appendChild(controlImg);

    // Event listener on button to recenter the map on Dublin
    controlUI.addEventListener('click', function() {
        map.setCenter(dublin);
        map.setZoom(14);
        close_sidebar();
    });
}

// Centre map on user's location
function centerUser(controlDiv, map) {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '2px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.height = '40px';
    controlUI.style.width = '40px';
    controlUI.style.marginLeft = '10px';
    controlUI.style.alignContent = 'space-around';
    controlUI.title = 'Center the map on your location';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlImg = document.createElement('img');
    controlImg.src = 'static/Imgs/mapicons/user2.png';
    controlImg.setAttribute("height", "35");
    controlImg.setAttribute("width", "35");
    controlUI.appendChild(controlImg);

    // Event listener on button to recenter the map on the user's device location
    controlUI.addEventListener('click', function() {
        if (navigator.geolocation) {
            var userLocation;
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                userLocation = new google.maps.Marker({
                    position: pos,
                    map: map,
                    icon: 'static/Imgs/mapicons/user.png',
                    title: "User Location",
                });
                userLocation.setPosition(pos);
                map.setCenter(pos);
                map.setZoom(14);
                close_sidebar();

            }, 
            function() {
                handleLocationError(true, userLocation, map.getCenter());
            });
        } 
        else {
            // Browser doesn't support geolocation
            handleLocationError(false, userLocation, map.getCenter());
        }

        // Unable to find user's device location - throw error message to user
        function handleLocationError(browserHasGeolocation, infoWindow, pos) {
            infoWindow.setPosition(pos);
            infoWindow.setContent(browserHasGeolocation ? 'Error: The Geolocation service failed.' : 
            'Error: Your browser doesn\'t support Geolocation.');
            infoWindow.open(map);
        }
    });
}
// Initialise and add the map
function initMap() {
    // Centre the map at Dublin
    window.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: dublin,
        // Allows control of position of MAP/SATELLITE element
        mapTypeControl: false,
        // Allows control of position of Zoom element
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        // Allows control of position of street view element
        streetViewControl: false,
        // Allows control of position of fullscreen element
        fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        }
    });

    // Create button to recenter map on Dublin
    var centerControlDivDublin = document.createElement('div');
    var centerControlDublin = new centerDublin(centerControlDivDublin, map);
            
    centerControlDivDublin.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(centerControlDivDublin);
            
    // Create button to recenter map on user's device location
    var centerControlDivUser = document.createElement('div');
    var centerControlUser = new centerUser(centerControlDivUser, map);

    centerControlDivUser.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(centerControlDivUser);

    // Call function to create markers, pass in map defined above as a parameter
    update(map, update2)
    // every 2 mins call the update function and pass it parameters map and update2
    setInterval(update, 120 * 1000, map, update2);
    // update weather information every 15 minutes
    setInterval(weatherBalloon, 900 * 1000, cityID);
}

function name_prep(name){
    return name.replace("/", "slash")

}

// Taken from https://stackoverflow.com/questions/2332811/capitalize-words-in-string
String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

function all_Caps(str){
    // Make all words in str capatilized
    var temp = str.toLowerCase();
    return temp.capitalize();   
}
function create_markers(map, data) {
    /*
    Input: map element and station information ('data')
    Ouput: 
    Function adds markers to the map at the correct locations (based on lng and lat) of the bike stations
    */

    // Add markers to the map
    
    // Iterate through the data object, placing a marker according to each longitude and latitude
    // When looping through json data .length returns 0
    for (var i = 0; i < Object.keys(data).length; i++) {
        var marker = new google.maps.Marker({
            position: {
                lat: data[i]['position']['lat'],
                lng: data[i]['position']['lng']
            },
            map: map,
            icon: '/static/Imgs/Google Maps Markers/' + data[i]["available_bikes"] + '.png',
            title: data[i].name,
        });
        // Convert station names to lowercase then capatilize the first letters of each
        var stat_name = data[i]['name'];
        var format_name = all_Caps(stat_name);
        //Writing the html and basic css for each popup
        var html = '<div class="popup_title">' + format_name + '</div>' + '<div> <span style="color:red;font-weight:bold;font-size:160%;font-family: "Times New Roman", Times, serif;">' + data[i]["available_bikes"] +
            '<img src = "/static/Imgs/bike_icon2.png" alt = "Bike" >' + '</span>' + '<span style="color:blue;font-weight:bold;float: right;font-size:160%;font-family: "Times New Roman", Times, serif;">' + '<img src = "static/Imgs/parking_icon.png" alt = "Bike" >' + data[i]['available_bike_stands'] + '</span> <br> <br> <button type="submit" class="btn btn-xs" disabled="disabled" style="background-color: maroon; color: white;"> Reserve <span class="glyphicon glyphicon-tag"></span> </button> <button type="submit" class="btn btn-xs" disabled="disabled" style="background-color: rgb(8,76,85); color: white; float: right; margin-left: 5px"> Favourite </button> </div>';
        makeInfoWindowEvent(map, html, marker, data, i);
        // add location to the array
        locations.push(marker);
    }



    function makeInfoWindowEvent(map, contentString, marker, data, i) {
        /*
        Input: map element, pop up window element, popup content string (i.e. info to be displayed in pop up) and the station marker
        Output: None
        Function creates pop up window with information which is displayed when a marker is clicked
        */
        google.maps.event.addListener(marker, 'click', function () {

            if (infoWindow) {
                infoWindow.close();
            }

            infoWindow = new google.maps.InfoWindow();
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
            open_sidebar();
            clear_directions();
            // Put in current bike stand info into sidebar
            var sidebar_html = '<div style="display:flex;justify-content:space-evenly;align-items:center;margin-bottom:10px;font-size:15px;"> <div>Bikes: </div><span style="color:red;font-weight:bold;font-size:160%;font-family: "Times New Roman", Times, serif;">' + data[i]["available_bikes"] +'<img src = "/static/Imgs/bike_icon2.png" alt = "Bike" style="margin-left:10px;" >' + '</span>' +
            '<div>Stands: </div><span style="color:blue;font-weight:bold;font-size:160%;font-family: "Times New Roman", Times, serif;">'  + data[i]['available_bike_stands'] + '<img src = "static/Imgs/parking_icon.png" alt = "Bike" style="margin-left:10px;" > </span></div>';
            document.getElementById("current_info").innerHTML=sidebar_html; 
            var stat_name = data[i]["name"];
            var formatted_name = all_Caps(stat_name);
            document.getElementById('station').innerHTML = formatted_name;
            
            station=name_prep(data[i]["name"]);
            if (chartsLoaded){
                setHist();
            } else {
                chartsLoaded=true;
                jQuery.ajax({
                    type: "GET",
                    url: '/hist_json/',
                    dataType: "json",
                    success: function (hist_data) {
                        histData=hist_data;
                        google.charts.load('current', {packages: ['corechart']});
                        google.charts.setOnLoadCallback(setHist);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log('textStatus: ' + textStatus);
                        console.log('errorThrown: ' + errorThrown);
                        console.log('jqXHR' + jqXHR);
                    }
                });
            }
            origin={
                'lat':data[i]["position"]["lat"],
                'lng':data[i]["position"]["lng"]
            };
            document.getElementById("predictions").style.display = "";
            document.getElementById("directions").style.display = "";
            document.getElementById("hists").style.display = "";
            document.getElementById("result").style.display = "none";
        });
    }

    var clusterStyles = [
        {
            url: 'static/Imgs/Google Maps Markers/mm3.png',
            height: 60,
            width: 60,
            anchorText: [12, -7]
        },
        {
            url: 'static/Imgs/Google Maps Markers/mm3.png',
            height: 60,
            width: 60,
            anchorText: [12, -7]
        },
        {
            url: 'static/Imgs/Google Maps Markers/mm3.png',
            height: 60,
            width: 60,
            anchorText: [12, -7]
        }
    ];
    var mcOptions = {
        gridSize: 100,
        maxZoom: 14,
        styles: clusterStyles,
        clusterClass: 'custom-clustericon'
    };

    var markerCluster = new MarkerClusterer(window.map, locations, mcOptions);
    markerCluster.setCalculator(function (markers) {
        if (infoWindow) {
            infoWindow.close();
        }
        bike_count = 0;
        for (var j = 0; j < markers.length; j++) {
            img_num = markers[j].icon.split("/")[4]
            bike_count += parseInt(img_num.split(".")[0]);
        }
        //Tell MarkerCluster this clusters details (and how to style it)
        return {
            text: bike_count,
            index: 3
        };
    });
}

function removeMarkers() {
    //sets all markers in array to null, then removes refernce to them
    for (i = 0; i < locations.length; i++) {
        locations[i].setMap(null);
    }
    locations = []
}
function update2(map, data) {
    if (infoWindow) {
        infoWindow.close();
    }
    removeMarkers();
    create_markers(map, data);
}

function update(map, callback) {
    /*
    Input: google map element, function 'callback' which is called if information retrieval is successful
    Ouput: None
    Function uses jquery to perform a http request to page specified in url key. if successful, data is saved into a global varaible 'data'
    and callback function is called. If unsuccessful error is presented on console.
    */

    jQuery.ajax({
        type: "GET",
        url: '/json/',
        dataType: "json",
        success: function (data) {
            callback(map, data)
            window.data = data;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('textStatus: ' + textStatus);
            console.log('errorThrown: ' + errorThrown);
            console.log('jqXHR' + jqXHR);
        }
    });
}


// To open up sidebar with station information etc.
function open_sidebar(){
    $(document).ready(function () {
        if ($("#left_column").attr("class") == "temp"){
            $('#left_column').toggleClass('active');
        }
    });
}
// To close the sidebar with station information etc.
function close_sidebar(){
    clear_directions();
    $(document).ready(function () {
        if ($("#left_column").attr("class") == "temp active"){
            $('#left_column').toggleClass('active');
        }
    });

}
function extra(){
    $(document).ready(function(){
            $(".search_input").css({"width":"0px","transition": "width 0.4s linear"});
            $("#search_results").css("display","none");
        });

}

function searchName() {
    /* 
    Function takes input from search bar and creates a suggestion list of stations with names starting
    with the searched letters
    */
    // Declare variables
    var input, filter, b;
    // Get input from search bar
    input = document.getElementById("myInput");
    // Ensure correct string comparison
    filter = input.value.toUpperCase();
    if (filter.length != 0) {
        // Empty suggestion drop down bar
        closeAllLists();
        document.getElementById('search_results').style.display = "";
        // Iterate through each station [info stored in 'data']
        for (var i = 0; i < Object.keys(data).length; i++) {
            address = data[i].address;
            // If entered letters are the prefix for the name of the station enter conditional
            if (address.substr(0, input.value.length).toUpperCase() == filter) {
                // Create a dropdown list of all the possible stations with letters being searched 
                b = document.createElement("DIV");
                b.setAttribute("class","guess")
                b.innerHTML = "<strong>" + address.substr(0, input.value.length) + "</strong>";
                b.innerHTML += address.substr(input.value.length);
                b.innerHTML += "<input type='hidden' value='" + i + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function (e) {
                    // insert the value for the autocomplete text field:
                    valuer = this.getElementsByTagName("input")[0].value;

                    var stat_name = data[valuer]['name'];
                    var format_name = all_Caps(stat_name);
                    //Writing the html and basic css for each popup
                    var contentString = '<div class="popup_title">' + format_name + '</div>' + '<div> <span style="color:red;font-weight:bold;font-size:160%;font-family: "Times New Roman", Times, serif;">' + data[valuer]["available_bikes"] +
                        '<img src = "/static/Imgs/bike_icon2.png" alt = "Bike" >' + '</span>' + '<span style="color:blue;font-weight:bold;float: right;font-size:160%;font-family: "Times New Roman", Times, serif;">' + '<img src = "static/Imgs/parking_icon.png" alt = "Bike" >' + data[valuer]['available_bike_stands'] + '</span> <br> <br> <button type="submit" class="btn btn-xs" disabled="disabled" style="background-color: maroon; color: white;"> Reserve <span class="glyphicon glyphicon-tag"></span> </button> <button type="submit" class="btn btn-xs" disabled="disabled" style="background-color: rgb(8,76,85); color: white; float: right; margin-left: 5px"> Favourite </button> </div>';
                    
                    if (infoWindow) {
                        infoWindow.close();
                    }
        
                    infoWindow = new google.maps.InfoWindow();

                    infoWindow.setContent(contentString);
                    infoWindow.open(map, locations[valuer]);

                    open_sidebar();
                    extra();
                    document.getElementById('station').innerHTML = data[valuer]["name"];
                    var sidebar_html = '<div style="display:flex;justify-content:space-evenly;align-items:center;margin-bottom:10px;font-size:15px;"> <div>Bikes: </div><span style="color:red;font-weight:bold;font-size:160%;font-family: "Times New Roman", Times, serif;">' + data[valuer]["available_bikes"] +'<img src = "/static/Imgs/bike_icon2.png" alt = "Bike" style="margin-left:10px;" >' + '</span>' +
                    '<div>Stands: </div><span style="color:blue;font-weight:bold;font-size:160%;font-family: "Times New Roman", Times, serif;">'  + data[valuer]['available_bike_stands'] + '<img src = "static/Imgs/parking_icon.png" alt = "Bike" style="margin-left:10px;" > </span></div>';
                    document.getElementById("current_info").innerHTML=sidebar_html; 
                    station=name_prep(data[valuer]["name"]);

                    if (chartsLoaded){
                        setHist();
                    } else {
                        chartsLoaded=true;
                        jQuery.ajax({
                            type: "GET",
                            url: '/hist_json/',
                            dataType: "json",
                            success: function (hist_data) {
                                histData=hist_data;
                                google.charts.load('current', {packages: ['corechart']});
                                google.charts.setOnLoadCallback(setHist);
                            },
                            error: function (jqXHR, textStatus, errorThrown) {
                                console.log('textStatus: ' + textStatus);
                                console.log('errorThrown: ' + errorThrown);
                                console.log('jqXHR' + jqXHR);
                            }
                        });
                    }

                    document.getElementById("predictions").style.display = "";
                    document.getElementById("directions").style.display = "";
                    document.getElementById("hists").style.display = "";
                    origin={
                        'lat':data[valuer]['position']['lat'],
                        'lng':data[valuer]['position']['lng']
                    };
                    moveToLocation(origin.lat, origin.lng);
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                document.getElementById('search_results').appendChild(b);
            }
        }
    }
    if (filter.length == 0) {
        closeAllLists();
    }

    function closeAllLists(elmnt) {
        // Function closes dropdown bar for search suggestions
        document.getElementById('search_results').innerHTML = "";
        document.getElementById('search_results').style.display = "none";
    }

    function moveToLocation(lat, lng) {
        const center = new google.maps.LatLng(lat, lng);
        // using global variable:
        window.map.panTo(center);
        window.map.setZoom(17);
    }
}

var date = new Date();
var x = document.getElementById("datePicker");
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
for (var i=1; i<6;i++){
    var option = document.createElement("option");
    var ddate = new Date(date.getFullYear(), date.getMonth(), date.getUTCDate()+i);
    option.text = ddate.getUTCDate() + " " + months[ddate.getUTCMonth()] + " " + ddate.getUTCFullYear();
    x.add(option);
}

function setHist() {
    //functions sets the histogram to the values assigned to global variables station and weekday.
    var current_day=weekdays[weekday];
    var raw_data=histData[station][current_day];
    var google_data=[['Time', 'Available Bikes', { role: 'style' }]];
    var d = new Date();
    var current_hour = d.getHours();
    for(var i=0;i<raw_data.length;i++) {
        var hour=raw_data[i][0];
        if(parseInt(hour)==current_hour){
            google_data.push([hour,raw_data[i][1],'stroke-color: #e43e34; stroke-opacity: 0.2; stroke-width: 4; fill-color: #e43e34; fill-opacity: 1.0']);
        } else {
            google_data.push([hour,raw_data[i][1],'stroke-color: #084c55; stroke-opacity: 0.2; stroke-width: 4; fill-color: #084c55; fill-opacity: 1.0']);
        }  
    }
    var chartTable = google.visualization.arrayToDataTable(google_data);

    var chart = new google.visualization.ColumnChart(document.getElementById('hist'));
    var options={
        legend: {position:"none"},
        bar: {groupWidth:"75%"},
        vAxis: {
            textPosition:"none",
            gridlines: {
                color: 'transparent'
                }
            },
        chartArea:{
            left:0,
            top:0,
            width:'100%',
            height:'90%'}
    };
    chart.draw(chartTable,options);
    document.getElementById("weekday").innerHTML=current_day;
}

document.getElementById("nextDay").addEventListener("click",function(){
    //sets histogram to the next day whenever button with id "nextDay" is clicked.
    weekday=(weekday+1)%7; //adds 1 except when weekday is 6, in which case it goes to 0.
    setHist();
    });

document.getElementById("prevDay").addEventListener("click",function(){
    //sets histogram to the previous day whenever button with id "prevDay" is clicked.
    weekday=(weekday+6)%7; //subtracts 1 except when weekday is 0, in which case it goes to 6.
    setHist();
    });

$(document).ready(function () {
    $('#timePicker').kendoTimePicker({
        value: roundTimeQuarterHour(new Date()),
        dateInput: true,
        interval: 30
    });
});

function roundTimeQuarterHour(time) {
    var timeToReturn = new Date(time);

    timeToReturn.setMilliseconds(Math.round(timeToReturn.getMilliseconds() / 1000) * 1000);
    timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
    timeToReturn.setMinutes(Math.ceil(timeToReturn.getMinutes() / 30) * 30);
    return timeToReturn;
}

// Pull weather data from OpenWeatherMap API and display information on page
function weatherBalloon(cityID) {
    var key = document.getElementById("key").innerHTML.replace(/\s+/g, '');
    fetch('https://api.openweathermap.org/data/2.5/weather?id=' + cityID + '&appid=' + key)  
    .then(function(resp) { return resp.json() }) // Convert data to json
    .then(function(data) {
        drawWeather(data);
    })
    .catch(function() {
        // catch any errors
    });
}

function drawWeather(d) {
    var celcius = Math.round(parseFloat(d.main.temp)-273.15);
    var iconCode = d.weather[0].icon;
    var iconURL = "http://openweathermap.org/img/wn/" + iconCode + "@2x.png";
    $('#weatherIcon').attr('src', iconURL);
    // Capatilize the weather description
    var weather_description = d.weather[0].description;
    var formatted_description = all_Caps(weather_description);
    document.getElementById('description').innerHTML = formatted_description;
    document.getElementById('temp').innerHTML = celcius + '&deg;C';
}

// When page loads call on function to pull weather data from API and display on page
window.onload = function() {
    weatherBalloon(cityID);
}
document.getElementById("dir_button").addEventListener("click",function(){
    destination=(document.getElementById("dir_input").value);
    document.getElementById("dir_input").value="";
    //source: https://developers.google.com/maps/documentation/javascript/geocoding
    var geocoder;
    geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': `${destination}, Dublin, Ireland`
        }, function(results, status) {
            if (status == 'OK') {
                var lat=results[0].geometry.location.lat();
                var lng=results[0].geometry.location.lng();
                // Set directions destination value to the address returned by google geocoding service
                document.getElementById("dest").innerHTML= results[0].formatted_address;
                // directions start position
                document.getElementById('start').innerHTML = document.getElementById('station').innerHTML;
                destination={
                    'lat':lat,
                    'lng':lng
                };
                getFastestRoute(destination);                
            } else {
                window.alert('Geocode was not successful for the following reason: ' + status);
            }
    }); 
    return;
});

function getFastestRoute(destination){
    var distanceArray=[]
    for (i=0; i<Object.keys(window.data).length; i++){
        //push arrays with index of station and distance between station and coords to distanceArray
        distanceArray.push([i,calculateDistance(destination,window.data[i].position)]);
    }
    //sort distanceArray by distance ascending
    distanceArray.sort(function(a,b){return a[1]-b[1]});
    stationArray=[];
    distanceIDs=[]
    var i=0;
    while (stationArray.length<10){
        //push 10 closest stations that have at least 3 available bike stands to array as google LatLng objects
        if(window.data[distanceArray[i][0]].available_bike_stands>2){
            stationArray.push(new google.maps.LatLng(window.data[distanceArray[i][0]].position.lat,window.data[distanceArray[i][0]].position.lng));
            distanceIDs.push(distanceArray[i][0]);
        }
        //if all stations are iterated before 10 matches are found, break the while loop.
        if(++i>=window.data.length){
            break;
        }
    }
    apiCount=0; //variable used to synchronize Distance Matrix Calls
    googleDes=new google.maps.LatLng(destination.lat,destination.lng);
    //call distance matrix in order to find durations of walk from 10 closest stations to destination
    getDuration(stationArray,[googleDes],'WALKING',setWalkingMatrix);
    googleOrg=new google.maps.LatLng(origin.lat,origin.lng);
    //call distance matrix in order to find durations of cycle ride from origin to 10 closest stations to destination
    getDuration([googleOrg],stationArray,'BICYCLING',setBicyclingMatrix);
}

function calculateDistance(coords1,coords2){
    return Math.sqrt(Math.pow(coords1.lat-coords2.lat,2)+Math.pow(coords1.lng-coords2.lng,2));
}

function getDuration(org,des,travelmode,callback){
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
    {
        origins: org,
        destinations: des,
        travelMode: travelmode,
    }, callback);
}

function setBicyclingMatrix(results,status){
    if (status == 'OK') {
        
        bicyclingMatrix=results.rows[0].elements; //sets cycling matrix
        if(++apiCount>1){
            matrixConcat(); //only called if return of other distance matrix call has already called callback.
        }
    } else {
        window.alert('Distance Matrix was not successful for the following reason: ' + status);
    }
}

function setWalkingMatrix(results,status){
    if (status == 'OK') {
        walkingMatrix=results.rows; //sets walkingMatrix
        if(++apiCount>1){
            matrixConcat(); //only called if return of other distance matrix call has already called callback.
        }
    } else {
        window.alert('Distance Matrix was not successful for the following reason: ' + status);
    }   
}

function matrixConcat(){
    var durationArray=[0,0,0,Number.MAX_SAFE_INTEGER]; //last entry in array is total duration of trip.
    var duration;
    for (i=0;i<bicyclingMatrix.length;i++){
        //calculate duration of total trip in mins
        duration=(bicyclingMatrix[i].duration.value+walkingMatrix[i].elements[0].duration.value)/60;
        if(duration<durationArray[3]) {
            //replace value in durationArray if current duration is lower than previous min.
            durationArray=[i,bicyclingMatrix[i].duration.text,walkingMatrix[i].elements[0].duration.text,duration];
        }
    }
    document.getElementById("dropoff").innerHTML=window.data[distanceIDs[durationArray[0]]].address;
    apiCount=0; //variable used again to check where polyline should be stored
    polylines=[null,null]; //polylines are stored globally
    //draw directions for the cycling to bike stand near destination
    drawDirections(new google.maps.LatLng(origin.lat,origin.lng),stationArray[durationArray[0]],google.maps.TravelMode.BICYCLING,google.maps.SymbolPath.FORWARD_CLOSED_ARROW,'#00008b ','30px');
    //draw directions for walking from bike stand near destination to destination
    drawDirections(stationArray[durationArray[0]],new google.maps.LatLng(destination.lat,destination.lng),google.maps.TravelMode.WALKING,google.maps.SymbolPath.FORWARD_CLOSED_ARROW,'#e43e34','30px');
    avg={
        lat:(origin.lat+destination.lat)/2,
        lng:(origin.lng+destination.lng)/2
    };
    window.map.setCenter(avg);
    window.map.setZoom(14);
    setTripWindow(durationArray);
}

function drawDirections(origin,destination,travelmode,path,color,repeat){
    var order=++apiCount-1;
    //source: https://stackoverflow.com/questions/16180104/get-a-polyline-from-google-maps-directions-v3/16180970
    var directionsService = new google.maps.DirectionsService();
    var directionsDisplay = new google.maps.DirectionsRenderer({
        map: window.map,
        preserveViewport: true
    });
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: travelmode
        }, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                var lineSymbol= {
                    path: path,
                    strokeOpacity:1,
                    fillColor:color,
                    fillOpacity:0.5
                };
                polylines[order] = new google.maps.Polyline({
                    path: [],
                    strokeColor: color,
                    strokeWeight: 2,
                    strokeOpacity: 0,
                    icons: [{
                        icon:lineSymbol,
                        offset:'60px',
                        repeat:repeat
                    }]
                });
                var bounds = new google.maps.LatLngBounds();
                var legs = response.routes[0].legs;
                for (i = 0; i < legs.length; i++) {
                    var steps = legs[i].steps;
                    for (j = 0; j < steps.length; j++) {
                        var nextSegment = steps[j].path;
                        for (k = 0; k < nextSegment.length; k++) {
                            polylines[order].getPath().push(nextSegment[k]);
                            bounds.extend(nextSegment[k]);
                        }
                    }
                }
                polylines[order].setMap(window.map);
        } else {
                window.alert('Directions request failed due to ' + status);
        } 
    });
}

function setTripWindow(tripData){   
    document.getElementById("directions").style.display="none";
    document.getElementById("totaltrip").innerHTML="Total Journey: "+Math.round(tripData[3])+" mins";
    document.getElementById("bicyclingtrip").innerHTML=tripData[1];
    document.getElementById("walkingtrip").innerHTML=tripData[2];
    document.getElementById("trip").style.display="";
}

document.getElementById("close_trip").addEventListener("click",function(){
    for (i=0;i<polylines.length;i++){
        polylines[i].setMap(null);
    }
    document.getElementById("trip").style.display="none";
    document.getElementById("directions").style.display="";
});

function clear_directions(){
    if (polylines != null){
        for (i=0;i<polylines.length;i++){
            polylines[i].setMap(null);
        }
        document.getElementById("trip").style.display="none";
        document.getElementById("directions").style.display="";
}
}
// Splash screen - taken from https://codepen.io/dcode-software/pen/NEErgO
window.addEventListener("load", function () {
    const loader = document.querySelector(".loader");
    loader.className += " hidden"; // class "loader hidden"
});