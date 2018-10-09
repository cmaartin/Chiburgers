package model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class NearbyTest {

    private NearbyVehicle nearby;

    @BeforeEach
    void setUp() throws Exception {
	this.nearby = new NearbyVehicle("ABC123", "SomeMake", "Some Model", 2010, "Yellow", new Position(1, 1), 1,
		"average", 100);
    }

    // test to make sure vehicle is added properly
    @Test
    void testDistance() {
	double distance = 100;
	assertEquals(distance, this.nearby.getDistance());
    }
}
