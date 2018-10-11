var map = null;

// list of vehicles currently being displayed on the map
// map markers are stored in vehicles[i].marker
var mapVehicles = [];
// currently booked vehicle if applicable, marker is stored as above
var bookedVehicle = null;

var urlAvail = '/img/hamburger.png';

// keep track of the currently open info window
var currentInfoWindow = null;
// keep track of which button is currently visible
var nearbyButton = true;
// the marker which represents the user's location
var geoMarker = null;
// signed in user
var googleUser = null;

function onLogin(user) {
	console.log("Google Client Token");
	console.log(user.getAuthResponse().id_token);
	// post the client ID to the server
	var headers = new Headers();
	headers.append("Content-Type", "application/json");
	var request = new Request("/login", {
		method: 'post',
		headers: headers,
		body: JSON.stringify({
			id: user.getAuthResponse().id_token
		})
	});
	fetch(request)
	.then(res => {
		googleUser = user;
	    console.log('Logged in as: ' + googleUser.getBasicProfile().getName());
	    var id_token = googleUser.getAuthResponse().id_token;
	    // hide sign-in button
	    document.getElementsByClassName("g-signin2")[0].style.display = 'none';
	    // show logout button
	    document.getElementById("header-links").style.visibility = 'visible';
	    // hide login hint if visible
	    hideLoginHint();
	    // fire event
	    document.dispatchEvent(new Event("login"));
	});
}

function signOut() {
	// kill the session
	fetch(new Request("/logout"))
	.then(res => {
		// sign out on client side
		gapi.auth2.getAuthInstance().signOut().then(function () {
			googleUser = null;
			console.log('User signed out.');
			// hide logout button
		    document.getElementById("header-links").style.visibility = 'hidden';
		    // show sign-in button
		    document.getElementsByClassName("g-signin2")[0].style.display = 'unset';
		    // go home
		    window.location.href = "/";
		});
	});
}

function showLoginHint() {
    document.getElementById("login-hint").className = "";
}

function hideLoginHint() {
	document.getElementById("login-hint").className = "hidden";
}

function showNearbyButton() {
	if (!nearbyButton) {
		var button = document.getElementById("geo-button");
		button.innerHTML = 'NEARBY CARS';
		button.removeEventListener('click', geolocateHandler)
		button.addEventListener('click', nearbyHandler)
		nearbyButton = true;
	}
}

function showGeoButton() {
	if (nearbyButton) {
		var button = document.getElementById("geo-button");
		button.innerHTML = '<i class="material-icons md-18">my_location</i>FIND ME';
		button.removeEventListener('click', nearbyHandler)
		button.addEventListener('click', geolocateHandler)
		nearbyButton = false;
	}
}

function geolocateHandler(e) {
	e.preventDefault();
	map.panTo(geoMarker.marker.getPosition());
	showNearbyButton();
}

function nearbyHandler(e) {
	var pos = geoMarker.marker.getPosition()
	nearbyCars(pos);
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: new google.maps.LatLng(-37.813985, 144.960235),
		zoom: 15,
		disableDefaultUI: true
	});
	
	map.setOptions({styles: [
		{
			featureType: 'poi.business',
			stylers: [{visibility: 'off'}]
		}
	]});
	
	// listener which resets the 'geolocate' button on pan
	map.addListener('center_changed', () => {
		if (document.getElementById("geo-button")) {
			showGeoButton();
		}
	});
	
	// draw user's location
	navigator.geolocation.watchPosition(pos => {
		displayLocation(pos);
	}, console.error, {enableHighAccuracy: true});
	
	// fetch & display vehicles
	rebu.getVehicles(displayVehicles);

	// refresh the map automatically every 60 seconds
	setInterval(function() {
		rebu.getVehicles(displayVehicles);
	}, 60000);
}

function displayVehicles(vehicles) {
	// clear old markers
	for (var i = 0; i < mapVehicles.length; i++) {
		mapVehicles[i].marker.setMap(null);
	}
	// display new markers
	for (var i = 0; i < vehicles.length; i++) {
		vehicles[i].marker = createVehicleMarker(vehicles[i], map);
	};
	mapVehicles = vehicles;
}

