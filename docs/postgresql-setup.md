# 🐘 PostgreSQL Setup Guide

## PostgreSQL Kurulumu

### Option 1: Docker ile (Önerilen - En Hızlı)

```bash
# PostgreSQL container'ı başlat
docker run --name tokenapp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tokenapp_db \
  -p 5432:5432 \
  -d postgres:15

# Container'ın çalışıp çalışmadığını kontrol et
docker ps | grep tokenapp-postgres

# Logs'ları gör
docker logs tokenapp-postgres
```

### Option 2: macOS (Homebrew)

```bash
# PostgreSQL'i yükle
brew install postgresql@15

# Servis başlat
brew services start postgresql@15

# Veritabanı oluştur
createdb -U postgres tokenapp_db

# Şifre ayarla (isteğe bağlı)
psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### Option 3: Windows (Installer)

1. https://www.postgresql.org/download/windows/ adresinden indir
2. Installer'ı çalıştır
3. Username: `postgres`
4. Password: `postgres`
5. Port: `5432`

### Option 4: Linux (apt)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Servis başlat
sudo service postgresql start

# Veritabanı oluştur
sudo -u postgres createdb tokenapp_db
```

---

## Veritabanı Kontrolü

### Command Line ile

```bash
# PostgreSQL'e bağlan
psql -U postgres

# Veya database direkt
psql -U postgres -d tokenapp_db

# Komutlar
\l              # Tüm veritabanlarını listele
\c tokenapp_db  # tokenapp_db'ye geç
\dt             # Tabloları listele
\q              # Çık
```

### Docker Container'ından

```bash
# Container'a gir
docker exec -it tokenapp-postgres psql -U postgres

# Komutlar (yukarda ile aynı)
```

---

## Spring Boot Konfigürasyonu

### application.properties

✅ **Zaten ayarlandı!**

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/tokenapp_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQL10Dialect
```

### pom.xml

✅ **Zaten güncellendi!**

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.7.2</version>
</dependency>
```

---

## Backend Başlat

```bash
# Dependencies yükle
mvn clean install

# Uygulamayı çalıştır
mvn spring-boot:run
```

✅ Başarılı? → `Application started` görmeli

---

## PostgreSQL vs MySQL Farkları

| Feature | PostgreSQL | MySQL |
|---------|-----------|-------|
| **ACID Support** | ✅ Tam | ✅ Tam |
| **JSON Support** | ✅ Gelişmiş | ✅ Basit |
| **Performance** | ✅ Büyük veri | ✅ Küçük veri |
| **Advanced Features** | ✅ Çok | ⚠️ Az |
| **Free** | ✅ Evet | ✅ Evet |
| **Enterprise Support** | ✅ Evet | ✅ Evet |

---

## Troubleshooting

### ❌ "Connection refused"

```bash
# PostgreSQL'in çalışıp çalışmadığını kontrol et
docker ps | grep postgres

# Veya (macOS)
brew services list | grep postgres

# Veya (Linux)
sudo service postgresql status
```

### ❌ "Database does not exist"

```bash
# Veritabanı oluştur
docker exec -it tokenapp-postgres \
  createdb -U postgres tokenapp_db

# Veya (Local)
createdb -U postgres tokenapp_db
```

### ❌ "Authentication failed"

```bash
# Username/password kontrol et
# application.properties'de şunları kontrol et:
spring.datasource.username=postgres
spring.datasource.password=postgres
```

### ❌ "Port 5432 already in use"

```bash
# Başka bir container/servis çalışıyor
# Option A: Port değiştir
# application.properties
spring.datasource.url=jdbc:postgresql://localhost:5433/tokenapp_db

# Option B: Eski container'ı kaldır
docker rm -f tokenapp-postgres

# Option C: Process'i öldür
lsof -i :5432
kill -9 <PID>
```

---

## Backup ve Restore

### Backup

```bash
# Container'dan
docker exec -it tokenapp-postgres \
  pg_dump -U postgres tokenapp_db > backup.sql

# Veya (Local)
pg_dump -U postgres tokenapp_db > backup.sql
```

### Restore

```bash
# Container'a
docker exec -it tokenapp-postgres \
  psql -U postgres tokenapp_db < backup.sql

# Veya (Local)
psql -U postgres tokenapp_db < backup.sql
```

---

## Performance Tips

```bash
# Docker memory limit
docker run ... -m 2g tokenapp-postgres

# PostgreSQL logs
docker logs -f tokenapp-postgres

# Database size
docker exec tokenapp-postgres \
  psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('tokenapp_db'));"
```

---

## Useful PostgreSQL Commands

```sql
-- Veritabanı listesi
\l

-- Tabloları listele
\dt

-- Tablo detayı
\d table_name

-- Veri say
SELECT COUNT(*) FROM users;

-- Tüm veriyi gör
SELECT * FROM users;

-- Tablo sil
DROP TABLE table_name;

-- Veritabanı sil
DROP DATABASE tokenapp_db;

-- User oluştur
CREATE USER newuser WITH PASSWORD 'password';

-- Permission ver
GRANT ALL PRIVILEGES ON DATABASE tokenapp_db TO newuser;
```

---

## Production Setup

Için `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: tokenapp_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - tokenapp_network

  backend:
    image: tokenapp:latest
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/tokenapp_db
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: secure_password
    depends_on:
      - postgres
    networks:
      - tokenapp_network

volumes:
  postgres_data:

networks:
  tokenapp_network:
```

Çalıştır:
```bash
docker-compose up -d
```

---

## Kontrol Listesi

- [ ] PostgreSQL kuruldu
- [ ] tokenapp_db oluşturuldu
- [ ] application.properties ayarlandı
- [ ] pom.xml güncellendi
- [ ] `mvn clean install` çalıştırıldı
- [ ] `mvn spring-boot:run` çalıştırıldı
- [ ] Register endpoint test edildi
- [ ] Database'de user oluştu

---

## Kaynaklar

- PostgreSQL Docs: https://www.postgresql.org/docs/
- JDBC Driver: https://jdbc.postgresql.org/
- Hibernate Dialect: https://hibernate.org/orm/documentation/
- Docker Hub: https://hub.docker.com/_/postgres

---

**PostgreSQL hazır! Backend'i başlatabilirsin! 🚀**

