package model;

import java.io.Closeable;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.appengine.api.utils.SystemProperty;

import util.Config;
import util.Util;

public class Database implements Closeable {

    final static Logger logger = LoggerFactory.getLogger(Database.class);

    private Connection conn;

    /**
     * Create a database object with an underlying {@link java.sql.Connection}
     * object. This constructor will return a connection to the local development
     * database when run locally, or a connection to the Cloud SQL database when
     * deployed.
     *
     * @throws SQLException
     */
    public Database() {
	try {
	    if (SystemProperty.environment.value() == SystemProperty.Environment.Value.Production) {
		String instance = Config.get("cloudSqlInstance");
		String database = Config.get("cloudSqlDatabase");
		String username = Config.get("cloudSqlUsername");
		String password = Config.get("cloudSqlPassword");

		String url = "jdbc:mysql://google/" + database + "?useSSL=false&cloudSqlInstance=" + instance
			+ "&socketFactory=com.google.cloud.sql.mysql.SocketFactory" + "&user=" + username + "&password="
			+ password;

		logger.info("Connecting to production database");
		this.conn = DriverManager.getConnection(url);
	    } else {
		// this fixes an issue with AppEngine Dev Server hot reloads
		Class.forName("com.mysql.jdbc.Driver");
		String database = Config.get("localSqlDatabase");
		String username = Config.get("localSqlUsername");
		String password = Config.get("localSqlPassword");
		String url = "jdbc:mysql://localhost:3306/" + database + "?useSSL=false"
			+ "&serverTimezone=Australia/Melbourne";
		logger.info("Connecting to development database: " + url);
		this.conn = DriverManager.getConnection(url, username, password);
	    }

	    // initialize database
	    initDatabase();
	} catch (Exception e) {
	    // shutdown immediately in the case of an SQL error
	    logger.error(e.getMessage());
	    System.exit(1);
	}
    }

    /**
     * Initialize the database with the required tables
     *
     * @throws SQLException
     */
    private void initDatabase() throws SQLException {
	logger.info("Initializing the database");

	// set tz on production db
	if (SystemProperty.environment.value() == SystemProperty.Environment.Value.Production) {
	    try (Statement tzStmt = this.conn.createStatement()) {
		tzStmt.execute("set time_zone = 'Australia/Melbourne'");
	    }
	}

	// Creates table for restaurants
	String restaurantsSql = "CREATE TABLE IF NOT EXISTS `restaurants` (`store_id` VARCHAR(50) NOT NULL, "
		+ "`store_name` VARCHAR(50) NOT NULL, " + "`manager` VARCHAR(50) NOT NULL, "
		+ "`phone` VARCHAR(50) NOT NULL, " + "`location` POINT NOT NULL, " + "PRIMARY KEY (`store_id`))";

	String ordersSql = "CREATE TABLE IF NOT EXISTS `orders` (" + "`id` INT NOT NULL AUTO_INCREMENT, "
		+ "`timestamp` DATETIME NOT NULL, " + "`store_id` VARCHAR(50) NOT NULL, "
		+ "`customer_id` VARCHAR(50) NOT NULL, " + "`duration` SMALLINT UNSIGNED NOT NULL, "
		+ "`item` VARCHAR(50) NOT NULL, " + "PRIMARY KEY (`id`), "
		+ "FOREIGN KEY (`store_id`) REFERENCES `restaurants`(`store_id`))";

	String users = "CREATE TABLE IF NOT EXISTS `users` (`cid` VARCHAR(50) NOT NULL, "
		+ "`email` VARCHAR(50) NOT NULL, " + "PRIMARY KEY (`cid`))";

	Statement stmt = this.conn.createStatement();
	stmt.execute(restaurantsSql);
	stmt.execute(ordersSql);
	stmt.execute(users);

	stmt.close();

	try (Statement timeStmt = this.conn.createStatement()) {
	    ResultSet rs = timeStmt.executeQuery("select now()");
	    if (rs.next()) {
		logger.warn("SQL Server time: " + rs.getString(1));
	    } else {
		logger.warn("SQL Server time is unknown");
	    }
	}
    }

    /**
     * Close the underlying database connection
     *
     * @throws SQLException
     */
    @Override
    public void close() {
	try {
	    logger.info("Closing the database");
	    this.conn.close();
	} catch (SQLException e) {
	    logger.error("Failed to close DB");
	    logger.error(e.getMessage());
	}
    }