function displayLocation(pos) {
	var p = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
	var acc = pos.coords.accuracy
	if (geoMarker) {
		geoMarker.marker.setPosition(p);
		geoMarker.circle.setCenter(p);
		geoMarker.circle.setRadius(acc);
	} else {
		geoMarker = {
			marker: new google.maps.Marker({
				position: p,
				map: map,
				icon: {
					url: "/img/user-pin.png",
					size: new google.maps.Size(40, 40),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(20, 40)
				}
			}),
			circle: new google.maps.Circle({
				fillColor: "#42A5F4",
				fillOpacity: 0.25,
				strokeWeight: 0,
				map: map,
				center: p,
				radius: acc
			})
		};
	}
}

function createVehicleMarker(vehicle, map, booked = false) {
	var marker = new google.maps.Marker({
		position: vehicle.location,
		map: map,
		icon: {
			url: urlAvail,
			size: new google.maps.Size(40, 40),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(20, 40)
		},
		title: vehicle.storename
	});
	
	marker.addListener('click', function() {
		console.log("Clicked on marker for", vehicle)
		// close the currently opened window
		if (currentInfoWindow) currentInfoWindow.close();
		
		// create info window & open it
		var content = view.infoWindow(vehicle, function(e) {
			e.preventDefault();
			bookingForm(vehicle);
		});
		var info = new google.maps.InfoWindow({content: content});
		info.open(map, marker);
		
		// update the current window var
		currentInfoWindow = info;
	});
	
	return marker;
}

function bookingForm(vehicle) {
	console.log("Getting booking form for", vehicle)
	// close the current info window
	if (currentInfoWindow) {
		currentInfoWindow.close();
		currentInfoWindow = null;
	}
	// create the form
	var vehicleInfo = view.restaurantInfo(vehicle);
	var bookingForm = view.bookingForm(vehicle);
	bookingForm.addEventListener("submit", function(e) {
		e.preventDefault();
		submitBooking(vehicle);
	});
	
	sidepane.clear();
	sidepane.appendHeader("BOOK YOUR CAR");
	sidepane.append(vehicleInfo);
	sidepane.append(bookingForm);
	sidepane.open();
}

function submitBooking(vehicle) {	
	// collect booking details
	if (googleUser != null){
		var form = document.getElementById("booking-form");
		var timeSelect = document.getElementById("dropoff-time");
		var duration = timeSelect.options[timeSelect.selectedIndex].value;
		var store_id = document.getElementById("store_id").value;
		var item = timeSelect.options[timeSelect.selectedIndex].text;
		var itemP =  document.createElement("p");
		itemP.innerText = item;
	    	
				
					// show the confirmation screen
					var vehicleInfo = view.restaurantInfo(vehicle);
					sidepane.clear();
					sidepane.appendHeader("YOUR ORDER: ");
					
					sidepane.append(itemP);
					
					sidepane.appendHeader("Location: ");
					sidepane.append(vehicleInfo);
					
					//sidepane.clear();
					//sidepane.appendHeader("PAYMENT");
					sidepane.append(view.payment(null));
					// render paypal button
					// refresh the map
					paypal.Button.render({

				        // Set your environment

				        env: 'sandbox', // sandbox | production

				        // Specify the style of the button

				        style: {
				            label: 'checkout',
				            size:  'small',    // small | medium | large | responsive
				            shape: 'pill',     // pill | rect
				            color: 'gold'      // gold | blue | silver | black
				        },

				        // PayPal Client IDs - replace with your own
				        // Create a PayPal app: https://developer.paypal.com/developer/applications/create

				        client: {
				            sandbox:    'AcsIzgLyjCG77N2aONf-J33hG74Mav83qnYtGU1FWAL4dtgwXmON2XQ_Xu2QJWvKPxPwZB8Di7UhMnHb',
				            production: '<insert production client id>'
				        },

				        payment: function(data, actions) {
				            return actions.payment.create({
				                payment: {
				                    transactions: [
				                        {
				                            amount: { total: '0.01', currency: 'AUD' }
				                        }
				                    ]
				                }
				            });
				        },

				        onAuthorize: function(data, actions) {
					        return actions.payment.execute().then(function() {
					        	var orderRequest = {
				        				store_id: store_id,
				        				duration: duration,
				        				item: item,
				        				client: googleUser.getBasicProfile().getEmail()
				        		};
				        		
					        	rebu.requestBooking(orderRequest, function(succeeded) {
					        		
					        		if (succeeded) {
					        			sidepane.clear();
					        			
								    	sidepane.appendHeader("PAYMENT");
								    	
								    	sidepane.append(view.paymentConfirmation(true));
								    	sidepane.append(view.bookingConfirmed());
								    	
								    	rebu.getVehicles(displayVehicles);
										// show booking marker & card
										
										displayCurrentBooking();
					        		} else {
					        			sidepane.clear();
								    	sidepane.appendHeader("You have already ordered!");
								    	var message = document.createElement("p");
								    	message.innerText = "Make sure that your current order has completed";
								    	sidepane.append(message);
										
									}
					        		
					        	});
					        	

								
					        });
					    },
					    onError: function(err) {
					    	sidepane.clear();
					    	sidepane.appendHeader("PAYMENT");
					    	sidepane.append(view.paymentConfirmation(false));
					    	alert("Order failed");
					    }

				    }, '#paypal-button-container');
					sidepane.open();
					

	} else {
		showLoginHint();
	}

}

