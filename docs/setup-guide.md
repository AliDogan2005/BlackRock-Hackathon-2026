# 🚀 Backend Setup - Kurulum Rehberi

## Ön Koşullar

- Java 17+ (JDK)
- Maven 3.8+
- MySQL 8.0+
- Git
- IDE (IntelliJ IDEA, Eclipse veya VS Code)

---

## Adım 1: Proje Klonlama

```bash
cd /Users/alidogan/Projects/Hackathon/HackathonProject
git clone <repo-url>
cd HackathonProject/backend-springboot
```

---

## Adım 2: Maven Dependencies İndir

```bash
mvn clean install
```

Eğer hata alırsan:
```bash
mvn clean install -DskipTests
```

---

## Adım 3: MySQL Setup

### Option A: MySQL CLI
```bash
# MySQL'i başlat
mysql -u root -p

# Veritabanı oluştur
CREATE DATABASE tokenapp_db;
USE tokenapp_db;

# Otomatik table creation için Hibernate izin ver (application.properties'de ddl-auto=update)
```

### Option B: Docker ile (Recommended)
```bash
# Docker container'ı başlat
docker run --name mysql-tokenapp \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=tokenapp_db \
  -p 3306:3306 \
  -d mysql:8.0

# Kontrol et
docker ps
```

---

## Adım 4: application.properties Konfigürasyonu

`src/main/resources/application.properties` dosyasını açıp:

```properties
# Server
server.port=8080
server.servlet.context-path=/api

# MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/tokenapp_db
spring.datasource.username=root
spring.datasource.password=root  # Docker'da "root", Local'de kendi şifresi
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# JWT
jwt.secret=your_very_long_secret_key_that_is_at_least_256_bits_long_for_security_purposes_please_change_this
jwt.expiration=86400000  # 24 saatlik expiration

# Logging
logging.level.root=INFO
logging.level.com.tokenapp=DEBUG
```

---

## Adım 5: Proje Çalıştırma

### Option A: IDE'den
IntelliJ IDEA'da:
1. Project açınız
2. `TokenAppApplication.java` bulun
3. Green play button'a basın
4. Application başlamalı

### Option B: Maven ile Terminal'den
```bash
cd backend-springboot
mvn spring-boot:run
```

### Option C: JAR ile
```bash
mvn clean package
java -jar target/HackathonProject-0.0.1-SNAPSHOT.jar
```

---

## Adım 6: Proje Kontrol Etme

### Health Check
```bash
curl http://localhost:8080/api
```

Eğer 404 alırsan sorun yok, uygulama çalışıyor demektir.

### Basit Register Test
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "passwordConfirm": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "userId": 1,
  "username": "testuser",
  "email": "test@example.com",
  "message": "User registered successfully"
}
```

---

## Sık Sorunlar ve Çözümleri

### ❌ "Connection refused" - MySQL error
**Çözüm:**
```bash
# MySQL'in çalışıp çalışmadığını kontrol et
mysql -u root -p

# Eğer hata alırsan MySQL'i başlat
# macOS:
brew services start mysql

# Windows:
mysqld --install
net start MySQL80

# Linux:
sudo service mysql start
```

### ❌ "Cannot find symbol: com.tokenapp.*"
**Çözüm:**
```bash
# Clean and rebuild
mvn clean install
```

### ❌ "Port 8080 already in use"
**Çözüm:**
```bash
# application.properties'de port'u değiştir
server.port=8081