    /**
     * GET restaurants
     */
    public List<Restaurant> getRestaurants() {
	List<Restaurant> restaurants = new ArrayList<Restaurant>();
	try {
	    Statement stmt = this.conn.createStatement();
	    ResultSet rs = stmt
		    .executeQuery("SELECT `store_id`, `store_name`, `manager`, `phone`, `location` FROM `restaurants`");
	    while (rs.next()) {
		String store_id = rs.getString("store_id");
		String store_name = rs.getString("store_name");
		String manager = rs.getString("manager");
		String phone = rs.getString("phone");

		// construct the object
		Location location = getRestaurantLocation(store_id);
		Restaurant restaurant = new Restaurant(store_id, store_name, manager, phone, location);
		restaurants.add(restaurant);
	    }

	    return restaurants;

	} catch (SQLException e) {
	    logger.error(e.getMessage());
	    // return an empty list in case of an error
	    return new ArrayList<Restaurant>();
	}
    }

    public Location getRestaurantLocation(String store_id) {
	LocalDateTime now = Util.getCurrentTime();
	try {

	    String query = "SELECT ST_X(location) as lat, ST_Y(location) as lng FROM restaurants WHERE store_id = ? "
		    + "LIMIT 1";
	    PreparedStatement ps = this.conn.prepareStatement(query);

	    ps.setString(1, store_id);

	    ResultSet rs = ps.executeQuery();

	    rs.next();
	    double lat = rs.getDouble("lat");
	    double lng = rs.getDouble("lng");
	    Location restaurantLocation = new Location(lat, lng);
	    ps.close();
	    rs.close();
	    return restaurantLocation;

	} catch (SQLException e) {
	    // TODO Auto-generated catch block
	    e.printStackTrace();
	    return null;
	}
    }

    /**
     * Returns a list of vehicle objects
     */

    public List<Restaurant> getAvailableRestaurants() {
	List<Restaurant> restaruants = new ArrayList<Restaurant>();
	try {
	    Statement stmt = this.conn.createStatement();
	    ResultSet rs = stmt
		    .executeQuery("SELECT `store_id`, `store_name`, `manager`, `phone` " + "FROM `restaurants`");
	    while (rs.next()) {
		String store_id = rs.getString("store_id");
		String store_name = rs.getString("store_name");
		String manager = rs.getString("manager");
		String phone = rs.getString("phone");
		// construct the object
		Location location = getRestaurantLocation(store_id);
		Restaurant restaruant = new Restaurant(store_id, store_name, manager, phone, location);
		restaruants.add(restaruant);
	    }
	    return restaruants;
	} catch (SQLException e) {
	    logger.error(e.getMessage());
	    // return an empty list in case of an error
	    return new ArrayList<Restaurant>();
	}
    }

    /**
     * Returns a list of nearby vehicles to the given position
     */
    public List<NearbyRestaurants> getNearbyRestaurants(Location location) {
	List<NearbyRestaurants> nearRestaurants = new ArrayList<NearbyRestaurants>();
	List<NearbyRestaurants> sortedNearestRestaurants = new ArrayList<NearbyRestaurants>();
	List<Restaurant> restaurants = new ArrayList<Restaurant>();
	restaurants = getAvailableRestaurants();

	for (int i = 0; i < restaurants.size(); i++) {
	    String store_id = restaurants.get(i).getStoreid();
	    String store_name = restaurants.get(i).getStorename();
	    String manager = restaurants.get(i).getManager();
	    String phone = restaurants.get(i).getPhone();
	    Location positionC = restaurants.get(i).getLocation();

	    double distance = Util.distance(location.getLat(), location.getLng(), positionC.getLat(),
		    positionC.getLng());

	    NearbyRestaurants nR = new NearbyRestaurants(store_id, store_name, manager, phone, positionC, distance);
	    nearRestaurants.add(nR);
	}

	boolean done = true;
	while (done == true) {
	    NearbyRestaurants closestRestaurant = null;
	    double closestDist = 0;

	    if (nearRestaurants.size() == 0) {
		done = false;
	    } else {
		for (int i = 0; i < nearRestaurants.size(); i++) {

		    if (i == 0) {
			closestDist = nearRestaurants.get(i).getDistance();
			closestRestaurant = nearRestaurants.get(i);

		    } else {

			if (nearRestaurants.get(i).getDistance() < closestDist) {

			    closestDist = nearRestaurants.get(i).getDistance();
			    closestRestaurant = nearRestaurants.get(i);
			}
		    }
		}

		sortedNearestRestaurants.add(closestRestaurant);
		nearRestaurants.remove(closestRestaurant);
	    }

	}
	return sortedNearestRestaurants;
    }

