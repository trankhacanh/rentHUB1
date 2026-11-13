package com.renthub.security.config;

import com.renthub.security.jwt.AuthTokenFilter;
import com.renthub.security.services.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.renthub.security.RestAuthenticationEntryPoint;
import com.renthub.security.RestAccessDeniedHandler;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

import com.renthub.security.ratelimit.RateLimitFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.DispatcherType;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final RateLimitFilter rateLimitFilter;
    // ==============================
    // JWT FILTER
    // ==============================
    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    // ==============================
    // AUTHENTICATION PROVIDER
    // ==============================
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider authProvider =
                new DaoAuthenticationProvider(userDetailsService);

        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    // ==============================
    // AUTHENTICATION MANAGER
    // ==============================
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {

        return authConfig.getAuthenticationManager();
    }

    // ==============================
    // PASSWORD ENCODER
    // ==============================
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ==============================
    // SECURITY FILTER CHAIN
    // ==============================
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http

            // REST API khÃ´ng sá»­ dá»¥ng CSRF
            .csrf(AbstractHttpConfigurer::disable)

            // Cho phÃ©p frontend React localhost:5173
            .cors(cors -> {})

            // JWT lÃ  stateless â†’ khÃ´ng táº¡o session
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )
            // Chuáº©n hÃ³a response khi chÆ°a xÃ¡c thá»±c
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(restAuthenticationEntryPoint)
                .accessDeniedHandler(restAccessDeniedHandler)
            )

            // Xá»­ lÃ½ lá»—i xÃ¡c thá»±c
            // ==============================
            // AUTHORIZATION RULES
            // ==============================
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(
                    DispatcherType.ASYNC,
                    DispatcherType.ERROR
                ).permitAll()
                .requestMatchers("/ws/**").permitAll()

                // ------------------------------
                // 1. LOGIN / REGISTER
                // ------------------------------
                // CÃ¡c endpoint cÃ´ng khai dÃ nh cho xÃ¡c thá»±c thÃ´ng thÆ°á»ng
                .requestMatchers(
                    "/api/auth/signin",
                    "/api/auth/signup",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password"
                ).permitAll()

                // Chá»‰ ADMIN hiá»‡n táº¡i má»›i Ä‘Æ°á»£c táº¡o tÃ i khoáº£n ADMIN má»›i
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/signup-admin"
                ).hasRole("ADMIN")
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/payments/momo/ipn"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/admin/**")
                .hasRole("ADMIN")


                // Nhá»¯ng endpoint xÃ¡c thá»±c khÃ¡c khÃ´ng máº·c Ä‘á»‹nh cÃ´ng khai
                .requestMatchers("/api/auth/**").authenticated()

                // ------------------------------
                // 2. PUBLIC EQUIPMENT APIs
                // ------------------------------
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/equipments"
                )
                .permitAll()

                // Chá»‰ ADMIN Ä‘Æ°á»£c quáº£n lÃ½ danh má»¥c thiáº¿t bá»‹
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/equipments/categories"
                ).hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/equipments/categories/**"
                ).hasRole("ADMIN")
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/payments/vnpay/return"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/equipments/categories/**"
                ).hasRole("ADMIN")

                // Admin quáº£n lÃ½ toÃ n bá»™ thiáº¿t bá»‹
                .requestMatchers(
                    "/api/equipments/admin/**"
                ).hasRole("ADMIN")
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/equipments/**"
                )
                .permitAll()
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/payments/admin/**"
                ).hasRole("ADMIN")
                // ------------------------------
                // 3. ACTUATOR / HEALTH CHECK
                // ------------------------------
                .requestMatchers("/actuator/**")
                .permitAll()
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/bookings/admin/**"
                ).hasRole("ADMIN")
                // ------------------------------
                // 4. EVERYTHING ELSE
                // ------------------------------
                .anyRequest()
                .authenticated()
            )

            // ==============================
            // JWT FILTER
            // ==============================
            .addFilterBefore(
    authenticationJwtTokenFilter(),
    UsernamePasswordAuthenticationFilter.class
)
.addFilterBefore(
    rateLimitFilter,
    AuthTokenFilter.class
);

        return http.build();
    }

    // ==============================
    // CORS CONFIGURATION
    // ==============================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:5173")
        );

        configuration.setAllowedMethods(
                List.of(
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "PATCH",
                    "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }

    @Bean
public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(
        RateLimitFilter rateLimitFilter
) {
    FilterRegistrationBean<RateLimitFilter> registration =
            new FilterRegistrationBean<>();

    registration.setFilter(rateLimitFilter);
    registration.setEnabled(false);

    return registration;
}

}
