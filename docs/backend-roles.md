# 🔧 Backend Rol Bölümü: Java vs Python

> **Özet:** Java (Spring Boot) ana iş, Python opsiyonel ek hizmetler

---

## 📌 Hızlı Karşılaştırma

| Görev | Java (Spring Boot) | Python |
|--------|-------------------|--------|
| **User Management** | ✅ 100% | ❌ Hayır |
| **Stock/Token Logic** | ✅ 100% | ❌ Hayır |
| **Buy/Sell İşlemleri** | ✅ 100% | ❌ Hayır |
| **Database** | ✅ 100% | ❌ Hayır |
| **Stock Fiyat Güncelleme** | ❌ Hayır | ✅ 100% (Opsiyonel) |
| **Grafik/Analiz** | ❌ Hayır | ✅ 100% (Opsiyonel) |
| **Blockchain (Smart Contracts)** | ❌ Hayır | ✅ 100% (Opsiyonel) |

---

## 🍃 JAVA Backend (Spring Boot) - ANa İŞ

**Sorumlu:** 2 kişi

### Neler Yapılır?

#### 1️⃣ User Management (Authentication)
```
POST /api/auth/register  → Email/şifre ile kayıt
POST /api/auth/login     → Giriş, JWT token döner
GET  /api/auth/me        → Logged-in kullanıcı bilgisi
```

**Database:**
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    balance_tl DECIMAL(18,2),
    created_at TIMESTAMP
);
```

---

#### 2️⃣ Stock Management (Hisseler)
```
GET /api/stocks          → Tüm hisseleri listele
GET /api/stocks/{id}     → Hisse detayları
POST /api/stocks         → Yeni hisse ekle (Admin)
PUT /api/stocks/{id}     → Hisse fiyatını güncelle
```

**Database:**
```sql
CREATE TABLE stocks (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    symbol VARCHAR(10),
    current_price DECIMAL(18,6),
    change_percent DECIMAL(5,2),
    created_at TIMESTAMP
);
```

---

#### 3️⃣ Token Management (Çekirdek Feature)
```
GET /api/tokens          → Token listesi
GET /api/tokens/{id}     → Token detayları
POST /api/tokens/buy     → Token satın al ⭐⭐⭐
POST /api/tokens/sell    → Token sat ⭐⭐⭐
```

**Database:**
```sql
CREATE TABLE tokens (
    id BIGINT PRIMARY KEY,
    stock_id BIGINT,
    symbol VARCHAR(50),
    total_supply BIGINT,
    available_supply BIGINT,
    price_per_token DECIMAL(18,8),
    created_at TIMESTAMP
);

CREATE TABLE user_tokens (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    token_id BIGINT,
    quantity BIGINT,
    purchase_price DECIMAL(18,8),
    purchase_date TIMESTAMP
);
```

---

#### 4️⃣ Transaction Management (İşlem Geçmişi)
```
GET /api/transactions        → İşlem geçmişini getir
GET /api/transactions/{id}   → Spesifik işlemi getir
```

**Database:**
```sql
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    token_id BIGINT,
    type VARCHAR(10),         -- 'BUY' veya 'SELL'
    quantity BIGINT,
    price_per_token DECIMAL(18,8),
    total_amount DECIMAL(18,2),
    status VARCHAR(20),       -- 'COMPLETED', 'FAILED'
    created_at TIMESTAMP
);
```

---

#### 5️⃣ Portfolio/Wallet (Portföy Görüntüleme)
```
GET /api/wallet              → Cüzdan bakiyesi
GET /api/portfolio           → Sahip olduğu tokenlar
GET /api/portfolio/summary   → Toplam değer, kâr/zarar
```

---

## 🐍 PYTHON Backend - OPSİYONEL Hizmetler

**Sorumlu:** 1 kişi (Bonus/Opsiyonel)

### Neler Yapılır?

#### 1️⃣ Stock Fiyat Güncelleme (Real-time)
```python
# Her 5 dakikada bir:
# 1. Alpha Vantage / Yahoo Finance API'dan fiyat al
# 2. Spring Boot'a gönder
# 3. Spring Boot database'ini günceller

