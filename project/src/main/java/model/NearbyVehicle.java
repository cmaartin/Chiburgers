package model;

public class NearbyVehicle extends Vehicle {

    private final double distance;

    protected NearbyVehicle(String registration, String make, String model, int year, String colour, Position position,
	    int available, String type, double distance) {
	super(registration, make, model, year, colour, position, available, type);
	this.distance = distance;
    }

    public double getDistance() {
	return this.distance;
    }

}
