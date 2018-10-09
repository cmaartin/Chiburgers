package model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import util.Util;

public class FormulaTest {

    private Util util;

    @Test
    void testZeroDist() {
	Position sPos = new Position(1, 1);
	Position ePos = new Position(1, 1);
	double expected = 0;

	double result = this.util.distance(sPos.getLat(), sPos.getLng(), ePos.getLat(), ePos.getLng());
	assertEquals(expected, result);
    }

    @Test
    void testZeroDist2() {
	Position sPos = new Position(1211, 1211);
	Position ePos = new Position(1211, 1211);
	double expected = 0;

	double result = this.util.distance(sPos.getLat(), sPos.getLng(), ePos.getLat(), ePos.getLng());
	assertEquals(expected, result);
    }

    @Test
    public void testZeroFail() {
	try {
	    Position sPos = new Position(1, 1);
	    Position ePos = new Position(1, 100);
	    double expected = 0;

	    double result = this.util.distance(sPos.getLat(), sPos.getLng(), ePos.getLat(), ePos.getLng());
	    assertEquals(expected, result);
	} catch (AssertionError e) {
	    System.out.println("Test 2: " + e.getMessage());
	    // assert others
	}
    }

    @Test
    void testDist() {
	Position sPos = new Position(1, 1);
	Position ePos = new Position(1, 100);
	double expected = 11005;

	double result = this.util.distance(sPos.getLat(), sPos.getLng(), ePos.getLat(), ePos.getLng());

	int resultInt = (int) result;
	assertEquals(expected, resultInt);
    }
}
