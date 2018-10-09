package model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class VehicleTest {

    private Vehicle vehicle;

    @BeforeEach
    void setUp() throws Exception {
	this.vehicle = new Vehicle("ABC123", "SomeMake", "Some Model", 2010, "Yellow", new Position(1, 1), 1,
		"average");
    }

    // test to make sure vehicle is added properly
    @Test
    void testGetDescription() {
	String expected = "SomeMake Some Model (2010)";
	assertEquals(expected, this.vehicle.getDescription());
    }

    @Test
    void testColour() {
	String expected = "Yellow";
	assertEquals(expected, this.vehicle.getColour());
    }

    @Test
    void testPositionLat() {
	Position pos = new Position(1, 1);
	double lat = pos.getLat();
	assertEquals(lat, this.vehicle.getPosition().getLat());
    }

    @Test
    void testPositionLng() {
	Position pos = new Position(1, 1);
	double lng = pos.getLng();
	assertEquals(lng, this.vehicle.getPosition().getLng());
    }

}
