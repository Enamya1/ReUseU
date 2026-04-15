# Quick Start Guide - XiaoWu App Redesign

## Installation Steps

### 1. Install Required Dependencies

```bash
cd xiaowu_app

# Install expo-image-picker
npm install expo-image-picker

# Or with yarn
yarn add expo-image-picker
```

### 2. Update app.json

Add the following to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos to update your profile picture.",
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to take profile pictures."
        }
      ]
    ]
  }
}
```

### 3. Rebuild Native Code (if using development build)

```bash
# For iOS
npx expo prebuild --platform ios
npx expo run:ios

# For Android
npx expo prebuild --platform android
npx expo run:android
```

### 4. Test the New Features

#### Test Image Upload:
1. Open the app
2. Navigate to Profile tab
3. Tap on the avatar
4. Select "Take Photo" or "Choose from Gallery"
5. Verify image uploads and displays

#### Test Notifications:
1. Navigate to Profile tab
2. Tap on "Notifications" menu item
3. Verify notifications list displays
4. Pull to refresh
5. Tap a notification to navigate to chat

#### Test Language Settings:
1. Navigate to Profile tab
2. Tap on "Language" menu item
3. Select a different language
4. Verify language updates

#### Test Currency Settings:
1. Navigate to Profile tab
2. Tap on "Currency" menu item
3. Select a different currency
4. Verify selection updates

---

## File Structure Overview

```
xiaowu_app/
├── src/
│   ├── hooks/
│   │   └── useImagePicker.ts          # Image picker hook
│   └── components/
│       └── ui/
│           └── ImagePickerModal.tsx   # Image source selector modal
└── app/
    ├── (tabs)/
    │   └── profile.tsx                # Updated with image upload
    ├── notifications.tsx              # New notifications page
    ├── language-settings.tsx          # New language settings page
    └── currency-settings.tsx          # New currency settings page
```

---

## API Endpoints Used

### Profile Picture Upload
```
PATCH /api/user/settings
Content-Type: multipart/form-data
Body: {
  profile_picture: File
}
```

### Get Notifications
```
GET /api/user/messages/notification?limit=50
Response: {
  total: number,
  messages: Array<Notification>
}
```

### Get/Update Language
```
GET /api/user/settings/language
Response: { language: "en" }

PATCH /api/user/settings
Body: { language: "zh" }
```

---

## Troubleshooting

### Issue: "expo-image-picker not found"
**Solution:** Run `npm install expo-image-picker` and restart the dev server

### Issue: "Permission denied" when accessing camera/gallery
**Solution:** 
1. Check app.json has the plugin configuration
2. Rebuild the app with `npx expo prebuild`
3. On iOS: Check Settings > Privacy > Camera/Photos
4. On Android: Check App Settings > Permissions

### Issue: Image upload fails
**Solution:**
1. Check network connection
2. Verify API endpoint is correct
3. Check authentication token is valid
4. Check file size (max 5MB per API spec)

### Issue: Notifications page is empty
**Solution:**
1. Verify you have unread messages
2. Check API endpoint `/api/user/messages/notification` is accessible
3. Check authentication token

---

## Next Steps

1. **Test on Physical Device:**
   - Camera functionality requires physical device
   - Test image upload flow end-to-end

2. **Add Pagination:**
   - Implement page navigation for My Listings
   - Add "Load More" button for notifications

3. **Add View Toggle:**
   - Implement grid/list view for Favorites
   - Implement grid/list view for My Listings

4. **Polish UI:**
   - Add skeleton loaders
   - Add animations
   - Improve empty states

---

## Support

For issues or questions:
1. Check `REDESIGN_IMPLEMENTATION_SUMMARY.md` for detailed documentation
2. Review API endpoints in `api_report.txt`
3. Check console logs for error messages

---

**Version:** 1.0  
**Last Updated:** 2026-03-02
