# 🚀 QUICK START - 5 Dakikada Başla

## ⚡ Hızlı Başlangıç (5 adım)

### 1️⃣ Proje Klasörüne Gir (15 saniye)
```bash
cd /Users/alidogan/Projects/Hackathon/HackathonProject/backend-springboot
```

### 2️⃣ Dependencies Yükle (2 dakika)
```bash
mvn clean install
```

✅ Başarılı oldu mu? → `BUILD SUCCESS` görmeli

### 3️⃣ MySQL'i Başlat (30 saniye)

**Option A: Docker (Önerilen)**
```bash
docker run --name mysql-tokenapp \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=tokenapp_db \
  -p 3306:3306 \
  -d mysql:8.0
```

**Option B: Lokal MySQL**
```bash
mysql -u root -p
CREATE DATABASE tokenapp_db;
EXIT;
```

### 4️⃣ Uygulamayı Çalıştır (1 dakika)
```bash
mvn spring-boot:run
```

✅ Başarılı? → `Application started` görmeli

### 5️⃣ Test Et (30 saniye)
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

✅ JWT token alırsan işe yaramış demektir!

---

## 🎯 Endpoint Quick Test

### 1. Register
```bash
# Create user
POST http://localhost:8080/api/auth/register
```

**Body:**
```json
{
  "username": "ali",
  "email": "ali@example.com",
  "password": "123456",
  "passwordConfirm": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "userId": 1,
  "username": "ali"
}
```

### 2. Login
```bash
# Get token
POST http://localhost:8080/api/auth/login
```

**Body:**
```json
{
  "usernameOrEmail": "ali",
  "password": "123456"
}
```

### 3. Get Shares (Public)
```bash
# No auth needed
GET http://localhost:8080/api/shares
```

### 4. Get My Tokens (Protected)
```bash
# Need JWT token
GET http://localhost:8080/api/shares/user/my-tokens
Authorization: Bearer <your-token>
```

---

## 🔐 JWT Token Kullanımı

### Token'ı Nasıl Alırım?
1. Register veya Login yap
2. Response'dan `token` al
3. Her request'te `Authorization: Bearer {token}` header'ı ekle

### Örnek (cURL)
```bash
# Token al
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "ali",
    "password": "123456"
  }' | jq -r '.token')

# Token'ı kullan
curl -X GET http://localhost:8080/api/shares/user/my-tokens \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Postman Collection

### Import Et
1. Postman aç
2. File → Import
3. Bu dökümanı import et: `docs/postman-collection.json`

### Veya Manual Oluştur

**Environment Variables:**
```json
{
  "base_url": "http://localhost:8080/api",
  "token": ""
}
```

**Requests:**

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /auth/register | ❌ | Kaydol |
| POST | /auth/login | ❌ | Giriş yap |
| GET | /shares | ❌ | Hisseleri listele |
| GET | /shares/{id} | ❌ | Hisse detayı |
| POST | /shares/{id}/buy | ✅ | Token satın al |
| GET | /shares/user/my-tokens | ✅ | Sahip tokenlar |
| DELETE | /shares/tokens/{id}/sell | ✅ | Token sat |
| GET | /users/{id} | ✅ | Profil bilgisi |

---

## 🐛 Sorun Giderme

### ❌ "Connection refused"
```bash
# MySQL çalışıyor mu?
mysql -u root -p

# Veya Docker'ı kontrol et
docker ps | grep mysql
```

### ❌ "Port 8080 kullanımda"
```bash
# Başka port kullan: application.properties
server.port=8081
```

### ❌ "BUILD FAILED"
```bash
# Clean rebuild
mvn clean install -DskipTests
```

### ❌ "Cannot find symbol: com.tokenapp"
```bash
# IDE'yi restart et veya
mvn clean install
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `pom.xml` | Dependencies & Build config |
| `application.properties` | Runtime configuration |
| `TokenAppApplication.java` | Entry point |
| `SecurityConfig.java` | Security setup |
| `docs/api-endpoints.md` | API documentation |

---

## 🔗 API Base URL

```
http://localhost:8080/api
```

---

## 💾 Database Check

```bash
# MySQL'e bağlan
mysql -u root -p tokenapp_db

# Tabloları görmek için
SHOW TABLES;

# User sayısını görmek için
SELECT COUNT(*) FROM users;

# Çık
EXIT;
```

---

## 🎓 Sonraki Adımlar

1. ✅ Backend çalışıyor
2. ⏳ Frontend'i yaz (HTML/CSS/JS)
3. ⏳ API endpoint'lerini test et (Postman)
4. ⏳ Database'e test verisi ekle
5. ⏳ Deployment yap

---

## 🆘 Need Help?

1. **Setup sorunları:** `docs/setup-guide.md`
2. **API detayları:** `docs/api-endpoints.md`
3. **Mimarı:** `ARCHITECTURE_GUIDE.md`
4. **Genel bakış:** `BACKEND_README.md`

---

## ⏱️ Timeline

- **Başlama:** 5 dakika
- **Dependencies:** 2 dakika
- **MySQL:** 1 dakika
- **Run:** 1 dakika
- **Test:** 1 dakika
- **Total:** ~10 dakika

---

## ✅ Checklist

- [ ] Proje klasörüne gittim
- [ ] `mvn clean install` çalıştırdım
- [ ] MySQL başlattım
- [ ] `mvn spring-boot:run` çalıştırdım
- [ ] Register endpoint'ini test ettim
- [ ] JWT token aldım
- [ ] Login yaptım
- [ ] Hisseleri listeledim
- [ ] Token satın aldım
- [ ] Portföyümü gördüm

---

## 🚀 Başarı!

Tüm adımları tamamladıysan:

✅ Backend çalışıyor  
✅ Database bağlı  
✅ API endpoint'leri aktif  
✅ JWT authentication çalışıyor  
✅ CRUD operasyonları test edildi  

**Frontend development'a geçebilirsin!** 🎉

---

**Status:** Ready to Go 🚀

