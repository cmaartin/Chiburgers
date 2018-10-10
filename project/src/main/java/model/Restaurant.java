package model;

public class Restaurant {
    // id number
    private final String storeid;

    // e.g name: Chiburger "Location"
    // Chiburger Swanston , Chiburger North Melbourne
    private final String storename;
    // owner of branch
    private final String manager;

    // location of restaurant. geocoords
    private final Location location;
    // 0 - active; 1 - inactive; 2 - retired

    private final String phone;

    protected Restaurant(String storeid, String storename, String manager, String phone, Location location) {
	this.storeid = storeid;
	this.storename = storename;
	this.manager = manager;
	this.phone = phone;
	this.location = location;

    }

    public String getStorename() {
	return this.storename;
    }

    public String getPhone() {
	return this.phone;
    }

    public String getStoreid() {
	return this.storeid;
    }

    public String getManager() {
	return this.manager;
    }

    public Location getLocation() {
	return this.location;
    }

    /**
     * Returns the make, model & year as a single string
     */
    public String getDescription() {
	return String.format("%s %s (%d)", this.storeid, this.storename, this.manager);
    }

}