GET https://www.alphavantage.co/query?symbol=AAPL
→ {"price": 152.50, "change": 2.5}

POST http://localhost:8080/api/stocks/1/update-price
{
    "current_price": 152.50,
    "change_percent": 2.5
}
```

---

#### 2️⃣ Grafik ve Analiz (Opsiyonel)
```python
# Fiyat değişim grafiğini oluştur
GET /api/analytics/stock/{id}/chart
→ {
    "dates": ["2024-01-01", "2024-01-02", ...],
    "prices": [150.00, 151.50, 152.00, ...],
    "trend": "up"
}
```

---

#### 3️⃣ Blockchain (Opsiyonel - eğer isterse)
```python
# Smart Contract'a token mint et
POST /api/blockchain/mint
{
    "token_symbol": "AAPL-TOKEN",
    "amount": 1000000
}

# Blockchain'de token transfer et
POST /api/blockchain/transfer
{
    "to_address": "0xUser...",
    "token_id": "AAPL-TOKEN",
    "amount": 10
}
```

---

## 👥 4 Kişilik Ekip İçin Görev Dağılımı

### 🍃 **Java Backend - Kişi 1: "Auth & User Yönetimi"**

**Ana Dosyalar:**
```
src/main/java/com/hackathonproject/
├── model/
│   └── User.java
├── repository/
│   └── UserRepository.java
├── controller/
│   ├── AuthController.java
│   └── UserController.java
├── service/
│   ├── AuthService.java
│   └── UserService.java
├── security/
│   ├── JwtTokenProvider.java
│   └── JwtAuthenticationFilter.java
└── dto/request/
    ├── LoginRequest.java
    └── RegisterRequest.java
```

**Görevler (Sprint Order):**
- **Gün 1-2:** User model + UserRepository
- **Gün 2:** AuthController (login, register endpoints)
- **Gün 2-3:** JWT token işlemleri (JwtTokenProvider)
- **Gün 3:** Security configuration
- **Gün 3-4:** DTO'lar, validation, error handling

**Test Etme:**
```bash
POST /api/auth/register
{ "email": "test@gmail.com", "password": "123456", "fullName": "Test" }

POST /api/auth/login
{ "email": "test@gmail.com", "password": "123456" }
→ { "token": "eyJhbGc...", "user": {...} }

GET /api/auth/me
Headers: { "Authorization": "Bearer eyJhbGc..." }
→ { "id": 1, "email": "test@gmail.com", "fullName": "Test" }
```

---

### 🍃 **Java Backend - Kişi 2: "Stock, Token & Transaction"**

**Ana Dosyalar:**
```
src/main/java/com/hackathonproject/
├── model/
│   ├── Stock.java
│   ├── Token.java
│   ├── UserToken.java
│   ├── Transaction.java
│   └── Wallet.java
├── repository/
│   ├── StockRepository.java
│   ├── TokenRepository.java
│   ├── UserTokenRepository.java
│   ├── TransactionRepository.java
│   └── WalletRepository.java
├── controller/
│   ├── StockController.java
│   ├── TokenController.java
│   ├── TransactionController.java
│   └── WalletController.java
├── service/
│   ├── StockService.java
│   ├── TokenService.java        ⭐⭐⭐ (EN ÖNEMLİ)
│   ├── TransactionService.java
│   └── WalletService.java
└── dto/request/
    ├── BuyTokenRequest.java
    └── SellTokenRequest.java
