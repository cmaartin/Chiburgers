// contains all API requests
rebu = (function() {
	
	// if true, calls will use admin API routes when possible
	var isAdmin = false;
	
	function addVehicleDescription(vehicle) {
		vehicle.description =  vehicle.storename;
	}
	
	return {
		
		setAdmin: function(value) {
			isAdmin = value;
		},
		
		isAdmin: function() {
			return isAdmin;
		},
		
		getVehicles: function(callback) {
			console.log("Get Restaurants");
			var vehicles = [];
			var request = new Request(isAdmin ? '/admin/api/vehicles/all' : '/api/restaurants');
			fetch(request)
			.then(res => res.json())
			.then(json => {
				for (var i = 0; i < json.length; i++) {
					var vehicle = json[i];
					// TODO: temporary fix for model mismatch
					addVehicleDescription(vehicle)
					
					vehicles.push(vehicle);
				};
				console.log(vehicles);
				callback(vehicles);
			});
		},
		
		getNearby: function(pos, callback) {
			console.log("Get nearby restaurants");
			var vehicles = [];
			var headers = new Headers();
			headers.append("Content-Type", "application/json");
			var request = new Request('/api/restaurants/nearby', {
				method: 'post',
				headers: headers,
				body: JSON.stringify(pos)
			});
			
			fetch(request)
			.then(res => res.json())
			.then(json => {
				for (var i = 0; i < json.length; i++) {
					var vehicle = json[i];
					
					// TODO: temporary fix for model mismatch
					addVehicleDescription(vehicle)
					vehicle.available = true;
					
					// make the distance prettier
					vehicle.distance = vehicle.distance.toFixed(2) + " km";
					
					vehicles.push(vehicle);
				}
				console.log(vehicles);
				callback(vehicles)
			});
		},
		
		requestBooking: function(orderRequest, callback) {
			console.log("[api] requesting order", orderRequest);
			var booking = {
			    timestamp: view.dateToString(new Date()),
			    store_id: orderRequest.store_id,
			    customerId: orderRequest.client,
			    duration: orderRequest.duration,
			    item: orderRequest.item
			}
			
			booking = JSON.stringify(booking);
			console.log("Order:", booking);
						
			var headers = new Headers();
			headers.append("Content-Type", "application/json");
			var request = new Request('/api/orders', {
				method: 'post',
				headers: headers,
				body: booking
			});
			
			fetch(request).then(res => {
				if (res.status == 200) {
					res.json()
					.then(callback(booking));
				} else {
					callback(null);
				}
			});
		},
		
		getBookings: function(user, callback) {
			console.log("[api] getting bookings for " + user);
			var request = new Request('/api/bookings?id=' + user);
			fetch(request)
			.then(res => res.json())
			.then(json => {
				callback(json);
			});
		},
		
		getCurrentBooking: function(callback) {
			console.log("[api] getting current order");
			var request = new Request('/api/orders/now');
			fetch(request)
			.then(res => {
				if (res.status == 200) {
					res.json()
					.then(booking => {
						addVehicleDescription(booking.restaurant);
						console.log(booking);
						callback(booking);
					})
				} else {
					console.log("No current booking");
				}
			});
		},
		
		extendCurrentBooking: function(extraDuration, callback) {
			console.log("[api] extending current booking");
			
			var headers = new Headers();
			headers.append("Content-Type", "application/json");
			
			var body = {
				extraDuration: extraDuration
			};
			
			var request = new Request('/api/bookings/extend', {
				method: 'POST',
				headers: headers,
				body: JSON.stringify(body)
			});
			
			fetch(request)
			.then(res => {
				if (res.status == 200) {
					return callback(true);
				}
				else {
					return callback(false);
				}
			});
		},
		
		endCurrentBooking: function(callback) {
			console.log("[server] end order");
			
			var headers = new Headers();
			headers.append("Content-Type", "application/json");
			
			var request = new Request('/api/bookings/end');
			
			fetch(request)
			.then(res => {
				if (res.status == 200) {
					return callback(true);
				}
				else {
					return callback(false);
				}
			});
		}
	
	}
	
})();
