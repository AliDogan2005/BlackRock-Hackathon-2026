# 📋 Proje Anlayışı - Tokenizasyon Platformu

> **Kısa Tanım:** Kullanıcıların gerçek şirket hisselerine küçük parçalar halinde yatırım yapabildiği blockchain tabanlı platform

---

## 🎯 Proje Özeti

**Amaç:** Kullanıcıların gerçek şirketi hisselerine (veya varlıklara) **küçük parçalar halinde yatırım yapması**

### 1️⃣ Hisse (Stock/Asset)
Bir şirkete ait hisse:
- Örnek: Apple hissesi
- Örnek: Altın (1 kg)
- Örnek: Gayrimenkul

### 2️⃣ Token (Parçacık)
Hissenin bölünmüş hali:
- Apple hissesi **1.000.000 tokena** bölünüyor
- Her token = Apple hissesinin **milyonda biri**
- Kullanıcı **10 token** alırsa = Apple hissesinin milyonda biri × 10 sahibi olur

### 3️⃣ Değer Artışı/Azalışı (Ownership)
Sahip olduğunuz token sayısı kadar kazanç/kayıp:
- Apple hissesi $150 → $160 (6.67% artış)
- Siz 10 token sahibisiniz (0.001% sahiplik)
- Sizin kârınız = 6.67% × 0.001% = gerçek kâr

**Formül:**
```
Sizin Kârınız = (Hissenin Yeni Fiyatı - Eski Fiyatı) × (Sahip Olduğunuz Token Sayısı / Toplam Token Sayısı)
```

---

## 🎮 Uygulama Özellikleri (Features)

### ✅ 1. Kullanıcı Yönetimi
- **Registration:** Yeni kullanıcı kaydı (Email, şifre)
- **Login:** Giriş yapma (JWT token)
- **Profile:** Kullanıcı bilgileri görüntüleme

### ✅ 2. Hisse İncele
- **Hisse Listesi:** Tüm hisseleri görmek
- **Hisse Detayı:** Fiyat, şart, grafik, kaç token kaldı
- **Arama/Filtreleme:** Hisse adına göre arama

### ✅ 3. Token Satın Alma
- **Hisseden Token Al:** "Apple'dan 10 token almak istiyorum"
- **Bakiye Kontrolü:** "Senin 5000 TL paran var mı?"
- **Fiyat Hesaplama:** 10 token × 50 TL = 500 TL
- **İşlemi Kaydet:** Veritabanına kaydet, user portföyünü güncelle

### ✅ 4. Token Satma
- **Token Sat:** "Apple tokenlarımdan 5'ini satmak istiyorum"
- **Sahiplik Kontrolü:** "Senin 10 token'ın var mı? Evet"
- **Fiyat Hesaplama:** 5 token × 50 TL = 250 TL
- **Bakiyeyi Güncelle:** Cüzdana para ekle, tokenı sil

### ✅ 5. Portföy Görüntüle
- **Sahip Olduğu Tokenlar:** "Sende Apple 10 token, Microsoft 5 token var"
- **Toplam Değer:** Tüm token değerinin toplamı
- **Kâr/Zarar:** Her hisse için yüzdelik kazanç/kayıp

### ✅ 6. İşlem Geçmişi
- **Tüm İşlemleri Gör:** Kim ne zaman ne aldı/sattı
- **Filtrele:** Tarihe göre, tipe göre (Al/Sat)

---

## 🏗️ Mimariye Dönüşüm

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React/Vue)                    │
│           (Login, Hisse Listesi, Portföy, etc)             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Spring Boot Backend (Java)                  │
│  • User Management (Auth, JWT)                              │
│  • Stock/Asset Management                                   │
│  • Token Buy/Sell Business Logic                            │
│  • Portfolio Management                                     │
│  • Transaction History                                      │
│  • Database Management (PostgreSQL)                         │
└────────────────┬─────────────────────────────┬──────────────┘
                 │                             │
                 │ (Stock fiyat güncellemesi)  │ (Blockchain opsiyonel)
                 │                             │
                 ▼                             ▼
        ┌────────────────────┐      ┌──────────────────────┐
        │  Python Backend    │      │  Blockchain Network  │
        │ (Fiyat Güncelle)   │      │  (Opsiyonel Smart)   │
        │ (Grafik Hesapla)   │      │   Contracts         │
        └────────────────────┘      └──────────────────────┘
