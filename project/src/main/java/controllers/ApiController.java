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

import controllers.Request.BookingRequest;
import controllers.Request.ExtendBookingRequest;
import controllers.Request.OrderRequest;
import controllers.Request.PositionRequest;
import controllers.Response.ErrorResponse;
import model.Booking;
import model.Database;
import model.NearbyRestaurants;
import model.Order;
import model.Position;
import model.Restaurant;

public class ApiController {

    public ApiController() {

	final Logger logger = LoggerFactory.getLogger(ApiController.class);

	// log every API request
	before("/*", (req, res) -> logger.info("Client API Request: " + req.uri()));

	// returns a list of available vehicles
	get("/restaurants", (req, res) -> {
	    res.type("application/json");

	    Database db = new Database();
	    List<Restaurant> restaurants = db.getRestaurants();
	    db.close();

	    logger.info("Found " + restaurants.size() + " restaurants");
	    return new Gson().toJson(restaurants);
	});

	// returns a list of nearby vehicles, giving their distance to the
	// client
	post("/restaurants/nearby", (req, res) -> {
	    res.type("application/json");
	    Position pos;
	    try {
		// use the posted position to create a Position object
		PositionRequest pr = new Gson().fromJson(req.body(), PositionRequest.class);
		pos = new Position(pr.lat, pr.lng);
	    } catch (JsonParseException e) {
		logger.error(e.getMessage());
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Error parsing request"));
	    }
	    logger.info("Getting vehicles near " + pos);

	    Database db = new Database();
	    List<NearbyRestaurants> nearby = db.getNearbyRestaurants(pos);
	    db.close();

	    logger.info("Found " + nearby.size() + " nearby vehicles");
	    return new Gson().toJson(nearby);
	});

	// create a booking
	post("/bookings", (req, res) -> {
	    res.type("application/json");

	    String clientId = req.session().attribute("clientId");

	    // return unauthorized response if user not logged in
	    if (clientId == null) {
		res.status(401);
		return new Gson().toJson(new ErrorResponse("Please log in"));
	    }

	    BookingRequest br;
	    LocalDateTime dateTime;

	    try {
		br = new Gson().fromJson(req.body(), BookingRequest.class);

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
		dateTime = LocalDateTime.parse(br.timestamp, formatter);
	    } catch (JsonParseException e) {
		logger.error(e.getMessage());
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Error parsing request"));
	    }

	    logger.info("Inserting a booking!");
	    Database db = new Database();

	    boolean isBooked = db.isCarBooked(dateTime, br.registration);
	    if (isBooked == false) {

		int status = db.checkVehicleStatus(br.registration);

		if (status == 0) {
		    Booking booking = db.createBooking(dateTime, br.registration, clientId, br.duration);

		    db.close();
		    if (booking != null) {
			res.type("application/json");
			return new Gson().toJson(booking);
		    } else {
			res.status(400);
			return new Gson().toJson(new ErrorResponse("Bad Request"));
		    }
		} else {
		    db.close();
		    res.status(400);
		    return new Gson().toJson(new ErrorResponse("Bad Request"));
		}

	    } else {
		db.close();
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Bad Request"));
	    }
	});

	// create a booking
	post("/orders", (req, res) -> {
	    res.type("application/json");

	    String clientId = req.session().attribute("clientId");

	    // return unauthorized response if user not logged in
	    if (clientId == null) {
		res.status(401);
		return new Gson().toJson(new ErrorResponse("Please log in"));
	    }

	    OrderRequest oreq;
	    LocalDateTime curTime;
	    Order order = null;

	    try {
		oreq = new Gson().fromJson(req.body(), OrderRequest.class);

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
		curTime = LocalDateTime.parse(oreq.timestamp, formatter);
	    } catch (JsonParseException e) {
		logger.error(e.getMessage());
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Error parsing request"));
	    }

	    logger.info("Creating an order!");
	    Database db = new Database();
	    if (!db.hasDoubleOrder(curTime, clientId)) {
		order = db.createOrder(curTime, oreq.store_id, clientId, oreq.duration);
	    }

	    db.close();
	    if (order != null) {
		res.type("application/json");
		return new Gson().toJson(order);
	    } else {
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Bad Request"));
	    }

	});

	// returns a list of the logged in client's bookings
	get("/bookings", (req, res) -> {
	    res.type("application/json");
	    String clientId = req.session().attribute("clientId");

	    // return unauthorized response if user not logged in
	    if (clientId == null) {
		res.status(401);
		return new Gson().toJson(new ErrorResponse("Please log in"));
	    }

	    Database db = new Database();
	    List<Booking> bookings = db.getBookingsOfUser(clientId);
	    db.close();

	    logger.info("Found " + bookings.size() + " bookings of user " + clientId);

	    if (bookings.size() > 0) {
		res.type("application/json");
		return new Gson().toJson(bookings);
	    } else {
		// send "no-content" status
		res.status(204);
		return "";
	    }
	});

	get("/bookings/now", (req, res) -> {
	    String clientId = req.session().attribute("clientId");

	    // return unauthorized response if user not logged in
	    if (clientId == null) {
		res.status(401);
		return new Gson().toJson(new ErrorResponse("Please log in"));
	    }

	    Booking br;
	    Database db = new Database();

	    br = db.getBookingNow(clientId);
	    db.close();

	    if (br != null) {
		res.type("application/json");
		return new Gson().toJson(br);
	    } else {
		// send "no-content" status
		res.status(204);
		return "";
	    }
	});

	get("/orders/now", (req, res) -> {
	    String clientId = req.session().attribute("clientId");

	    // return unauthorized response if user not logged in
	    if (clientId == null) {
		res.status(401);
		return new Gson().toJson(new ErrorResponse("Please log in"));
	    }

	    Order or;
	    Database db = new Database();

	    or = db.getOrderNow(clientId);
	    db.close();

	    if (or != null) {
		res.type("application/json");
		return new Gson().toJson(or);
	    } else {
		// send "no-content" status
		res.status(204);
		return "";
	    }
	});

	// end the booking.
	get("/bookings/end", (req, res) -> {
	    res.type("application/json");
	    Booking br;

	    String clientId = req.session().attribute("clientId");
	    logger.info("Ending current booking of: " + clientId);

	    // return unauthorized response if user not logged in
	    if (clientId == null) {
		res.status(401);
		return new Gson().toJson(new ErrorResponse("Please log in"));
	    }

	    Database db = new Database();
	    br = db.endBooking(clientId);

	    if (br != null) {
		res.type("application/json");
		return new Gson().toJson(br);
	    } else {
		// send "no-content" status
		res.status(204);
		return "";
	    }

	});

	// extend a booking
	post("/bookings/extend", (req, res) -> {
	    res.type("application/json");

	    String clientId = req.session().attribute("clientId");

	    // return unauthorized response if user not logged in
	    if (clientId == null) {
		res.status(401);
		return new Gson().toJson(new ErrorResponse("Please log in"));
	    }

	    ExtendBookingRequest br;

	    try {
		br = new Gson().fromJson(req.body(), ExtendBookingRequest.class);

	    } catch (JsonParseException e) {
		logger.error(e.getMessage());
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Error parsing request"));
	    }

	    logger.info("Extending a booking!");
	    Database db = new Database();

	    if (db.extendBooking(clientId, br.extraDuration)) {
		res.status(200);
		db.close();
		return "";
	    } else {
		db.close();
		res.status(400);
		return new Gson().toJson(new ErrorResponse("Bad Request"));
	    }

	});

    }

}
