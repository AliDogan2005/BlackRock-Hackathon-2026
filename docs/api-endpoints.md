# API Endpoints Dökümentasyonu

## Base URL
```
http://localhost:8080/api
```

---

## Authentication Endpoints

### 1. Register (Kayıt Ol)
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "userId": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "message": "User registered successfully"
}
```

---

### 2. Login (Giriş Yap)
```http
POST /auth/login
Content-Type: application/json

{
  "usernameOrEmail": "johndoe",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "userId": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "message": "Login successful"
}
```

---

## Share (Hisse) Endpoints

### 3. Tüm Hisseleri Listele
```http
GET /shares
Authorization: Bearer {token}
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Apple Inc.",
    "description": "Apple hissesi",
    "totalTokens": 1000000,
    "currentValue": 150.50,
    "imageUrl": "https://...",
    "isActive": true,
    "availableTokens": 999000,
    "totalOwnershipPercentage": 0.1
  },
  ...
]
```

---

### 4. Hisse Detayı
```http
GET /shares/{shareId}
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Apple Inc.",
  "description": "Apple hissesi",
  "totalTokens": 1000000,
  "currentValue": 150.50,
  "imageUrl": "https://...",
  "isActive": true,
  "availableTokens": 999000,
  "totalOwnershipPercentage": 0.1
}
```

---

## Token Alım-Satım Endpoints

### 5. Token Satın Al (Buy Tokens)
```http
POST /shares/{shareId}/buy
Authorization: Bearer {token}
Content-Type: application/json

{
  "shareId": 1,
  "tokenAmount": 100
}
```

**Success Response (201):**
```json
{
  "message": "Tokens purchased successfully",
  "data": {
    "id": 5,
    "userId": 1,
    "shareId": 1,
    "shareName": "Apple Inc.",
    "tokenAmount": 100,
    "ownershipPercentage": 0.01,
    "currentValue": 150.50,
    "purchasedAt": "2025-03-06T10:30:00"
  }
}
```

---

### 6. Sahip Olduğun Tokenları Göster (My Tokens)
```http
GET /shares/user/my-tokens
Authorization: Bearer {token}
```

**Success Response (200):**
```json
[
  {
    "id": 5,
    "userId": 1,
    "shareId": 1,
    "shareName": "Apple Inc.",
    "tokenAmount": 100,
    "ownershipPercentage": 0.01,
    "currentValue": 150.50,
    "purchasedAt": "2025-03-06T10:30:00"
  },
  {
    "id": 6,
    "userId": 1,
    "shareId": 2,
    "shareName": "Microsoft",
    "tokenAmount": 50,
    "ownershipPercentage": 0.005,
    "currentValue": 380.00,
    "purchasedAt": "2025-03-06T11:00:00"
  }
]
```

---

### 7. Token Sat (Sell Tokens)
```http
DELETE /shares/tokens/{userTokenId}/sell?tokenAmount=50
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "message": "Tokens sold successfully"
}
```

---

## User (Kullanıcı) Endpoints

### 8. Kullanıcı Bilgilerini Göster
```http
GET /users/{userId}
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2025-03-06T09:00:00",
  "updatedAt": "2025-03-06T09:00:00"
}
```

---

### 9. Kullanıcı Bilgilerini Güncelle
```http
PUT /users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jonathan",
  "lastName": "Smith"
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "Jonathan",
  "lastName": "Smith",
  "isActive": true,
  "createdAt": "2025-03-06T09:00:00",
  "updatedAt": "2025-03-06T12:00:00"
}
```

---

### 10. Portföyü Göster (Portfolio)
```http
GET /users/{userId}/portfolio
Authorization: Bearer {token}
```

**Success Response (200):**
```json
[
  {
    "id": 5,
    "userId": 1,
    "shareId": 1,
    "shareName": "Apple Inc.",
    "tokenAmount": 100,
    "ownershipPercentage": 0.01,
    "currentValue": 150.50,
    "purchasedAt": "2025-03-06T10:30:00"
  },
  {
    "id": 6,
    "userId": 1,
    "shareId": 2,
    "shareName": "Microsoft",
    "tokenAmount": 50,
    "ownershipPercentage": 0.005,
    "currentValue": 380.00,
    "purchasedAt": "2025-03-06T11:00:00"
  }
]
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "status": 400,
  "message": "Invalid request data",
  "error": "Bad Request",
  "timestamp": "2025-03-06T10:00:00",
  "path": "/api/auth/register"
}
```

### 409 - Conflict (Duplicate)
```json
{
  "status": 409,
  "message": "Username already exists: johndoe",
  "error": "Duplicate Resource",
  "timestamp": "2025-03-06T10:00:00",
  "path": "/api/auth/register"
}
```

### 404 - Not Found
```json
{
  "status": 404,
  "message": "User not found with id: 999",
  "error": "Resource Not Found",
  "timestamp": "2025-03-06T10:00:00",
  "path": "/api/users/999"
}
```

### 500 - Internal Server Error
```json
{
  "status": 500,
  "message": "An unexpected error occurred",
  "error": "Exception",
  "timestamp": "2025-03-06T10:00:00",
  "path": "/api/shares"
}
```

---

## Request Headers

Bütün authenticated requests'e aşağıdaki header ekleyin:

```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

---

## Database Setup

MySQL veritabanını ayarlamak için:

1. Veritabanı oluşturun:
```sql
CREATE DATABASE tokenapp_db;
USE tokenapp_db;
```

2. application.properties güncelleyin:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/tokenapp_db
spring.datasource.username=root
spring.datasource.password=your_password
```

Spring Boot otomatik olarak tabloları oluşturacaktır (JPA Hibernate).

---

## Postman Collection

Tüm endpoints'i test etmek için Postman'den import edebileceğiniz collection:
[postman-collection.json](./postman-collection.json)

