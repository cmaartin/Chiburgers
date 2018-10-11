// contains all API requests
rebu = (function() {
	
	function addRestaurantDescription(restaurant) {
		restaurant.description =  restaurant.storename;
	}
	
	return {
		
		getRestaurants: function(callback) {
			console.log("Get Restaurants");
			var restaurants = [];
			var request = new Request('/api/restaurants');
			fetch(request)
			.then(res => res.json())
			.then(json => {
				for (var i = 0; i < json.length; i++) {
					var restaurant = json[i];
					// TODO: temporary fix for model mismatch
					addRestaurantDescription(restaurant)
					
					restaurants.push(restaurant);
				};
				console.log(restaurants);
				callback(restaurants);
			});
		},
		
		getNearby: function(pos, callback) {
			console.log("Get nearby restaurants");
			var restaurants = [];
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
					var restaurant = json[i];
					
					// TODO: temporary fix for model mismatch
					addRestaurantDescription(restaurant)
					
					// make the distance prettier
					restaurant.distance = restaurant.distance.toFixed(2) + " km";
					
					restaurants.push(restaurant);
				}
				console.log(restaurants);
				callback(restaurants)
			});
		},
		
		requestOrder: function(orderRequest, callback) {
			console.log("[api] requesting order", orderRequest);
			var order = {
			    timestamp: view.dateToString(new Date()),
			    store_id: orderRequest.store_id,
			    customerId: orderRequest.client,
			    duration: orderRequest.duration,
			    item: orderRequest.item
			}
			
			order = JSON.stringify(order);
			console.log("Order:", order);
						
			var headers = new Headers();
			headers.append("Content-Type", "application/json");
			var request = new Request('/api/orders', {
				method: 'post',
				headers: headers,
				body: order
			});
			
			fetch(request).then(res => {
				if (res.status == 200) {
					res.json()
					.then(callback(order));
				} else {
					callback(null);
				}
			});
		},
		
		getOrders: function(user, callback) {
			console.log("[api] getting bookings for " + user);
			var request = new Request('/api/orders?id=' + user);
			fetch(request)
			.then(res => res.json())
			.then(json => {
				callback(json);
			});
		},
		
		getCurrentOrder: function(callback) {
			console.log("[api] getting current order");
			var request = new Request('/api/orders/now');
			fetch(request)
			.then(res => {
				if (res.status == 200) {
					res.json()
					.then(order => {
						addRestaurantDescription(order.restaurant);
						console.log(order);
						callback(order);
					})
				} else {
					console.log("No current booking");
				}
			});
		},
		
		endCurrentOrder: function(callback) {
			console.log("[server] end order");
			
			var headers = new Headers();
			headers.append("Content-Type", "application/json");
			
			var request = new Request('/api/orders/end');
			
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
