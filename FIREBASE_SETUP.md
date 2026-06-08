# Step-by-Step Firebase Backend Integration Guide

Follow these steps to connect your Smart Library portal to your live **Firebase Cloud Firestore** database:

---

## Step 1: Create a Project in the Firebase Console
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** (or **Create a Project**).
3. Give your project a name (e.g., `smart-library-portal`) and click **Continue**.
4. Enable or disable Google Analytics according to your preference, then click **Create Project**.
5. Wait for the initialization to complete, then click **Continue**.

---

## Step 2: Register a Web App
1. On the Project Overview home screen, click the **Web icon** (`</>`) to add a Web App to your project.
2. Enter an App Nickname (e.g., `Smart Library Web UI`).
3. Leave "Also set up Firebase Hosting" unchecked for now, and click **Register app**.
4. Firebase will display your app configuration block containing credentials. It will look like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "smart-library-portal.firebaseapp.com",
     projectId: "smart-library-portal",
     storageBucket: "smart-library-portal.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. Keep this screen open or copy the configuration block; you will paste these values into the codebase in Step 4. Click **Continue to console**.

---

## Step 3: Set Up Cloud Firestore Database
1. In the Firebase Console left-sidebar menu, click **Firestore Database** (under the Build section).
2. Click the **Create database** button.
3. Select a location for your database (choose the one nearest to your users) and click **Next**.
4. Start in **Test Mode** (which enables read/write permissions for testing) and click **Create**.
5. Once your database is created, go to the **Rules** tab at the top and review your Firestore security rules. For development, they look like this:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // Allows the web app to query directly
       }
     }
   }
   ```
   > [!WARNING]
   > For production deployments, update these rules to check authentication states or limit write operations to admin roles only.

---

## Step 4: Configure the Web App Code
1. Open the file `js/firebase-config.js` in your text editor.
2. Locate the `firebaseConfig` object template:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
3. Replace the placeholder strings with your actual Firebase project keys copied in **Step 2**.
4. Save the file.

---

## Step 5: Start the Portal & Verify the Database
1. Launch the application in a local browser (e.g., double-click `index.html` or run `npm run dev` / a local live server).
2. Navigate to **Settings** in the Admin Sidebar. You should see a green badge showing: **`[Firebase Active]`**.
3. Register a new library on the home screen.
4. Log in with the library details, add a book, and add a student member.
5. Return to the Firebase Console and open the **Firestore Database** page.
6. You will see collections created automatically:
   - **`libraries`**: Holds details about registered library portals, admin logins, and initialization dates.
   - **`books`**: Tracks titles, authors, genres, ISBNs, library IDs, and active checkout availability.
   - **`members`**: Tracks registered student profiles, usernames, and passwords for login checkups.
   - **`issues`**: Holds checkout logs, borrow dates, due dates, return statuses, and fines.

Your backend database is now fully set up and running in the cloud!
