@echo off
REM Press India - Firebase Configuration Setup
REM Run this file in your project root: E:\press-india

echo ========================================
echo PRESS INDIA - FIREBASE SETUP
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from your project root directory.
    echo Example: E:\press-india
    pause
    exit /b 1
)

echo Creating Firebase configuration files...
echo.

REM Create firebase.json
echo Creating firebase.json...
(
echo {
echo   "firestore": {
echo     "rules": "firestore.rules",
echo     "indexes": "firestore.indexes.json"
echo   },
echo   "storage": {
echo     "rules": "storage.rules"
echo   },
echo   "hosting": {
echo     "public": "dist",
echo     "ignore": [
echo       "firebase.json",
echo       "**/.*",
echo       "**/node_modules/**"
echo     ],
echo     "rewrites": [
echo       {
echo         "source": "**",
echo         "destination": "/index.html"
echo       }
echo     ]
echo   }
echo }
) > firebase.json

REM Create .firebaserc
echo Creating .firebaserc...
(
echo {
echo   "projects": {
echo     "default": "press-india-dunstom"
echo   }
echo }
) > .firebaserc

REM Create firestore.rules
echo Creating firestore.rules...
(
echo rules_version = '2';
echo service cloud.firestore {
echo   match /databases/{database}/documents {
echo.    
echo     function isAuthenticated^(^) {
echo       return request.auth != null;
echo     }
echo.    
echo     function isOwner^(userId^) {
echo       return isAuthenticated^(^) ^&^& request.auth.uid == userId;
echo     }
echo.    
echo     match /articles/{articleId} {
echo       allow read: if true;
echo       allow create: if isAuthenticated^(^) ^&^& request.resource.data.authorId == request.auth.uid;
echo       allow update, delete: if isAuthenticated^(^) ^&^& resource.data.authorId == request.auth.uid;
echo     }
echo.    
echo     match /news/{newsId} {
echo       allow read: if true;
echo       allow write: if isAuthenticated^(^);
echo     }
echo.    
echo     match /users/{userId} {
echo       allow read: if isAuthenticated^(^);
echo       allow create: if isAuthenticated^(^) ^&^& request.auth.uid == userId;
echo       allow update: if isOwner^(userId^);
echo       allow delete: if isOwner^(userId^);
echo     }
echo.    
echo     match /users/{userId}/bookmarks/{bookmarkId} {
echo       allow read, write: if isOwner^(userId^);
echo     }
echo.    
echo     match /users/{userId}/history/{historyId} {
echo       allow read, write: if isOwner^(userId^);
echo     }
echo.    
echo     match /users/{userId}/preferences/{prefId} {
echo       allow read, write: if isOwner^(userId^);
echo     }
echo.    
echo     match /comments/{commentId} {
echo       allow read: if true;
echo       allow create: if isAuthenticated^(^) ^&^& request.resource.data.userId == request.auth.uid;
echo       allow update, delete: if isAuthenticated^(^) ^&^& resource.data.userId == request.auth.uid;
echo     }
echo.    
echo     match /notifications/{notificationId} {
echo       allow read: if isAuthenticated^(^) ^&^& resource.data.userId == request.auth.uid;
echo       allow create: if isAuthenticated^(^);
echo       allow update, delete: if isAuthenticated^(^) ^&^& resource.data.userId == request.auth.uid;
echo     }
echo   }
echo }
) > firestore.rules

REM Create storage.rules
echo Creating storage.rules...
(
echo rules_version = '2';
echo service firebase.storage {
echo   match /b/{bucket}/o {
echo.    
echo     match /verification/{userId}/{document} {
echo       allow read: if request.auth != null;
echo       allow write: if request.auth != null 
echo                    ^&^& request.auth.uid == userId
echo                    ^&^& request.resource.size ^< 5 * 1024 * 1024
echo                    ^&^& request.resource.contentType.matches^('image/.*^|application/pdf'^);
echo     }
echo.    
echo     match /profiles/{userId}/{filename} {
echo       allow read: if true;
echo       allow write: if request.auth != null 
echo                    ^&^& request.auth.uid == userId
echo                    ^&^& request.resource.size ^< 2 * 1024 * 1024
echo                    ^&^& request.resource.contentType.matches^('image/.*'^);
echo     }
echo.    
echo     match /articles/{articleId}/{filename} {
echo       allow read: if true;
echo       allow write: if request.auth != null
echo                    ^&^& request.resource.size ^< 5 * 1024 * 1024
echo                    ^&^& request.resource.contentType.matches^('image/.*'^);
echo     }
echo.    
echo     match /news/{imageId} {
echo       allow read: if true;
echo       allow write: if false;
echo     }
echo   }
echo }
) > storage.rules

REM Create firestore.indexes.json
echo Creating firestore.indexes.json...
(
echo {
echo   "indexes": [
echo     {
echo       "collectionGroup": "articles",
echo       "queryScope": "COLLECTION",
echo       "fields": [
echo         { "fieldPath": "authorId", "order": "ASCENDING" },
echo         { "fieldPath": "createdAt", "order": "DESCENDING" }
echo       ]
echo     },
echo     {
echo       "collectionGroup": "articles",
echo       "queryScope": "COLLECTION",
echo       "fields": [
echo         { "fieldPath": "category", "order": "ASCENDING" },
echo         { "fieldPath": "publishedAt", "order": "DESCENDING" }
echo       ]
echo     },
echo     {
echo       "collectionGroup": "articles",
echo       "queryScope": "COLLECTION",
echo       "fields": [
echo         { "fieldPath": "category", "order": "ASCENDING" },
echo         { "fieldPath": "createdAt", "order": "DESCENDING" }
echo       ]
echo     },
echo     {
echo       "collectionGroup": "news",
echo       "queryScope": "COLLECTION",
echo       "fields": [
echo         { "fieldPath": "category", "order": "ASCENDING" },
echo         { "fieldPath": "publishedAt", "order": "DESCENDING" }
echo       ]
echo     },
echo     {
echo       "collectionGroup": "news",
echo       "queryScope": "COLLECTION",
echo       "fields": [
echo         { "fieldPath": "category", "order": "ASCENDING" },
echo         { "fieldPath": "createdAt", "order": "DESCENDING" }
echo       ]
echo     }
echo   ],
echo   "fieldOverrides": []
echo }
) > firestore.indexes.json

echo.
echo ========================================
echo Files created successfully!
echo ========================================
echo.
echo The following files have been created:
echo   - firebase.json
echo   - .firebaserc
echo   - firestore.rules
echo   - storage.rules
echo   - firestore.indexes.json
echo.
echo Next steps:
echo 1. Deploy to Firebase:
echo    firebase deploy --only firestore:indexes
echo    firebase deploy --only firestore:rules
echo    firebase deploy --only storage
echo.
echo 2. Wait 2-5 minutes for indexes to build
echo.
echo 3. Update your code files (see documentation)
echo.
echo 4. Restart your dev server:
echo    npm run dev
echo.
pause