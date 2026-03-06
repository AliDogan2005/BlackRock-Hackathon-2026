# 📚 Tokenizasyon Platformu - Dokümantasyon

> **Bu klasör:** Proje hakkında tüm bilgiler, mimariler, rolleri ve nasıl başlanacağı

---

## 📖 Dokümantasyon Dosyaları

### 🎯 **Temel Dokümantasyon (OKUMANIZ ÖNERİLİ)**

1. **`project-understanding.md`** ⭐ **[BAŞLA BURADAN]**
   - Proje nedir, nasıl çalışır
   - Hisse, Token, Portföy konseptleri
   - Örnek workflow ve veri tabanı şeması
   - **Okunma Süresi:** 10 dakika
   - **Okuyacaklar:** Tüm takım

2. **`backend-roles.md`** ⭐ **[4 KİŞİ İÇİN ÖNEMLİ]**
   - Java ve Python backend arasında görev bölümü
   - Her role için özel dosyalar ve sorumluluklarM
   - Teslim tarihleri ve milestone'lar
   - **Okunma Süresi:** 15 dakika
   - **Okuyacaklar:** Backend (2 Java kişi + 1 Python), PM

---

## 🎬 Çalışmaya Başlama Sırası

1. Tüm takım **`project-understanding.md`** oku (10 min)
2. Herbir kişi **`backend-roles.md`** oku (15 min)
3. **Spring Boot Kişi 2** → `backend-springboot/README.md` oku
4. **Python Kişi** → `backend-python/README.md` oku
5. **Frontend Kişi** → `frontend/README.md` oku
6. **Başlayın!** 🚀

---

## 📋 Dokümantasyon Haritası

```
docs/
├── README.md (BU DOSYA)
│
├── project-understanding.md      [P0 - Tüm takım]
├── backend-roles.md              [P0 - Backend takımı]
│
├── api-contract.md               [P1 - Frontend + Spring Boot]
│   └─ Frontend ↔ Spring Boot API sözleşmesi
│
├── architecture.md               [P1 - Teknik]
│   └─ Sistem mimarisi diyagramlar
│
├── database-schema.md            [P1 - Spring Boot Kişi 2]
│   └─ Detaylı tablo şemaları ve SQL
│
├── setup.md                      [P1 - Tüm takım]
│   └─ Lokal geliştirme kurulumu
│
├── blockchain-integration.md     [P2 - Python kişi]
│   └─ Smart contract ve blockchain (opsiyonel)
│
└── demo-runbook.md              [P2 - Gün 5/6]
    └─ Demo gününün adimlama planı
```

---

## 🎯 Öncelik Seviyeleri

### **P0 - KRİTİK (Gün 1-3)**
- ✅ `project-understanding.md` - Herkes anlamak zorunda
- ✅ `backend-roles.md` - Rolleri netleştirmek

### **P1 - ÖNEMLİ (Gün 3-4)**
- ✅ `api-contract.md` - Frontend-Backend iletişimi
- ✅ `database-schema.md` - Veri yapısı
- ✅ `setup.md` - Lokal kurulum

### **P2 - OPSİYONEL (Gün 5+)**
- ⏰ `blockchain-integration.md` - Eğer zamanı varsa
- ⏰ `demo-runbook.md` - Demo öncesi

---

## 👥 Takım Rol Özeti

| Role | Kişi | Ana Sorumluluğu | Dosyaları Oku |
|------|------|-----------------|------------------|
| **Spring Boot - Auth** | 1 | User registration, login, JWT | backend-roles.md |
| **Spring Boot - Stock/Token** | 1 | Stock, Token, Buy/Sell, Transaction | backend-roles.md |
| **Python - Fiyat Güncelleme** | 1 | Stock fiyat güncellemesi (opsiyonel) | backend-roles.md |
| **Frontend - React/Vue** | 1 | Tüm UI ve kullanıcı arayüzü | backend-roles.md |

---

## 🚀 Hızlı Başlangıç Komutları

```bash
# Tüm servisleri aynı anda başlat
cd /Users/alidogan/Projects/Hackathon/HackathonProject

# Terminal 1: Spring Boot
cd backend-springboot
./mvnw spring-boot:run

# Terminal 2: Python (opsiyonel)
cd backend-python
python -m venv venv
source venv/bin/activate
python main.py

# Terminal 3: Frontend
cd frontend
npm install
npm run dev
```

**Sonuç:**
- Frontend: `http://localhost:3000`
- Spring Boot: `http://localhost:8080`
- Python: `http://localhost:5000`

---

## ✅ Kontrol Listesi (Gün 1 Başında)

- [ ] Herkes `project-understanding.md` okudu
- [ ] Herkes `backend-roles.md` okudu
- [ ] Kişi 1 (Auth): Spring Boot setup tamamladı
- [ ] Kişi 2 (Stock): Database design tamamladı
- [ ] Kişi 3 (Python): Python venv'i setup etti
- [ ] Kişi 4 (Frontend): Node.js + npm'i kurmaya başladı
- [ ] GitHub reposu tüm takım tarafından klonlandı

---

## 💡 İpuçları

1. **Paralel Çalışın:** Kişi 1 (Auth) ile Kişi 2 (Stock) aynı anda çalışabilir
2. **Frontend'i Geciktirmeyin:** Kişi 4 Kişi 2 ile sync kalmalı (API değişiklikleri)
3. **Python İsteğe Bağlı:** İlk 4 gün Python olmadan çalışır, gün 5-6'da eklenebilir
4. **Database'i Erkene Alın:** Kişi 2 database schema'sını günü birinde bitirmeli
5. **Communication:** Her gün kısa standup yapın

---

## 📞 Sorular?

Sorularınız olursa dokümantasyondaki ilgili bölümleri kontrol edin:
- **"Proje ne?" →** `project-understanding.md`
- **"Ben ne yapmalıyım?" →** `backend-roles.md`
- **"API nasıl çağrılır?" →** `api-contract.md` (yakında)
- **"Database tabloları?" →** `database-schema.md` (yakında)

---

## 🎯 Hackathon Hedefi

✅ **Gün 1-5:** Login, Register, Stock Listesi, Token Al/Sat, Portföy
✅ **Gün 6:** Styling, Testing, Demo Hazırlığı
⏰ **Bonus:** Blockchain entegrasyonu (eğer zamanı varsa)

---

**Son Güncelleme:** 6 Mart 2026  
**Hazırlayan:** Team Lead  
**Durum:** ✅ Hazır

