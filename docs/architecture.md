# 🏗️ Sistem Mimarisi - Tokenizasyon Platformu

## 📐 Genel Mimariler Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB TARAYICI                              │
│                   (Chrome, Firefox, Safari)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP/HTTPS REST
                           │
        ┌──────────────────▼──────────────────┐
        │    FRONTEND (React/Vue.js)          │
        │       Port: 3000                    │
        │  ┌──────────────────────────────┐  │
        │  │   Pages:                     │  │
        │  │  • Login/Register            │  │
        │  │  • Stock Listesi             │  │
        │  │  • Stock Detayı              │  │
        │  │  • Token Al/Sat              │  │
        │  │  • Portföy                   │  │
        │  │  • İşlem Geçmişi             │  │
        │  └──────────────────────────────┘  │
        └──────────────────┬───────────────────┘
                           │
                    REST API JSON
                  (Content-Type: application/json)
                           │
        ┌──────────────────▼──────────────────┐
        │   SPRING BOOT BACKEND (Java)        │
        │       Port: 8080                    │
        │  ┌──────────────────────────────┐  │
        │  │   Controllers (REST API):    │  │
        │  │  • AuthController            │  │
        │  │  • StockController           │  │
        │  │  • TokenController           │  │
        │  │  • TransactionController     │  │
        │  │  • WalletController          │  │
        │  └──────────────────────────────┘  │
        │                                     │
        │  ┌──────────────────────────────┐  │
        │  │   Services (İş Mantığı):     │  │
        │  │  • AuthService               │  │
        │  │  • StockService              │  │
        │  │  • TokenService (Buy/Sell)   │  │
        │  │  • TransactionService        │  │
        │  │  • WalletService             │  │
        │  └──────────────────────────────┘  │
        │                                     │
        │  ┌──────────────────────────────┐  │
        │  │   Repositories (Data Layer): │  │
        │  │  • UserRepository            │  │
        │  │  • StockRepository           │  │
        │  │  • TokenRepository           │  │
        │  │  • TransactionRepository     │  │
        │  └──────────────────────────────┘  │
        │                                     │
        │  ┌──────────────────────────────┐  │
        │  │   Security:                  │  │
        │  │  • JwtTokenProvider          │  │
        │  │  • JwtAuthenticationFilter   │  │
        │  │  • SecurityConfig            │  │
        │  └──────────────────────────────┘  │
        └──────────────────┬───────────────────┘
                           │
                    JDBC / JPA
                           │
        ┌──────────────────▼──────────────────┐
        │    PostgreSQL Database              │
        │       (veya H2 development)         │
        │                                     │
        │  Tables:                            │
        │  • users (Kullanıcılar)             │
        │  • stocks (Hisseler)                │
        │  • tokens (Token bilgileri)         │
        │  • user_tokens (Sahiplikler)        │
        │  • transactions (İşlem geçmişi)     │
        │  • wallets (Cüzdan bakiyeleri)      │
        └─────────────────────────────────────┘
```

---

## 🔄 İstek Akışı (Request Flow)

### 1️⃣ LOGIN İstek Akışı

```
Frontend:
  POST /api/auth/login
  { "email": "ali@gmail.com", "password": "123456" }
         │
         ▼
Spring Boot AuthController:
  1. LoginRequest'i valide et
  2. AuthService.login() çağır
         │
         ▼
AuthService:
  1. Email'e göre user bul (UserRepository)
  2. Password'u hashle ve karşılaştır
  3. Eşleşirse: JwtTokenProvider.createToken() çağır
  4. JWT token döner
         │
         ▼
Frontend:
  ✅ JWT token alır → localStorage.setItem("token", jwt)
  ✅ Tüm sonraki isteklere "Authorization: Bearer {jwt}" ekle
```

---

### 2️⃣ STOCK LISTESI İstek Akışı

```
Frontend:
  GET /api/stocks
  Headers: { "Authorization": "Bearer eyJhbGc..." }
         │
         ▼
Spring Boot StockController:
  1. JwtAuthenticationFilter JWT'yi doğrula
  2. Kullanıcı bilgisini context'e koy
  3. StockService.getAllStocks() çağır
         │
         ▼
StockService:
  1. StockRepository.findAll() çağır
  2. Veritabanından tüm stock'ları getir
  3. Her stock'a token bilgisini ekle
         │
         ▼
Database:
  SELECT * FROM stocks
  (Her stock için JOIN ile token info)
         │
         ▼
StockService:
  List<StockResponse> dön
         │
         ▼
Frontend:
  ✅ [{ id: 1, name: "Apple", current_price: 150 }, ...]
     göster
```

---

### 3️⃣ TOKEN SATINA ALMA İstek AKIŞI (EN ÖNEMLİ)

```
Frontend (Kullanıcı):
  POST /api/tokens/buy
  {
    "token_id": 1,
    "quantity": 10
  }
         │
         ▼
Spring Boot TokenController:
  1. JWT doğrula (Kimin istediğini öğren)
  2. TokenService.buyToken() çağır
         │
         ▼