# Veya process'i öldür (macOS/Linux)
lsof -i :8080
kill -9 <PID>
```

### ❌ "JWT Secret too short"
**Çözüm:**
`application.properties`'de `jwt.secret`'ı en az 256 bit olacak şekilde güncelleyin.

---

## IDE Setup (IntelliJ IDEA)

1. **Project açma:**
   - File → Open → `backend-springboot` seçin

2. **SDK seç:**
   - File → Project Structure → Project
   - SDK'yı Java 17+ seç

3. **Maven yapılandır:**
   - File → Settings → Build Tools → Maven
   - Maven home directory'yi seç

4. **Run Configuration:**
   - Run → Edit Configurations
   - New → Spring Boot seç
   - Main class: `com.tokenapp.TokenAppApplication`
   - Environment variables: MySQL credentials

---

## Gradle Yapısı (Opsiyonel)

Maven yerine Gradle kullanmak istersen:

```bash
# Gradle Wrapper ile çalıştır
./gradlew bootRun
```

---

## Database Seed Scripti (Test Verileri)

`src/main/resources/data.sql` dosyasını oluştur:

```sql
-- Test Share'ler
INSERT INTO shares (name, description, total_tokens, current_value, is_active, created_at, updated_at) 
VALUES 
('Apple Inc.', 'Apple hissesi', 1000000, 150.50, true, NOW(), NOW()),
('Microsoft Corp.', 'Microsoft hissesi', 1000000, 380.00, true, NOW(), NOW()),
('Google LLC.', 'Google hissesi', 1000000, 140.30, true, NOW(), NOW());

-- Test User (sadece test için)
INSERT INTO users (username, email, password, first_name, last_name, is_active, created_at, updated_at)
VALUES ('testuser', 'test@example.com', '$2a$10$...', 'Test', 'User', true, NOW(), NOW());
```

`application.properties`'ye ekle:
```properties
spring.sql.init.mode=always
spring.sql.init.data-locations=classpath:data.sql
```

---

## Sonraki Adımlar

- [ ] Database'e seed data yükle
- [ ] Postman'de tüm endpoint'leri test et
- [ ] Frontend ile entegrasyon başlat
- [ ] Error handling test et
- [ ] Security test et

---

## Terminal Komutları (Cheat Sheet)

```bash
# Maven build
mvn clean install

# Spring Boot çalıştır
mvn spring-boot:run

# Test çalıştır
mvn test

# Belirli class'ın testini çalıştır
mvn test -Dtest=UserRepositoryTest

# Dependency tree göster
mvn dependency:tree

# Fat JAR oluştur
mvn clean package

# MySQL'e connect (Command Line)
mysql -h localhost -u root -p tokenapp_db

# Database'i dump et
mysqldump -u root -p tokenapp_db > backup.sql

# Backup'ı restore et
mysql -u root -p tokenapp_db < backup.sql
```

---

## Port Forwarding (Production)

Eğer uygulamayı başka makine'den erişilebilir yapacaksan:

```bash
# SSH tunnel (secure)
ssh -L 8080:localhost:8080 user@server.com

# Veya application.properties'de:
server.address=0.0.0.0
```

---

## Logging Ayarları

Daha detaylı logging için `application.properties`:

```properties
# Debug mode
logging.level.root=INFO
logging.level.com.tokenapp=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE

# Log file'a yaz
logging.file.name=logs/application.log
logging.file.max-size=10MB
logging.file.max-history=10
```

---

## Performance Tuning

```properties
# Connection Pool
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5

# JPA/Hibernate
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true

# Web
server.tomcat.threads.max=200
server.tomcat.threads.min-spare=10
```

---

## Docker ile Deploy (Advanced)

```dockerfile
# Dockerfile
FROM openjdk:17-jdk-slim
COPY target/HackathonProject-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

```bash
# Build ve run
docker build -t tokenapp:latest .
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/tokenapp_db \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e SPRING_DATASOURCE_PASSWORD=root \
  tokenapp:latest
```

---

## Kontrol Listesi ✅

- [ ] Java 17+ yüklü
- [ ] Maven yüklü
- [ ] MySQL çalışıyor
- [ ] Repo clone edildi
- [ ] application.properties configured
- [ ] Dependencies indirildi (mvn clean install)
- [ ] Uygulama başlatıldı
- [ ] Health check geçti
- [ ] Register endpoint'i test edildi
- [ ] Database'de user oluştu

---

## Yardım ve Destek

Sorun olursa:
1. Logs'u kontrol et: `http://localhost:8080/api` (404 normal)
2. Database bağlantısını kontrol et: MySQL console'da `SHOW DATABASES;`
3. Exception message'ini kopyala ve Google'la
4. Stack Overflow'de sor (Tag: spring-boot, mysql, java)

Good luck! 🎉

