var map = null;

// list of vehicles currently being displayed on the map
// map markers are stored in vehicles[i].marker
var mapRestaurants = [];
// currently booked vehicle if applicable, marker is stored as above
var bookedRestaurant = null;

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
		button.innerHTML = 'NEARBY STORES';
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
	rebu.getRestaurants(displayRestaurants);
}

function displayRestaurants(restaurants) {
	// clear old markers
	for (var i = 0; i < mapRestaurants.length; i++) {
		mapRestaurants[i].marker.setMap(null);
	}
	// display new markers
	for (var i = 0; i < restaurants.length; i++) {
		restaurants[i].marker = createRestaurantMarker(restaurants[i], map);
	};
	mapRestaurants = restaurants;
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

function createRestaurantMarker(restaurant, map, booked = false) {
	var marker = new google.maps.Marker({
		position: restaurant.location,
		map: map,
		icon: {
			url: urlAvail,
			size: new google.maps.Size(40, 40),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(20, 40)
		},
		title: restaurant.storename
	});
	
	marker.addListener('click', function() {
		// close the currently opened window
		if (currentInfoWindow) currentInfoWindow.close();
		
		// create info window & open it
		var content = view.infoWindow(restaurant, function(e) {
			e.preventDefault();
			orderForm(restaurant);
		});
		
		var info = new google.maps.InfoWindow({content: content});
		info.open(map, marker);
		
		// update the current window var
		currentInfoWindow = info;
	});
	
	return marker;
}

function orderForm(restaurant) {
	console.log("Getting order form for", restaurant)
	// close the current info window
	if (currentInfoWindow) {
		currentInfoWindow.close();
		currentInfoWindow = null;
	}
	// create the form
	var restaurantInfo = view.restaurantInfo(restaurant);
	var orderForm = view.orderForm(restaurant);
	orderForm.addEventListener("submit", function(e) {
		e.preventDefault();
		submitOrder(restaurant);
	});
	
	sidepane.clear();
	sidepane.appendHeader("ORDER YOUR FOOD");
	sidepane.append(restaurantInfo);
	sidepane.append(orderForm);
	sidepane.open();
}

function submitOrder(restaurant) {	
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
					var restaurantInfo = view.restaurantInfo(restaurant);
					sidepane.clear();
					sidepane.appendHeader("YOUR ORDER: ");
					
					sidepane.append(itemP);
					
					sidepane.appendHeader("Location: ");
					sidepane.append(restaurantInfo);
					
					//sidepane.clear();
					//sidepane.appendHeader("PAYMENT");
					sidepane.append(view.payment());
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
				        		
					        	rebu.requestOrder(orderRequest, function(succeeded) {
					        		
					        		if (succeeded) {
					        			sidepane.clear();
					        			
								    	sidepane.appendHeader("PAYMENT");
								    	
								    	sidepane.append(view.paymentConfirmation(true));
								    	sidepane.append(view.orderConfirmed());
								    	
								    	rebu.getRestaurants(displayRestaurants);
										// show booking marker & card
										
								    	displayCurrentOrder();
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
			let restaurant = nearby[i];
			console.log(restaurant);
			var nearbyRestaurant = view.nearbyVehicle(restaurant, function(e) {
				e.preventDefault();
				orderForm(restaurant);
			});
			sidepane.append(nearbyRestaurant);
		}
		sidepane.open();
	});
}

function findBookedRestaurant(order) {
	if (map != null) {
		map.panTo(bookedRestaurant.marker.getPosition());
	}
	// open a google maps link navigating to the vehicle
	var pos = bookedRestaurant.marker.getPosition();
	var link = "https://maps.google.com/maps?daddr=" + pos.lat() + "," + pos.lng();
	var win = window.open(link, '_blank');
	win.focus();
}

function endOrder(order) {
	rebu.endCurrentOrder(function(success) {
		if (success) {
			if (map != null) {
				removeCurrentOrder();
				rebu.getRestaurants(displayRestaurants);
			} else {
				window.location.reload();
			}
		} else {
			alert("Booking has not ended");
		}
	});
}

// Queries for the user's current booking & displays it as a card
function displayCurrentOrder() {
	rebu.getCurrentOrder(function(order) {
		// create vehicle marker
		bookedRestaurant = order.restaurant;
		bookedRestaurant.marker = createVehicleMarker(bookedRestaurant, map, true);
		
		// display the card
		var currentOrderCard = view.currentOrderCard(order, findBookedRestaurant, endOrder);
			
		// fancy transition
		currentOrderCard.className = "transition-start";
		setTimeout(function() {
			currentOrderCard.className = "";
		}, 200);
		document.body.appendChild(currentOrderCard);
	});
}

// removes the current booking card & marker
function removeCurrentOrder() {
	// remove the marker first
	if (bookedRestaurant) {
		bookedRestaurant.marker.setMap(null);
		bookedRestaurant = null;
	}
	// remove the card
	var currentOrderCard = document.getElementById("current-order");
	if (currentOrderCard) {
		// fancy transition
		currentOrderCard.className = "transition-start";
		setTimeout(function() {
			document.body.removeChild(currentOrderCard);
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