TokenService:
  1. Token bilgisini getir (token_id=1)
     → Token.price_per_token = 0.000150 TL
  2. Toplam fiyat hesapla
     → 10 × 0.000150 = 0.0015 TL
  3. WalletService.checkBalance() çağır
     → "Ali'nin 10000 TL var mı?" → Yes ✅
  4. İşlem başlat (transaction)
         │
         ▼
TransactionService:
  1. users.balance_tl'yi güncelle (10000 → 9999.9985)
  2. user_tokens'e ekle: (user_id=1, token_id=1, quantity=10)
  3. transactions'a kaydını ekle:
     (user_id=1, token_id=1, type='BUY', quantity=10, ...)
  4. token.available_supply güncelle
     (1000000 → 999990)
  5. Heryşeyi DB'ye kaydet
         │
         ▼
Frontend:
  ✅ {
    "success": true,
    "message": "Token satın alındı",
    "new_balance": 9999.9985,
    "user_tokens": [
      { "token_id": 1, "quantity": 10 }
    ]
  }
```

---

### 4️⃣ TOKEN SATMA İstek AKIŞI

```
Frontend:
  POST /api/tokens/sell
  {
    "token_id": 1,
    "quantity": 5
  }
         │
         ▼
Spring Boot TokenController:
  1. JWT doğrula
  2. TokenService.sellToken() çağır
         │
         ▼
TokenService:
  1. User'ın kaç token'ı var → 10 (userToken döne)
  2. "5 tane sat mı istiyorsun? 10'ın var. OK" ✅
  3. Şu anki token fiyatı nedir? → 0.000160 TL
  4. Toplam ne kadar alacaksın?
     → 5 × 0.000160 = 0.0008 TL
  5. WalletService'ü çağır
         │
         ▼
TransactionService:
  1. users.balance_tl'yi güncelle (9999.9985 → 9999.9985 + 0.0008)
  2. user_tokens'i güncelle: quantity 10 → 5
  3. transactions'a satış kaydını ekle
  4. token.available_supply güncelle
     (999990 → 999995) [5 token geri geldi]
         │
         ▼
Frontend:
  ✅ {
    "success": true,
    "message": "Token satıldı",
    "new_balance": 9999.9993,
    "user_tokens": [
      { "token_id": 1, "quantity": 5 }
    ]
  }
```

---

## 📊 Veritabanı İlişkileri

```
┌─────────────────┐
│     users       │  Kullanıcılar
│─────────────────│
│ id (PK)         │
│ email           │
│ password_hash   │
│ full_name       │
│ balance_tl      │  ← Cüzdan bakiyesi
│ created_at      │
└────────┬────────┘
         │ 1:N
         │
    ┌────▼──────────────┐
    │  user_tokens      │  Kullanıcının sahip olduğu tokenlar
    │───────────────────│
    │ id (PK)           │
    │ user_id (FK)      │─────┐
    │ token_id (FK)     │──┐  │
    │ quantity          │  │  │
    │ purchase_price    │  │  │
    │ purchase_date     │  │  │
    └───────────────────┘  │  │
                           │  │
         ┌─────────────────┘  │
         │                    │
    ┌────▼──────────────┐  ┌──▼──────────────┐
    │     tokens        │  │     stocks      │
    │───────────────────│  │─────────────────│
    │ id (PK)           │  │ id (PK)         │
    │ stock_id (FK)     │──┤ name            │
    │ symbol            │  │ symbol          │
    │ total_supply      │  │ current_price   │
    │ available_supply  │  │ change_percent  │
    │ price_per_token   │  │ created_at      │
    └───────────────────┘  └─────────────────┘
         │ 1:N
         │
    ┌────▼──────────────┐
    │  transactions     │  İşlem geçmişi
    │───────────────────│
    │ id (PK)           │
    │ user_id (FK)      │
    │ token_id (FK)     │
    │ type ('BUY'/'SELL')
    │ quantity          │
    │ price_per_token   │
    │ total_amount      │
    │ status            │
    │ created_at        │
    └───────────────────┘

    ┌───────────────────┐
    │     wallets       │
    │───────────────────│
    │ id (PK)           │
    │ user_id (FK)      │─────┐
    │ balance_tl        │     │ (users.balance_tl ile senkron)
    │ balance_usd       │
    │ blockchain_addr   │ (Blockchain opsiyonel)
    │ updated_at        │
    └───────────────────┘
```

---

## 🐍 Python Backend İntegrasyonu (Opsiyonel)

```
Spring Boot'un sabit aralıklarla (her 5 dakika):

GET http://localhost:5000/api/stock-prices
         │
         ▼
Python Backend:
  1. Alpha Vantage API'dan fiyatları çek
     → { "AAPL": 152.50, "MSFT": 370.25, ... }
  2. Kendi database'inde sakla (historical data)
  3. Spring Boot'a JSON döner
         │
         ▼
