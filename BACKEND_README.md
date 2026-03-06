# 📱 Token App - Tokenizasyon Platformu

> **Hisse parçaları alıp satarak gerçek varlıklara yatırım yapan blockchain tabanlı platform**

---

## 🎯 Proje Özeti

Token App, kullanıcıların **gerçek şirket hisselerine (veya varlıklara) küçük parçalar halinde yatırım yapabilmesini** sağlayan modern bir uygulamadır.

### Temel Konsept
```
📈 Apple Hissesi (10 Milyon $)
    ↓ Tokenize Et
💎 1.000.000 Token (Her biri 10$)
    ↓ Kullanıcılar Satın Al
👥 Kullanıcı A: 100 Token = 1000$
👥 Kullanıcı B: 50 Token = 500$
👥 Kullanıcı C: 30 Token = 300$
    ↓ Hisse Değeri Arttı (10$ → 12$)
💰 Kullanıcı A Değeri: 1200$ (200$ kâr!)
```

---

## ✨ Özellikler

### 🔐 Güvenlik
- JWT Token tabanlı authentication
- Password hashing (BCrypt)
- Secure API endpoints
- CORS configuration

### 📊 Hisse Yönetimi
- Hisse listesi görüntüleme
- Detaylı hisse bilgileri
- Gerçek zamanlı fiyat (update edilebilir)
- Sahiplik yüzdeleri otomatik hesaplama

### 💼 Portföy Yönetimi
- Token satın alma
- Token satma
- Sahip olduğunuz token'ları görüntüleme
- Kâr/zarar takibi

### 👤 Kullanıcı Yönetimi
- Kaydol (Register)
- Giriş yap (Login)
- Profil güncelle
- Portföy görüntüle

---

## 🏗️ Proje Yapısı

```
HackathonProject/
├── backend-springboot/          ← Spring Boot Backend
│   ├── src/main/java/com/tokenapp/
│   │   ├── config/              ← Konfigürasyonlar
│   │   ├── controller/          ← API Endpoints
│   │   ├── service/             ← Business Logic
│   │   ├── repository/          ← Database Access
│   │   ├── entity/              ← JPA Entities
│   │   ├── dto/                 ← Data Transfer Objects
│   │   ├── security/            ← Auth & JWT
│   │   └── exception/           ← Error Handling
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml                  ← Maven Dependencies
│
├── backend-python/              ← Python Backend (Optional)
│   └── (Analytics, Admin Panel, etc.)
│
├── frontend/                    ← HTML/CSS/JavaScript
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── css/
│   ├── js/
│   └── assets/
│
└── docs/                        ← Dökümentasyon
    ├── project-understanding.md
    ├── backend-roles.md
    ├── api-endpoints.md
    └── setup-guide.md
```

---

## 🚀 Hızlı Başlangıç

### Ön Koşullar
- Java 17+
- Maven 3.8+
- MySQL 8.0+

### Setup
```bash
# 1. Proje klasörüne gir
cd HackathonProject/backend-springboot

# 2. Dependencies'leri yükle
mvn clean install

# 3. application.properties'yi yapılandır
# src/main/resources/application.properties

# 4. MySQL database'ı oluştur
CREATE DATABASE tokenapp_db;

# 5. Uygulamayı çalıştır
mvn spring-boot:run
```

**Başarılı!** Uygulama `http://localhost:8080/api` adresinde çalışıyor.

---

## 📚 Dökümentasyon

- [**Project Understanding**](./docs/project-understanding.md) - Projenin tam açıklaması
- [**Backend Roles**](./docs/backend-roles.md) - Spring Boot vs Python bölümü
- [**API Endpoints**](./docs/api-endpoints.md) - Tüm REST endpoints
- [**Setup Guide**](./docs/setup-guide.md) - Detaylı kurulum rehberi

---

## 🔑 API Endpoints Özeti

### Authentication
```
POST   /api/auth/register       → Kayıt ol
POST   /api/auth/login          → Giriş yap
```

### Shares
```
GET    /api/shares              → Tüm hisseleri listele
GET    /api/shares/{id}         → Hisse detayı
POST   /api/shares/{id}/buy     → Token satın al
```

### Portfolio
```
GET    /api/shares/user/my-tokens       → Sahip olduğun token'ları göster
DELETE /api/shares/tokens/{id}/sell     → Token sat
```

### Users
```
GET    /api/users/{id}          → Kullanıcı bilgisi
PUT    /api/users/{id}          → Bilgi güncelle
GET    /api/users/{id}/portfolio → Portföyü göster
```

