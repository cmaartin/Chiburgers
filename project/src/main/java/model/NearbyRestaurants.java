package model;

public class NearbyRestaurants extends Restaurant {
    private final double distance;

    protected NearbyRestaurants(String storeid, String storename, String manager, String phone, Position location,
	    double distance) {
	super(storeid, storename, manager, phone, location);
	this.distance = distance;
    }

    public double getDistance() {
	return this.distance;
    }

}
