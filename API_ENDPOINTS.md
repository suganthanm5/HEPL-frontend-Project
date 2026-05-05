# API Endpoints for Profile Management

## Database Schema

### Users Table Structure
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('Administrator', 'Manager', 'Staff', 'Viewer') DEFAULT 'Staff',
  profile_picture VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Required API Endpoints

### 1. Get User Profile
**Endpoint:** `GET /api/user/profile`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Selva",
    "email": "selva@company.com",
    "role": "Administrator",
    "profilePicture": "https://example.com/profile.jpg"
  }
}
```

### 2. Update Profile
**Endpoint:** `PUT /api/user/profile`
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "role": "Administrator",
  "profilePicture": "https://example.com/profile.jpg"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@company.com",
    "role": "Administrator",
    "profilePicture": "https://example.com/profile.jpg"
  }
}
```

### 2. Change Password
**Endpoint:** `PUT /api/user/change-password`
**Headers:** `Authorization: Bearer <token>`
**Request Body:**
```json
{
  "newPassword": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 3. Upload Profile Picture
**Endpoint:** `POST /api/user/upload-picture`
**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`
**Request Body:** FormData with 'profilePicture' file
**Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "profilePictureUrl": "https://example.com/uploads/profile_123.jpg"
}
```

## Implementation Notes

### Frontend Integration
- The ProfileDrawer component now includes:
  - Real-time data synchronization with localStorage
  - API calls to update profile, password, and upload pictures
  - Error handling and loading states
  - Custom events for cross-component communication

### Backend Requirements
1. **Authentication Middleware**: Verify JWT tokens
2. **File Upload**: Handle multipart/form-data for profile pictures
3. **Password Hashing**: Use bcrypt or similar for password security
4. **Validation**: Validate email format, password strength, etc.
5. **Database Updates**: Update user records and return updated data

### Security Considerations
- Validate file types and sizes for profile pictures
- Hash passwords before storing in database
- Implement rate limiting for password changes
- Sanitize all input data
- Use HTTPS for all API calls

### Error Handling
The frontend handles these error scenarios:
- Network connectivity issues
- Invalid authentication tokens
- File upload failures
- Password validation errors
- Database update failures

### Data Flow
1. User makes changes in ProfileDrawer
2. Frontend validates input data
3. API call made to backend with authentication
4. Backend validates, processes, and updates database
5. Success response updates frontend state and localStorage
6. Custom event notifies other components of changes
7. UI reflects updated data immediately