**Detaylı bilgi:** [API Endpoints Dökümentasyonu](./docs/api-endpoints.md)

---

## 🗄️ Database Schema

### User Table
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Share Table
```sql
CREATE TABLE shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    total_tokens BIGINT NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### UserToken Table
```sql
CREATE TABLE user_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    share_id BIGINT NOT NULL,
    token_amount BIGINT NOT NULL,
    ownership_percentage DOUBLE,
    purchased_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (share_id) REFERENCES shares(id)
);
```

---

## 🔐 Güvenlik Özellikleri

### ✅ Implemented
- [x] JWT Token Authentication
- [x] Password Hashing (BCrypt)
- [x] Spring Security Configuration
- [x] CORS Protection
- [x] Input Validation
- [x] Global Exception Handling

### ⏳ To-Do
- [ ] Rate Limiting
- [ ] Email Verification
- [ ] 2FA (Two-Factor Authentication)
- [ ] Audit Logging
- [ ] SQL Injection Prevention (Already handled by JPA)

---

## 👥 Tim Dağılımı

| Rol | Sorumluluk | Kişi |
|-----|-----------|------|
| **Spring Boot Backend** | REST API, Security, Database | 1 kişi |
| **Python Backend** | Analytics, Admin Panel | 1 kişi |
| **Frontend** | HTML/CSS/JavaScript UI | 1 kişi |
| **DevOps** | Deployment, Database | 1 kişi |

**Detaylı:** [Backend Roles Dökümentasyonu](./docs/backend-roles.md)

---

## 📊 Development Timeline

### ✅ Tamamlanan (4-5 Saat)
- [x] Package structure
- [x] Entity'ler (User, Share, UserToken)
- [x] Repository'ler
- [x] Security Configuration (JWT, BCrypt)
- [x] Exception Handling
- [x] DTOs
- [x] Services (Auth, Share, User)
- [x] Controllers
- [x] API Endpoints

### ⏳ Kalan (16-20 Saat)
- [ ] Database Tests
- [ ] Frontend Development
- [ ] Frontend-Backend Integration
- [ ] User Acceptance Testing
- [ ] Final Deployment
- [ ] Bug Fixes

---

## 🧪 Testing

### Unit Tests
```bash
mvn test
```

### Specific Test Class
```bash
mvn test -Dtest=AuthServiceTest
```

### Integration Tests
```bash
mvn test -Dtest=*IntegrationTest
```

### Test Coverage
```bash
mvn test jacoco:report
```

---

## 📈 Performance

- **Request/Response Time:** < 200ms
- **Database Queries:** Optimized with proper indexes
- **Connection Pool:** 20 max connections
- **Cache:** Can be added for frequently accessed data

---

## 🐛 Sık Sorunlar

### MySQL bağlantı hatası
```bash
# MySQL'in çalışıp çalışmadığını kontrol et
mysql -u root -p

# Docker'da çalışan MySQL'i kontrol et
docker ps
```

### Port 8080 kullanımda
```bash
# Başka bir port kullan
server.port=8081
```

### JWT Secret çok kısa
```properties
# application.properties'de değiştir
jwt.secret=your_very_long_secret_key_at_least_256_bits_long
```

**Detaylı çözümler:** [Setup Guide](./docs/setup-guide.md)

---

## 🚀 Deployment

### Docker ile
```bash
docker build -t tokenapp:latest .
docker run -p 8080:8080 tokenapp:latest
```

### Cloud (AWS/Azure/GCP)
- Spring Boot uygulaması kolayca deploy edilebilir
- Docker container'ı kullan
- Managed database (RDS, CloudSQL, etc.) kullan

---

## 📞 İletişim & Destek

- **Slack/Discord:** Team channel
- **Code Review:** Pull requests ile
- **Issues:** GitHub Issues
- **Documentation:** `/docs` klasöründe

---

## 📜 License

MIT License - Özgürce kullanın!

---

## ✨ Contributers

- **Spring Boot Backend:** [Adınız]
- **Python Backend:** [Adınız]
- **Frontend:** [Adınız]
- **DevOps:** [Adınız]

---

## 🎯 Next Steps

1. ✅ Backend setup tamamlandı
2. 📝 Frontend geliştirmeye başla
3. 🔗 Frontend-Backend entegrasyonu
4. 🧪 End-to-End testing
5. 🚀 Production deployment

---

## 💡 Pro Tips

- JWT token'ı her 24 saatte bir refresh et
- Database backups al
- Logs'u düzenli kontrol et
- Git commits'leri küçük tutun
- Code review yap

---

**Hazırız! Başarılar dilerim! 🎉**

Last Updated: 2025-03-06

