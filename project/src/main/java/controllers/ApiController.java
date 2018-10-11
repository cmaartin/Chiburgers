package controllers;

import static spark.Spark.before;
import static spark.Spark.get;
import static spark.Spark.post;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;

import controllers.Request.LocationRequest;
import controllers.Request.OrderRequest;
import model.Database;
import model.Location;
import model.NearbyRestaurants;
import model.Order;
import model.Restaurant;

public class ApiController {

    public ApiController() {

	final Logger logger = LoggerFactory.getLogger(ApiController.class);

	// log every API request
	before("/*", (req, res) -> logger.info("Client API Request: " + req.uri()));

	/*
	 *
	 * RETURNS LIST OF RESTAURANTS
	 *
	 */
	get("/restaurants", (req, res) -> {
	    res.type("application/json");

	    Database database = new Database();
	    List<Restaurant> restaurants = database.getRestaurants();
	    database.close();

	    return new Gson().toJson(restaurants);
	});

	/*
	 *
	 * GRABS NEARBY RESTAURANTS
	 *
	 */

	post("/restaurants/nearby", (req, res) -> {
	    res.type("application/json");
	    Location pos;
	    try {

		LocationRequest pr = new Gson().fromJson(req.body(), LocationRequest.class);
		pos = new Location(pr.lat, pr.lng);
	    } catch (JsonParseException e) {
		return new Gson().toJson(new Error("Parsing Error"));
	    }

	    Database database = new Database();
	    List<NearbyRestaurants> nearby = database.getNearbyRestaurants(pos);
	    database.close();

	    return new Gson().toJson(nearby);
	});

	/*
	 *
	 * CREATES AN ORDER FOR THE USER RETURNS NULL FOR ERROR CHECKING
	 */
	post("/orders", (req, res) -> {
	    res.type("application/json");

	    Order order = null;
	    OrderRequest oreq;
	    LocalDateTime curTime;

	    String clientId = req.session().attribute("clientId");

	    // return unauthorized response if user not logged in
	    if (clientId == null) {

		return new Gson().toJson(new Error("Not Logged In"));
	    }

	    try {
		oreq = new Gson().fromJson(req.body(), OrderRequest.class);

		DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
		curTime = LocalDateTime.parse(oreq.timestamp, dateFormat);
	    } catch (JsonParseException e) {

		return new Gson().toJson(new Error("Error parsing request"));
	    }

	    Database database = new Database();
	    if (!database.hasDoubleOrder(curTime, clientId)) {
		order = database.createOrder(curTime, oreq.store_id, clientId, oreq.duration, oreq.item);
	    }

	    database.close();
	    if (order != null) {
		res.type("application/json");
		return new Gson().toJson(order);
	    } else {
		return new Gson().toJson(new Error("Error"));
	    }

	});

	/*
	 *
	 * GETS BOOKINGS FOR ALL USERS , to show in "Account" for past bookings RETURNS
	 * NULL FOR ERROR CHECKING
	 */
	get("/orders", (req, res) -> {
	    res.type("application/json");
	    String clientId = req.session().attribute("clientId");

	    // return unauthorized response if user not logged in
	    if (clientId == null) {
		return new Gson().toJson(new Error("Not Logged In"));
	    }

	    Database database = new Database();
	    List<Order> orders = database.getOrdersOfUser(clientId);
	    database.close();

	    logger.info("Found " + orders.size() + " bookings of user " + clientId);

	    if (orders.size() > 0) {
		res.type("application/json");
		return new Gson().toJson(orders);
	    } else {
		res.status(204);
		return "";
	    }
	});

	/*
	 *
	 * GETS THE CURRENT ORDER FOR THE USER
	 *
	 */
	get("/orders/now", (req, res) -> {
	    String clientId = req.session().attribute("clientId");

	    if (clientId == null) {

		return new Gson().toJson(new Error("Not Logged In"));
	    }

	    Order or;
	    Database database = new Database();

	    or = database.getOrderNow(clientId);
	    database.close();

	    if (or != null) {
		res.type("application/json");
		return new Gson().toJson(or);
	    } else {
		res.status(204);
		return "";
	    }
	});

	/*
	 *
	 * ALLOWS USER TO END THE RODER RETURNS NULL FOR ERROR CHECKING
	 */
	get("/orders/end", (req, res) -> {
	    res.type("application/json");
	    Order or;

	    String clientId = req.session().attribute("clientId");
	    logger.info("Ending current booking of: " + clientId);

	    if (clientId == null) {
		return new Gson().toJson(new Error("Not Logged In"));
	    }

	    Database database = new Database();
	    database.endOrder(clientId);
	    return "";
	});

    }

}
