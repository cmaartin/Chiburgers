insert ignore into `restaurants`
	(`store_id`, `store_name`, `manager`, `phone`, `location`, `timestamp`)
values
    ("CHI1","Chiburgers CBD EAST", "Martin", "0434343443", POINT(-37.808401, 144.956159), "2000-01-01 00:00:00"),
    ("CHI2","Chiburgers CBD WEST", "Aaron", "0434343322", POINT(-37.809741, 144.970895), "2000-01-01 00:00:00"),
    ("CHI3","Chiburgers CBD SOUTH", "TBD", "0434343322", POINT(-37.805819, 144.960025), "2000-01-01 00:00:00");
    
