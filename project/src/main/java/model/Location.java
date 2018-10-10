package model;

public class Location {

    private final double lat;
    private final double lng;

    public Location(double lat, double lng) {
	this.lat = lat;
	this.lng = lng;
    }

    public double getLat() {
	return this.lat;
    }

    public double getLng() {
	return this.lng;
    }

    @Override
    public String toString() {
	return String.format("(%f, %f)", this.lat, this.lng);
    }

}
