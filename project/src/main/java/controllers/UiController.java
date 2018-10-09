package controllers;

import static spark.Spark.get;
import static spark.Spark.post;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.gson.Gson;

import controllers.Request.LoginRequest;
import model.Database;
import spark.Session;
import util.Util;

public class UiController {

    public UiController(String mapsApiKey, String googleClientId) {

	// create model with API keys
	Map<String, Object> model = new HashMap<>();
	model.put("mapsApiKey", mapsApiKey);
	model.put("googleClientId", googleClientId);

	final Logger logger = LoggerFactory.getLogger(UiController.class);

	post("/login", (req, res) -> {
	    LoginRequest loginRequest = new Gson().fromJson(req.body(), LoginRequest.class);
	    // set up session
	    if (req.session(false) == null || req.session().attribute("clientId") == null) {
		NetHttpTransport transport = new NetHttpTransport();
		JsonFactory jsonFactory = new JacksonFactory();

		if (loginRequest.id != null) {
		    GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
			    .setAudience(Collections.singletonList(googleClientId)).build();
		    GoogleIdToken idToken = verifier.verify(loginRequest.id);

		    if (idToken != null) {
			Database db = new Database();
			Payload payload = idToken.getPayload();

			// save details to session
			Session s = req.session(true);
			s.attribute("clientId", payload.getSubject());
			s.attribute("clientEmail", payload.getEmail());
			s.attribute("clientName", payload.get("name"));
			s.attribute("isAdmin", db.isAdmin(payload.getSubject()));

			logger.info(String.format("Client logged in: %s (%s)", s.attribute("clientName"),
				s.attribute("clientEmail")));
			logger.info("Client ID: " + s.attribute("clientId"));
			logger.info("Client is " + ((boolean) s.attribute("isAdmin") ? "" : "not ") + "an admin");

			String cid = s.attribute("clientId");
			String email = s.attribute("clientEmail");
			db.addUser(cid, email);

			res.status(200);
			db.close();
			return "";
		    } else {
			logger.info("Invalid ID token.");
		    }
		}
	    }
	    // if anything failed, send 400
	    res.status(400);
	    return "";
	});

	get("/logout", (req, res) -> {
	    if (req.session(false) != null) {
		String id = req.session().attribute("clientId");
		// destroy the session
		req.session().raw().invalidate();
		logger.info("Client logged out: " + id);
		res.status(200);
	    } else {
		res.status(400);
	    }
	    return "";
	});

	get("/", (req, res) -> {
	    Map<String, Object> m = new HashMap<>(model);
	    if (req.session(false) != null) {
		m.put("isAdmin", (boolean) req.session().attribute("isAdmin"));
	    }
	    return Util.render(m, "index");
	});

	get("/account", (req, res) -> {
	    Map<String, Object> m = new HashMap<>(model);
	    m.put("name", req.session().attribute("clientName"));
	    return Util.render(m, "account");
	});

    }

}
