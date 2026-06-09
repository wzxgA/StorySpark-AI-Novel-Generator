package com.storyspark.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Bean
    public HikariDataSource dataSource() {
        String path = datasourceUrl.replace("jdbc:sqlite:", "");
        File parentDir = new File(path).getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(datasourceUrl);
        ds.setDriverClassName("org.sqlite.JDBC");
        return ds;
    }
}