    public void endOrder(String clientId) {
	try {
	    Order currentOrder = getOrderNow(clientId);

	    if (currentOrder != null) {
		LocalDateTime start = currentOrder.getTimestamp();
		LocalDateTime current = Util.getCurrentTime();
		int newDuration = (int) Math.ceil(Duration.between(start, current).toMinutes());

		// update the booking record
		String update = "update `orders` set `duration` = ? where `id` = ?";
		PreparedStatement ps = this.conn.prepareStatement(update);
		ps.setInt(1, newDuration);
		ps.setInt(2, currentOrder.getId());
		logger.info("Setting duration of booking " + currentOrder.getId() + " to " + newDuration);

		ps.execute();

	    }
	} catch (SQLException e) {
	    logger.error(e.getMessage());
	    e.printStackTrace();
	}
    }

    public List<Order> getOrdersOfUser(String clientId) {
	logger.info("Get Orders for " + clientId);
	List<Order> orders = new ArrayList<Order>();

	try {
	    String sql = "SELECT od.duration, od.id, od.timestamp, od.customer_id, od.store_id, od.item, rt.store_id, rt.store_name, rt.manager, rt.phone "
		    + "FROM orders as od LEFT JOIN restaurants as rt ON od.store_id=rt.store_id "
		    + "WHERE od.customer_id = ? AND date_add(od.timestamp, interval od.duration minute) < now() "
		    + "ORDER by timestamp DESC";
	    PreparedStatement stmt = this.conn.prepareStatement(sql);
	    stmt.setString(1, clientId);
	    ResultSet rs = stmt.executeQuery();
	    while (rs.next()) {
		int id = rs.getInt("id");
		LocalDateTime timestamp = rs.getTimestamp("timestamp").toLocalDateTime();
		String customer_id = rs.getString("customer_id");

		String store_id = rs.getString("store_id");
		String store_name = rs.getString("store_name");
		String manager = rs.getString("manager");
		String phone = rs.getString("phone");
		int duration = rs.getInt("duration");
		String item = rs.getString("item");
		Location location = getRestaurantLocation(store_id);

		Restaurant restaurant = new Restaurant(store_id, store_name, manager, phone, location);
		Order order = new Order(id, timestamp, restaurant, customer_id, duration, item);
		orders.add(order);
	    }
	    return orders;
	} catch (SQLException e) {
	    logger.error(e.getMessage());
	    // return an empty list in case of an error
	    return new ArrayList<Order>();
	}
    }

    /**
     * Creates a Order, writes it to the database & returns the booking object
     *
     * @throws SQLException
     */
    public Order createOrder(LocalDateTime timestamp, String store_id, String customerId, int duration, String item) {
	logger.info("Create Orders for " + customerId);
	try {

	    String query = "INSERT INTO orders " + "(timestamp, store_id, customer_id, duration, item) VALUES "
		    + "(?, ?, ?, ?,?)";

	    PreparedStatement pStmnt = this.conn.prepareStatement(query, Statement.RETURN_GENERATED_KEYS);

	    pStmnt.setTimestamp(1, Timestamp.valueOf(timestamp));
	    pStmnt.setString(2, store_id);
	    pStmnt.setString(3, customerId);
	    pStmnt.setInt(4, duration);
	    pStmnt.setString(5, item);

	    pStmnt.executeUpdate();

	    Location startLocation = getRestaurantLocation(store_id);
	    // get the inserted booking's ID
	    ResultSet rs = pStmnt.getGeneratedKeys();
	    if (rs.next()) {
		int id = rs.getInt(1);

		pStmnt.close();

		// Vehicle vehicle = getVehicleByReg(registration);
		Restaurant restaurant = getRestaurantById(store_id);
		logger.info("Successfully created an order.");

		// initial cost always 0. - Only when booking ends does
		// the cost gets
		// calculated.
		return new Order(id, timestamp, restaurant, customerId, duration, item);

	    }

	} catch (SQLException e) {
	    // TODO Auto-generated catch block
	    e.printStackTrace();
	}

	// TODO: throw a custom exception on failure?
	return null;
    }

    public Restaurant getRestaurantById(String store_id) {
	logger.info("Getting Restaurant by id: " + store_id);
	Restaurant restaurant = null;
	Location location;
	try {
	    String query = "SELECT store_id, store_name, manager, phone" + " FROM restaurants WHERE store_id LIKE ?";
	    PreparedStatement ps = this.conn.prepareStatement(query);

	    ps.setString(1, store_id);

	    ResultSet rs = ps.executeQuery();

	    if (rs.next()) {
		String storeid = rs.getString("store_id");
		String store_name = rs.getString("store_name");
		String manager = rs.getString("manager");
		String phone = rs.getString("phone");
		location = getRestaurantLocation("store_id");

		restaurant = new Restaurant(storeid, store_name, manager, phone, location);

	    }

	} catch (SQLException e) {
	    // TODO Auto-generated catch block
	    e.printStackTrace();
	}
	return restaurant;
    }