function nearbyCars(pos) {
	// fetch nearby cars
	rebu.getNearby(pos, function(nearby) {
		// show the response
		sidepane.clear();
		sidepane.appendHeader("NEARBY RESTAURANTS");
		for (var i = 0; i < nearby.length; i++) {
			let vehicle = nearby[i];
			console.log(vehicle);
			var nearbyVehicle = view.nearbyVehicle(vehicle, function(e) {
				e.preventDefault();
				bookingForm(vehicle);
			});
			sidepane.append(nearbyVehicle);
		}
		sidepane.open();
	});
}

function findBookedVehicle(booking) {
	if (map != null) {
		map.panTo(bookedVehicle.marker.getPosition());
	}
	// open a google maps link navigating to the vehicle
	var pos = bookedVehicle.marker.getPosition();
	var link = "https://maps.google.com/maps?daddr=" + pos.lat() + "," + pos.lng();
	var win = window.open(link, '_blank');
	win.focus();
}

function endOrder(booking) {
	rebu.endCurrentBooking(function(success) {
		if (success) {
			if (map != null) {
				removeCurrentBooking();
				rebu.getVehicles(displayVehicles);
			} else {
				window.location.reload();
			}
		} else {
			alert("Booking has not ended");
		}
	});
}

// Queries for the user's current booking & displays it as a card
function displayCurrentBooking() {
	rebu.getCurrentBooking(function(order) {
		// create vehicle marker
		bookedRestaurant = order.restaurant;
		bookedRestaurant.marker = createVehicleMarker(bookedRestaurant, map, true);
		
		// display the card
		var currentOrderCard = view.currentOrderCard(order, findBookedVehicle, endOrder);
			
		// fancy transition
		currentOrderCard.className = "transition-start";
		setTimeout(function() {
			currentOrderCard.className = "";
		}, 200);
		document.body.appendChild(currentOrderCard);
	});
}

// removes the current booking card & marker
function removeCurrentBooking() {
	// remove the marker first
	if (bookedVehicle) {
		bookedVehicle.marker.setMap(null);
		bookedVehicle = null;
	}
	// remove the card
	var currentBookingCard = document.getElementById("current-order");
	if (currentBookingCard) {
		// fancy transition
		currentBookingCard.className = "transition-start";
		setTimeout(function() {
			document.body.removeChild(currentBookingCard);
		}, 200);
	}
}

// initialize sidepane
sidepane.setOpenCallback(function() {
	document.getElementById('sidepane').style.width = null;
	document.getElementById('map-wrapper').style.left = '360px';
});
sidepane.setCloseCallback(function() {
	document.getElementById('sidepane').style.width = '0';
	document.getElementById('map-wrapper').style.left = null;
});
if (document.getElementById('sidepane').classList.contains('static')) {
	sidepane.setStatic(true);
}

// add listeners for login hint
var loginHint = document.getElementById("login-hint");
loginHint.addEventListener('click', function() {
	hideLoginHint();
});
document.addEventListener('keyup', function(e) {
	if (e.keyCode == 27 && loginHint.className == '') {
		hideLoginHint();
	}
});