Spring Boot:
  1. Fiyatları alır
  2. Kendi stocks tablosunu günceller
  3. İşlemler otomatik olamadığı için manuel update
     PUT /api/stocks/1
     { "current_price": 152.50, "change_percent": 2.5 }
         │
         ▼
Frontend:
  ✅ Görmek için sayfayı yenile (veya WebSocket)
```

---

## 🔐 Security Flow

```
Frontend:
  POST /api/auth/login
  { email, password }
         │
         ▼
Spring Boot:
  ✅ AuthController → AuthService → UserRepository
  ✅ Password doğrula (BCrypt hash karşılaştırma)
  ✅ JwtTokenProvider.createToken() çağır
  ✅ JWT token döner: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
         │
         ▼
Frontend:
  localStorage.setItem("token", "eyJhbGc...")

Sonraki her istek:
  GET /api/stocks
  Headers: {
    "Authorization": "Bearer eyJhbGc..."
  }
         │
         ▼
Spring Boot (JwtAuthenticationFilter):
  1. Header'dan JWT al
  2. JwtTokenProvider.validateToken() çağır
  3. Kullanıcı bilgisini Spring Security context'ine koy
  4. @GetMapping("/stocks") çalışır
         │
         ▼
✅ Tüm sonraki isteklerde kullanıcı bilinir
❌ JWT yoksa 401 Unauthorized
❌ JWT geçersizse 401 Unauthorized
```

---

## 🔄 Örnek: Portföy Hesaplama

```
Veritabanı:
┌──────────────────────────────────────────────────────┐
│ stocks table                                         │
├──────────────────────────────────────────────────────┤
│ id │ name      │ current_price │ change_percent     │
├─────┼───────────┼───────────────┼──────────────────┤
│ 1  │ Apple     │ 150.00        │ 2.5              │
│ 2  │ Microsoft │ 370.00        │ 1.2              │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ tokens table                                         │
├──────────────────────────────────────────────────────┤
│ id │ stock_id │ symbol     │ price_per_token      │
├─────┼──────────┼────────────┼──────────────────────┤
│ 1  │ 1        │ AAPL-TOKEN │ 0.000150             │
│ 2  │ 2        │ MSFT-TOKEN │ 0.000370             │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ user_tokens table (Ali'nin)                          │
├──────────────────────────────────────────────────────┤
│ token_id │ quantity │ purchase_price │ purchase_date│
├──────────┼──────────┼────────────────┼──────────────┤
│ 1        │ 10       │ 0.000150       │ 2024-01-15   │
│ 2        │ 5        │ 0.000370       │ 2024-01-16   │
└──────────────────────────────────────────────────────┘

Portföy Hesaplama:
────────────────────────────────────────────────────

Apple Token'lar (token_id=1):
  Current Value = 10 tokens × 0.000150 TL/token = 0.0015 TL
  Purchase Cost = 10 tokens × 0.000150 TL/token = 0.0015 TL
  Profit/Loss = 0.0015 - 0.0015 = 0 TL (0%)

Microsoft Token'lar (token_id=2):
  Current Value = 5 tokens × 0.000370 TL/token = 0.00185 TL
  Purchase Cost = 5 tokens × 0.000370 TL/token = 0.00185 TL
  Profit/Loss = 0.00185 - 0.00185 = 0 TL (0%)

────────────────────────────────────────────────────
TOPLAM PORTFÖY DEĞERİ = 0.0015 + 0.00185 = 0.00335 TL
TOPLAM KÂRI = 0 TL
YÜZDELIK KÂRI = 0%
────────────────────────────────────────────────────

(Eğer Apple fiyatı 150 → 160 TL olursa):
  Yeni Apple Token Fiyatı = 160 / 1,000,000 = 0.00016 TL
  Yeni Değeri = 10 × 0.00016 = 0.0016 TL
  Kârı = 0.0016 - 0.0015 = 0.0001 TL ✅
```

---

## 🎯 Layer'lar ve Sorumluluklar

```
┌─────────────────────────────────────────────────────────┐
│ Presentation Layer (Frontend)                           │
│ React/Vue Components → User interactions                │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP REST API calls
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Controller Layer (Spring Boot)                          │
│ @RestController → Request handling, validation         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Service Layer (Spring Boot)                            │
│ Business logic, calculations, validations              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Repository Layer (Spring Boot)                         │
│ @Repository → Database operations (JPA)                │
└──────────────────┬──────────────────────────────────────┘
                   │ JDBC/JPA
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Database Layer (PostgreSQL)                             │
│ Tables, constraints, relationships                      │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Mimari Prensipler

1. **Separation of Concerns:** Her katman bir sorumluluğu var
2. **Loose Coupling:** Katmanlar birbirinden bağımsız
3. **High Cohesion:** Her katmanın dahili mantığı güçlü
4. **Stateless API:** Server kimse'nin state'ini tutmaz
5. **Database Normalization:** Tekrarlanan veri yok

---

**Son Güncelleme:** 6 Mart 2026  
**Durum:** ✅ Hazır

