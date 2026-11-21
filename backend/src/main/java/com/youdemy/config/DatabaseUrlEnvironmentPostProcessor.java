package com.youdemy.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Accepts either a JDBC URL or a standard PostgreSQL connection string in
 * {@code DATABASE_URL}, so hosting providers such as Layerbase can be pasted
 * in directly. Credentials embedded in the connection string are used when
 * separate DATABASE_USERNAME/DATABASE_PASSWORD values are not supplied.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    public static final String PROPERTY_SOURCE_NAME = "databaseUrlConversion";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (environment.getProperty("SPRING_DATASOURCE_URL") != null) {
            return;
        }

        String configuredUrl = environment.getProperty("spring.datasource.url");
        if (configuredUrl == null) {
            return;
        }

        String url = configuredUrl.trim();
        String lower = url.toLowerCase(Locale.ROOT);
        if (!lower.startsWith("postgres://") && !lower.startsWith("postgresql://")) {
            return;
        }

        URI uri;
        try {
            uri = URI.create(url);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("DATABASE_URL is not a valid PostgreSQL connection string", ex);
        }

        String host = uri.getHost();
        String path = uri.getRawPath();
        if (host == null || host.isBlank() || path == null || path.isBlank() || "/".equals(path)) {
            throw new IllegalArgumentException(
                    "DATABASE_URL must include a host and database name, for example "
                            + "postgresql://user:password@host:5432/app?sslmode=require");
        }

        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String query = uri.getRawQuery();
        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                .append(host)
                .append(':')
                .append(port)
                .append(path);
        if (query != null && !query.isBlank()) {
            jdbcUrl.append('?').append(query);
        }

        Map<String, Object> converted = new HashMap<>();
        converted.put("spring.datasource.url", jdbcUrl.toString());

        String userInfo = uri.getRawUserInfo();
        if (userInfo != null && !userInfo.isBlank()) {
            int separator = userInfo.indexOf(':');
            String username = separator >= 0 ? userInfo.substring(0, separator) : userInfo;
            if (!username.isBlank() && environment.getProperty("DATABASE_USERNAME") == null) {
                converted.put("spring.datasource.username", decode(username));
            }
            if (separator >= 0) {
                String password = userInfo.substring(separator + 1);
                if (!password.isBlank() && environment.getProperty("DATABASE_PASSWORD") == null) {
                    converted.put("spring.datasource.password", decode(password));
                }
            }
        }

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, converted));
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
