import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'

let app: any

try {
  // Initialize Firebase Admin
  if (getApps().length === 0) {
    // In production, use service account key
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      })
    } else {
      // In development, use default credentials or emulator
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      })
    }
  } else {
    app = getApps()[0]
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error)
  throw error
}

// Initialize Firebase Admin services
export const adminDb = getFirestore(app)
export const adminAuth = getAuth(app)
export const adminStorage = getStorage(app)

// Set Firestore settings only if not already initialized
try {
  adminDb.settings({ ignoreUndefinedProperties: true })
} catch (error) {
  // Settings have already been set, ignore the error
  console.log('Firestore settings already initialized')
}

export default app 