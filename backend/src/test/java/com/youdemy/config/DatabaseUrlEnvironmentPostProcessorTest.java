package com.youdemy.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class DatabaseUrlEnvironmentPostProcessorTest {

    private final DatabaseUrlEnvironmentPostProcessor processor = new DatabaseUrlEnvironmentPostProcessor();

    @Test
    void convertsPostgresConnectionStringAndExtractsCredentials() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url",
                        "postgresql://alice:p%40ssword@db.example.com:6432/app?sslmode=require");

        processor.postProcessEnvironment(environment, null);

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://db.example.com:6432/app?sslmode=require");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("alice");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("p@ssword");
    }

    @Test
    void convertsPostgresSchemeWithoutExplicitPort() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url",
                        "postgres://layerbase:secret@db.layerbase.dev/youdemy");

        processor.postProcessEnvironment(environment, null);

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://db.layerbase.dev:5432/youdemy");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("layerbase");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("secret");
    }

    @Test
    void explicitCredentialVariablesTakePrecedenceOverConnectionString() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("DATABASE_URL",
                        "postgresql://embedded:embedded-pass@db.example.com:5432/app?sslmode=require")
                .withProperty("DATABASE_USERNAME", "explicit")
                .withProperty("DATABASE_PASSWORD", "explicit-pass")
                .withProperty("spring.datasource.url",
                        "postgresql://embedded:embedded-pass@db.example.com:5432/app?sslmode=require")
                .withProperty("spring.datasource.username", "explicit")
                .withProperty("spring.datasource.password", "explicit-pass");

        processor.postProcessEnvironment(environment, null);

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://db.example.com:5432/app?sslmode=require");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("explicit");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("explicit-pass");
    }

    @Test
    void keepsJdbcUrlAndExistingCredentials() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url", "jdbc:postgresql://localhost:5432/youdemy")
                .withProperty("spring.datasource.username", "local")
                .withProperty("spring.datasource.password", "local-pass");

        processor.postProcessEnvironment(environment, null);

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://localhost:5432/youdemy");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("local");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("local-pass");
    }

    @Test
    void keepsH2LocalUrlUntouched() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url", "jdbc:h2:file:./data/youdemy;MODE=PostgreSQL")
                .withProperty("spring.datasource.username", "sa");

        processor.postProcessEnvironment(environment, null);

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:h2:file:./data/youdemy;MODE=PostgreSQL");
    }

    @Test
    void doesNotOverrideExplicitSpringDatasourceUrl() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("SPRING_DATASOURCE_URL", "jdbc:postgresql://explicit:5432/youdemy")
                .withProperty("spring.datasource.url", "postgresql://other:pass@db.example.com:5432/app");

        processor.postProcessEnvironment(environment, null);

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("postgresql://other:pass@db.example.com:5432/app");
    }

    @Test
    void rejectsConnectionStringWithoutDatabaseName() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url", "postgresql://user:pass@db.example.com:5432");

        assertThatThrownBy(() -> processor.postProcessEnvironment(environment, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("database name");
    }
}
