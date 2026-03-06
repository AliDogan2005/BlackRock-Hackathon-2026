# 🚀 PostgreSQL ile QUICK START - 5 Dakikada Başla

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

### 3️⃣ PostgreSQL'i Başlat (30 saniye)

**Option A: Docker (Önerilen - Easiest)**
```bash
docker run --name tokenapp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tokenapp_db \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: macOS (Homebrew)** 
```bash
brew install postgresql@15
brew services start postgresql@15
createdb -U postgres tokenapp_db
```

**Option C: Linux (apt)**
```bash
sudo apt-get update
sudo apt-get install postgresql
sudo service postgresql start
sudo -u postgres createdb tokenapp_db
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
GET http://localhost:8080/api/shares
```

### 4. Get My Tokens (Protected)
```bash
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

## 📊 PostgreSQL Kontrol

```bash
# PostgreSQL'e bağlan
psql -U postgres

# tokenapp_db'ye geç
\c tokenapp_db

# Tabloları görmek için
\dt

# User sayısını görmek için
SELECT COUNT(*) FROM users;

# Çık
\q
```

---

## 🐛 Sorun Giderme

### ❌ "Connection refused"
```bash
# PostgreSQL çalışıyor mu?
docker ps | grep postgres

# Veya macOS'ta
brew services list | grep postgres
```

### ❌ "Port 5432 kullanımda"
```bash
# Başka bir container çalışıyor
docker ps

# Eski container'ı kaldır
docker rm -f tokenapp-postgres
```

### ❌ "BUILD FAILED"
```bash
# Clean rebuild
mvn clean install -DskipTests
```

### ❌ "Cannot connect to database"
```bash
# Veritabanı oluştur
docker exec -it tokenapp-postgres \
  createdb -U postgres tokenapp_db
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `pom.xml` | PostgreSQL driver included |
| `application.properties` | PostgreSQL config |
| `TokenAppApplication.java` | Entry point |
| `docs/postgresql-setup.md` | Detaylı PostgreSQL setup |

---

## 🔗 API Base URL

```
http://localhost:8080/api
```

---

## ⏱️ Timeline

- **Başlama:** 5 dakika
- **Dependencies:** 2 dakika
- **PostgreSQL:** 1 dakika
- **Run:** 1 dakika
- **Test:** 1 dakika
- **Total:** ~10 dakika

---

## ✅ Checklist

- [ ] Proje klasörüne gittim
- [ ] `mvn clean install` çalıştırdım
- [ ] PostgreSQL başlattım (Docker/brew/apt)
- [ ] `mvn spring-boot:run` çalıştırdım
- [ ] Register endpoint'ini test ettim
- [ ] JWT token aldım
- [ ] Login yaptım
- [ ] Hisseleri listeledim
- [ ] Token satın aldım
- [ ] Portföyümü gördüm

---

## 🆘 Need Help?

1. **PostgreSQL Setup:** `docs/postgresql-setup.md`
2. **API detayları:** `docs/api-endpoints.md`
3. **Kurulum:** `docs/setup-guide.md`
4. **Mimarı:** `ARCHITECTURE_GUIDE.md`

---

## 📚 PostgreSQL vs MySQL

**PostgreSQL kullanmanın avantajları:**
- ✅ Daha güçlü ve advanced features
- ✅ ACID transaction support
- ✅ JSON data type support
- ✅ Büyük veri operasyonları
- ✅ Cloud-friendly (AWS RDS, GCP CloudSQL, Azure)
- ✅ Production-grade reliability

---

## 🚀 Başarı!

Tüm adımları tamamladıysan:

✅ PostgreSQL çalışıyor  
✅ Database bağlı  
✅ API endpoint'leri aktif  
✅ JWT authentication çalışıyor  
✅ CRUD operasyonları test edildi  

**Frontend development'a geçebilirsin!** 🎉

---

**Status:** Ready to Go 🚀  
**Database:** PostgreSQL 15 ✅  
**Driver:** postgresql:42.7.2 ✅  
**Dialect:** PostgreSQL10Dialect ✅  

