package filters;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import spark.servlet.SparkFilter;

// based on a fix for incorrect content types: https://github.com/perwendel/spark/issues/373
public class ApplicationFilter extends SparkFilter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
	    throws IOException, ServletException {
	String requestUrl = ((HttpServletRequest) request).getRequestURI().toString();

	Map<String, String> mimeMapping = new HashMap<>();
	mimeMapping.put(".css", "text/css");
	mimeMapping.put(".js", "text/javascript");
	mimeMapping.put(".svg", "image/svg+xml");
	mimeMapping.put(".png", "image/png");

	for (Map.Entry<String, String> entry : mimeMapping.entrySet()) {
	    if (requestUrl.endsWith(entry.getKey())) {
		((HttpServletResponse) response).setHeader("Content-Type", entry.getValue());
	    }
	}

	super.doFilter(request, response, chain);
    }

}