```

**Görevler (Sprint Order):**
- **Gün 2-3:** Stock + Token models + repositories
- **Gün 3:** StockController (GET endpoints)
- **Gün 3-4:** TokenService (buy/sell logic) ⭐⭐⭐
- **Gün 4:** TokenController (POST endpoints)
- **Gün 4:** WalletService + TransactionService
- **Gün 4-5:** Portfolio getiri hesaplaması

**Kritik Iş Mantığı (TokenService.buyToken):**
```java
public BuyTokenResponse buyToken(Long userId, BuyTokenRequest request) {
    // 1. Token bilgisini getir
    Token token = tokenRepository.findById(request.getTokenId());
    
    // 2. Kullanıcı bakiyesini kontrol et
    User user = userRepository.findById(userId);
    BigDecimal totalPrice = token.getPricePerToken()
                                 .multiply(new BigDecimal(request.getQuantity()));
    
    if (user.getBalance().compareTo(totalPrice) < 0) {
        throw new InsufficientBalanceException();
    }
    
    // 3. Işlem yap
    user.setBalance(user.getBalance().subtract(totalPrice));
    userRepository.save(user);
    
    // 4. Token'ı kullanıcıya ekle
    UserToken userToken = new UserToken();
    userToken.setUserId(userId);
    userToken.setTokenId(token.getId());
    userToken.setQuantity(request.getQuantity());
    userToken.setPurchasePrice(token.getPricePerToken());
    userTokenRepository.save(userToken);
    
    // 5. Transaction'ı kaydet
    Transaction transaction = new Transaction();
    transaction.setUserId(userId);
    transaction.setTokenId(token.getId());
    transaction.setType("BUY");
    transaction.setQuantity(request.getQuantity());
    transaction.setPricePerToken(token.getPricePerToken());
    transaction.setTotalAmount(totalPrice);
    transaction.setStatus("COMPLETED");
    transactionRepository.save(transaction);
    
    return new BuyTokenResponse(user, userToken);
}
```

**Test Etme:**
```bash
POST /api/tokens/buy
Headers: { "Authorization": "Bearer {token}" }
{ "token_id": 1, "quantity": 10 }
→ { "success": true, "new_balance": 9999.9985, "user_tokens": [...] }

GET /api/portfolio
→ { "total_value": 0.0015, "tokens": [...], "profit_loss": 0 }

POST /api/tokens/sell
{ "token_id": 1, "quantity": 5 }
→ { "success": true, "new_balance": 9999.9993 }

GET /api/transactions
→ [{ "type": "BUY", "quantity": 10, ... }, { "type": "SELL", "quantity": 5, ... }]
```

---

### ⚛️ **Frontend - Kişi 3: "Tüm UI"**

**Ana Sayfalar:**
```
src/
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── StocksPage.jsx
│   ├── StockDetailPage.jsx
│   ├── PortfolioPage.jsx
│   ├── WalletPage.jsx
│   └── TransactionsPage.jsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   ├── assets/
│   │   ├── AssetCard.jsx
│   │   ├── AssetList.jsx
│   │   └── AssetFilter.jsx
│   ├── tokens/
│   │   ├── BuyTokenModal.jsx
│   │   └── SellTokenModal.jsx
│   └── ...
└── services/
    ├── api.js
    ├── authService.js
    ├── stockService.js
    └── tokenService.js
```

**Görevler (Sprint Order):**
- **Gün 1-2:** Temel layout + Login/Register sayfaları
- **Gün 2-3:** Stock listesi ve detay sayfaları
- **Gün 3-4:** Buy/Sell modal'ları
- **Gün 4-5:** Portfolio ve transaction sayfaları
- **Gün 5-6:** Styling, responsive design, bug fix

---

### 🐍 **Python Backend - Kişi 4: "Fiyat Güncelleme (Bonus)"**

**Dosyalar:**
```
backend-python/
├── app/
│   ├── main.py
│   ├── services/
│   │   ├── stock_price_service.py
│   │   └── spring_boot_client.py
│   └── scheduler.py
└── requirements.txt
```

**Görevler (Gün 4-6):**
- **Gün 4-5:** Alpha Vantage API entegrasyonu
- **Gün 5:** APScheduler ile 5 dakikalık güncelleme
- **Gün 5-6:** Spring Boot'a istek gönderme
- **Gün 6:** Testing ve debugging

---

## 📋 Teslim Tarihleri (6 Günlük Hackathon)

### **Gün 1 Sabahı**
- [ ] Herkes projeyi klon aldı
- [ ] Veritabanı tasarımı tamamlandı (Kişi 2)
- [ ] Java + Node.js kurulumları bitti

### **Gün 2 Akşamı**
- ✅ **Kişi 1:** User registration + login tamamlandı
- ✅ **Kişi 2:** Stock + Token models + repositories
- ✅ **Kişi 3:** Login/Register UI tamamlandı
- ✅ **Kişi 4:** Python environment hazır

### **Gün 3 Akşamı**
- ✅ **Kişi 1:** JWT + Security tamamlandı
- ✅ **Kişi 2:** TokenService buy/sell logic
- ✅ **Kişi 3:** Stock listesi UI
- 🔄 **Kişi 4:** Başlamaya hazır

### **Gün 4 Akşamı**
- ✅ **Kişi 1:** Tüm auth işlemleri done
- ✅ **Kişi 2:** Token endpoints + transaction
- ✅ **Kişi 3:** Portfolio UI
- ✅ **Kişi 4:** Alpha Vantage entegrasyonu başladı

### **Gün 5 Akşamı**
- ✅ **Tüm:** Backend ve Frontend entegre edildi
- ✅ **Kişi 3:** Responsive design
- ✅ **Kişi 4:** Stock price updates çalışıyor

### **Gün 6 - DEMO GÜNÜ**
- ✅ Bug fixing
- ✅ Final testing
- ✅ Demo hazırlığı

---

## 🔗 API Kontratı (Frontend ↔ Spring Boot)

### Auth
```
POST /api/auth/register
{ "email": "user@gmail.com", "password": "pass", "fullName": "Ali" }
→ { "token": "...", "user": { "id": 1, "email": "...", "fullName": "..." } }

