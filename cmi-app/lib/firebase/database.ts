import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from './client'
import { adminDb } from './admin'

// Types
export interface Student {
  id?: string
  firstName: string
  targetLanguage: string
  createdAt: Timestamp
}

export interface Rubric {
  id?: string
  name: string
  language: string
  criteria: RubricCriterion[]
  createdAt: Timestamp
}

export interface RubricCriterion {
  name: string
  weight: number
  description: string
  levels: Array<{
    score: number
    description: string
  }>
}

export interface Session {
  id?: string
  studentId: string
  rubricId: string
  startedAt: Timestamp
  completedAt?: Timestamp
  overallScore?: number
  rawTranscript?: TranscriptEntry[]
  audioUrl?: string
  scoreBreakdown?: Record<string, any>
}

export interface TranscriptEntry {
  speaker: 'student' | 'ai'
  text: string
  timestamp: Timestamp
}

// Student operations
export async function createStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'students'), {
    ...data,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function getStudent(id: string): Promise<Student | null> {
  const docRef = doc(db, 'students', id)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Student
  }
  return null
}

// Rubric operations
export async function getRubrics(language?: string): Promise<Rubric[]> {
  let q = query(collection(db, 'rubrics'), orderBy('createdAt', 'desc'))
  
  if (language) {
    q = query(collection(db, 'rubrics'), where('language', '==', language), orderBy('createdAt', 'desc'))
  }
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rubric))
}

export async function getRubric(id: string): Promise<Rubric | null> {
  const docRef = doc(db, 'rubrics', id)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Rubric
  }
  return null
}

export async function getDefaultRubric(language: string): Promise<Rubric | null> {
  const q = query(
    collection(db, 'rubrics'), 
    where('language', '==', language),
    orderBy('createdAt', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Rubric
  }
  return null
}

// Session operations
export async function createSession(data: Omit<Session, 'id' | 'startedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'sessions'), {
    ...data,
    startedAt: serverTimestamp()
  })
  return docRef.id
}

export async function getSession(id: string): Promise<Session | null> {
  const docRef = doc(db, 'sessions', id)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Session
  }
  return null
}

export async function getSessionWithDetails(id: string): Promise<{
  session: Session
  student: Student
  rubric: Rubric
} | null> {
  const session = await getSession(id)
  if (!session) return null
  
  const [student, rubric] = await Promise.all([
    getStudent(session.studentId),
    getRubric(session.rubricId)
  ])
  
  if (!student || !rubric) return null
  
  return { session, student, rubric }
}

export async function updateSession(id: string, data: Partial<Session>): Promise<void> {
  const docRef = doc(db, 'sessions', id)
  await updateDoc(docRef, data)
}

export async function updateSessionTranscript(id: string, transcript: TranscriptEntry[]): Promise<void> {
  const docRef = doc(db, 'sessions', id)
  await updateDoc(docRef, {
    rawTranscript: transcript
  })
}

export async function completeSession(
  id: string, 
  overallScore: number, 
  scoreBreakdown: Record<string, any>
): Promise<void> {
  const docRef = doc(db, 'sessions', id)
  await updateDoc(docRef, {
    overallScore,
    scoreBreakdown,
    completedAt: serverTimestamp()
  })
}

// Real-time listeners
export function subscribeToSession(id: string, callback: (session: Session | null) => void) {
  const docRef = doc(db, 'sessions', id)
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Session)
    } else {
      callback(null)
    }
  })
}

export function subscribeToSessions(callback: (sessions: Session[]) => void) {
  const q = query(collection(db, 'sessions'), orderBy('startedAt', 'desc'))
  return onSnapshot(q, (querySnapshot) => {
    const sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session))
    callback(sessions)
  })
}

// Server-side operations (using admin SDK)
export async function createStudentServer(data: Omit<Student, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await adminDb.collection('students').add({
    ...data,
    createdAt: Timestamp.now()
  })
  return docRef.id
}

export async function getSessionServer(id: string): Promise<Session | null> {
  const docSnap = await adminDb.collection('sessions').doc(id).get()
  
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as Session
  }
  return null
}

export async function updateSessionServer(id: string, data: Partial<Session>): Promise<void> {
  await adminDb.collection('sessions').doc(id).update(data)
} 