```

---

## 📊 Veritabanı Tabloları (Temel)

### `users` 
```
id | email | password | full_name | balance_tl | created_at
1  | ali@gmail.com | hashed_pwd | Ali | 10000.00 | 2024-01-01
```

### `stocks` (Hisseler)
```
id | name | symbol | current_price | change_percent | created_at
1  | Apple | AAPL | 150.00 | 2.5 | 2024-01-01
2  | Microsoft | MSFT | 370.00 | 1.2 | 2024-01-01
```

### `tokens` (Her hissenin tokenları)
```
id | stock_id | symbol | total_supply | available_supply | price_per_token
1  | 1 | AAPL-TOKEN | 1000000 | 950000 | 0.000150
2  | 2 | MSFT-TOKEN | 1000000 | 999990 | 0.000370
```

### `user_tokens` (Kullanıcının sahip olduğu tokenlar)
```
id | user_id | token_id | quantity | purchase_price | purchase_date
1  | 1 | 1 | 10 | 0.000150 | 2024-01-15
2  | 1 | 2 | 5 | 0.000370 | 2024-01-16
```

### `transactions` (İşlem geçmişi)
```
id | user_id | token_id | type | quantity | price_per_token | total_amount | created_at
1  | 1 | 1 | BUY | 10 | 0.000150 | 0.0015 | 2024-01-15 10:30
2  | 1 | 1 | SELL | 3 | 0.000160 | 0.00048 | 2024-01-16 14:20
```

---

## 🔄 Örnek Workflow

### Senaryo: Ali Apple Hissesi Token Alıyor

1. **Frontend:** Ali login oluyor
   ```
   POST /api/auth/login
   { email: "ali@gmail.com", password: "..." }
   ```

2. **Spring Boot:** Ali'nin bilgilerini kontrol eder, JWT token döner
   ```json
   { "token": "eyJhbGc..." }
   ```

3. **Frontend:** Apple hissesini gösterir
   ```
   GET /api/stocks/1
   ```

4. **Spring Boot:** Apple'ın mevcut fiyatını, token sayısını döner
   ```json
   {
     "id": 1,
     "name": "Apple",
     "current_price": 150.00,
     "tokens": {
       "total": 1000000,
       "available": 950000,
       "price_per_token": 0.000150
     }
   }
   ```

5. **Frontend:** Ali "10 token almak istiyorum" diyor
   ```
   POST /api/tokens/buy
   { token_id: 1, quantity: 10 }
   ```

6. **Spring Boot Kontroller:**
   - Ali'nin cüzdanını kontrol: "10000 TL var mı?" → Evet
   - Toplam fiyat: 10 × 0.000150 = 0.0015 TL ✅
   - Ali'nin bakiyesini azalt: 10000 - 0.0015 = 9999.9985 TL
   - Ali'nin tokenlarına 10 ekle
   - Transaction'ı kaydet

7. **Frontend:** "Satın alma başarılı!" mesajı göster

---

## 💰 Kâr/Zarar Hesaplaması

Daha sonra Apple hissesinin fiyatı $150 → $160 olursa:

```
Orijinal Fiyat: 150 TL/hisse
Yeni Fiyat: 160 TL/hisse
Fiyat Artışı: 10 TL (6.67%)

Ali'nin 10 token'ı var (hissenin 10/1000000 = 0.001%)

Ali'nin Kârı = 10 TL × 0.001% = 0.0001 TL
veya
Ali'nin Kârı = 6.67% × (10 token / 1000000 token)
```

---

## 🎬 Tüm Features Özet

| Feature | Sorumlu | Açıklama |
|---------|---------|----------|
| Registration | Java Backend | Email/şifre ile kayıt |
| Login | Java Backend | JWT token oluştur |
| Stock Listesi | Java Backend | Tüm hisseleri göster |
| Stock Detayı | Java Backend | Token fiyatı, grafik |
| Token Al | Java Backend | Bakiye kontrol + işlem |
| Token Sat | Java Backend | Sahiplik kontrol + işlem |
| Portföy Görüntüle | Java Backend | Kullanıcının token'larını göster |
| İşlem Geçmişi | Java Backend | Buy/Sell işlemlerini göster |
| Fiyat Güncelleme (Opsiyonel) | Python Backend | Stock fiyatını dış kaynaktan al |
| Grafik Oluşturma (Opsiyonel) | Python Backend | Fiyat değişim grafiği hesapla |

---

## ✅ Doğrulama

Şu sorulara "evet" cevabı veriyorsam doğru anladığım anlamına geliyor:

- ✅ Kullanıcılar hisse satın alamaz, sadece **token satın alır** (hissenin parçası)
- ✅ Hissenin fiyatı artarsa, token'ın fiyatı da artar
- ✅ Token satarken, **hissenin o anki fiyatından** satılır
- ✅ Kullanıcının kârı = sahip olduğu token'ların değerindeki artış
- ✅ Veritabanında hisse fiyatı saklanır ve **güncellenebilir** (canlı borsa verisi)
- ✅ Blockchain **opsiyonel** (zorunlu değil, eğer istersen token'u blockchain'e de koyabilir)

---

## 🎯 Hackathon Hedefi

**Basit ama tam işlevsel bir uygulama:**
1. Kullanıcı kaydı ve girişi
2. Hisse/Token listesi görüntüleme
3. Token satın alma/satma
4. Portföy ve işlem geçmişi

**Blockchain ve Grafik opsiyonel (zamanın izin verirse eklenebilir)**

---

**Son Güncelleme:** 6 Mart 2026  
**Durum:** ✅ Hazır