POST /api/auth/login
{ "email": "user@gmail.com", "password": "pass" }
→ { "token": "...", "user": {...} }
```

### Stocks
```
GET /api/stocks
→ [{ "id": 1, "name": "Apple", "symbol": "AAPL", "current_price": 150.00, ... }]

GET /api/stocks/{id}
→ { "id": 1, "name": "Apple", "tokens": { "total": 1000000, "available": 950000 } }
```

### Tokens
```
POST /api/tokens/buy
{ "token_id": 1, "quantity": 10 }
→ { "success": true, "new_balance": 9999.99, ... }

POST /api/tokens/sell
{ "token_id": 1, "quantity": 5 }
→ { "success": true, "new_balance": 10000.00, ... }
```

### Portfolio
```
GET /api/portfolio
→ { "total_value": 1500.00, "tokens": [{...}], "profit_loss": 150.00, "profit_loss_percent": 11.1 }
```

### Transactions
```
GET /api/transactions
→ [
    { "id": 1, "type": "BUY", "token_id": 1, "quantity": 10, "total_amount": 0.0015, ... },
    { "id": 2, "type": "SELL", "token_id": 1, "quantity": 5, "total_amount": 0.0008, ... }
]
```

---

## ⚠️ ÖNEMLİ NOTLAR

### Ne Yapılmayacak:
- ❌ Blockchain zorunlu değil (opsiyonel)
- ❌ Gerçek borsa bağlantısı (demo veriler yeterli)
- ❌ İçerik yönetim paneli

### Başlangıç Stratejisi:
1. **Database design'ı ilk kur** (Kişi 2)
2. **Auth sistemini kur** (Kişi 1)
3. **API endpoints'leri yaz** (Kişi 2)
4. **Frontend'i geliştir** (Kişi 3)
5. **Python'u ekle** (Kişi 4) - Opsiyonel

### Git Workflow:
```bash
# Herbir kişi kendi branch'inde çalışır
git checkout -b feature/auth           # Kişi 1
git checkout -b feature/stock-token    # Kişi 2
git checkout -b feature/frontend       # Kişi 3
git checkout -b feature/price-update   # Kişi 4

# Her gün main'e merge yapılır (minimal conflicts)
```

---

## ✅ Başarı Kriteri

✅ Hackathon başarılı sayılırsa:
1. Login/Register çalışıyor
2. Stock listesi görüntüleniyor
3. Token alım/satım mümkün
4. Portföy gösteriliyor
5. İşlem geçmişi kaydediliyor
6. UI responsive ve güzel

**Bonus:**
- ⭐ Real-time price updates (Python)
- ⭐ Grafik ve analiz
- ⭐ Blockchain entegrasyonu

---

**Son Güncelleme:** 6 Mart 2026  
**Hazırlayan:** Team Lead  
**Durum:** ✅ Hazır