    public boolean hasDoubleOrder(LocalDateTime currtime, String cust_id) {
	logger.info("Has " + cust_id + "double ordered.");
	try {
	    // Gets the latest timestamp of a car booking.
	    String query = "SELECT timestamp,duration FROM orders WHERE customer_id = ? " + "ORDER BY id DESC LIMIT 1";
	    PreparedStatement ps = this.conn.prepareStatement(query);

	    ps.setString(1, cust_id);

	    ResultSet rs = ps.executeQuery();

	    if (rs.next()) {
		// Gets when the car is going to end.
		LocalDateTime orderTime = rs.getTimestamp("timestamp").toLocalDateTime();
		LocalDateTime endOrder = orderTime.plusMinutes(rs.getInt(2));

		if (currtime.isBefore(endOrder) || currtime.isEqual(endOrder)) {
		    logger.info("[Server] Error: " + cust_id + " has an order in place.");
		    rs.close();
		    ps.close();
		    return true; // It is double booked.
		}

	    }
	} catch (SQLException e) {
	    // TODO Auto-generated catch block
	    e.printStackTrace();
	}

	return false; // Not double Booked.
    }

    public Order getOrderNow(String clientId) throws SQLException {
	String query = "SELECT ord.id, ord.timestamp, ord.customer_id, ord.duration, ord.item, rst.store_id, rst.store_name, rst.manager, rst.phone "
		+ "FROM orders as ord left join restaurants as rst on ord.store_id = rst.store_id "
		+ "WHERE customer_id like ? and date_add(`timestamp`, interval `duration` minute) > now() ORDER BY ord.id limit 1;";

	PreparedStatement ps = this.conn.prepareStatement(query);

	ps.setString(1, clientId);

	ResultSet rs = ps.executeQuery();

	if (rs.next()) {
	    int id = rs.getInt("id");
	    LocalDateTime timestamp = rs.getTimestamp("timestamp").toLocalDateTime();
	    String customer_id = rs.getString("customer_id");

	    String store_id = rs.getString("store_id");
	    String store_name = rs.getString("store_name");
	    String manager = rs.getString("manager");
	    String phone = rs.getString("phone");
	    int duration = rs.getInt("duration");
	    String item = rs.getString("item");
	    Location location = getRestaurantLocation(store_id);

	    Restaurant restaurant = new Restaurant(store_id, store_name, manager, phone, location);

	    ps.close();
	    rs.close();

	    // cost is 0 atm
	    return new Order(id, timestamp, restaurant, customer_id, duration, item);
	} else {
	    return null;
	}
    }

    public void addUser(String cid, String email) throws SQLException {

	String sql = "SELECT cid FROM users WHERE cid LIKE ?";
	PreparedStatement stmt = this.conn.prepareStatement(sql);
	stmt.setString(1, cid);
	ResultSet rs = stmt.executeQuery();

	if (!rs.isBeforeFirst()) {
	    String query = "INSERT INTO users " + "(cid, email) VALUES (?, ?)";
	    PreparedStatement pStmnt = this.conn.prepareStatement(query);
	    pStmnt.setString(1, cid);
	    pStmnt.setString(2, email);
	    pStmnt.executeUpdate();
	    pStmnt.close();

	    logger.info("Adding to users database email: " + email);
	} else {
	    logger.info("Users table already has email: " + email);
	}

    }

    public boolean isAdmin(String clientId) {
	logger.info("Checking if user " + clientId + " is an admin");
	String query = "select 1 from `admins` where `admin_id` = ?";
	try (PreparedStatement ps = this.conn.prepareStatement(query)) {
	    ps.setString(1, clientId);
	    ResultSet rs = ps.executeQuery();
	    // if the query has any rows, the user is in the admin table
	    // next() will return false if there are no rows.
	    return rs.next();
	} catch (SQLException e) {
	    logger.error(e.getMessage());
	    return false;
	}
    }

    public String getCid(String email) throws SQLException {

	String cid = null;
	String sql = "SELECT cid FROM users WHERE email LIKE ?";
	PreparedStatement stmt = this.conn.prepareStatement(sql);
	stmt.setString(1, email);
	ResultSet rs = stmt.executeQuery();

	if (rs.next()) {
	    cid = rs.getString("cid");
	    System.out.println(cid);
	    logger.info("Client ID of user: " + cid);

	}
	stmt.close();
	rs.close();
	return cid;
    }

    public static long compareTwoTimeStamps(java.sql.Timestamp oldTime, java.sql.Timestamp currentTime) {
	long milliseconds1 = oldTime.getTime();
	long milliseconds2 = currentTime.getTime();

	long diff = milliseconds2 - milliseconds1;
	long diffMinutes = diff / (60 * 1000);

	return diffMinutes;
    }
}
