import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onIdTokenChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { recordSecurityEvent } from '../lib/securityEvents'

export const AuthContext = createContext(null)

async function resolveIsAdmin(firebaseUser, claims) {
  if (claims.admin === true) return true
  try {
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    return snap.exists() && snap.get('accountType') === 'admin'
  } catch {
    return false
  }
}

function hasVerifiedSecondFactor(claims) {
  return typeof claims.auth_time === 'number' && claims.adm2fa === claims.auth_time
}

async function resolveSession(firebaseUser) {
  const { claims } = await firebaseUser.getIdTokenResult()
  return {
    isAdmin: await resolveIsAdmin(firebaseUser, claims),
    secondFactorVerified: hasVerifiedSecondFactor(claims),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [secondFactorVerified, setSecondFactorVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const latestCheck = useRef(0)

  useEffect(() => {
    return onIdTokenChanged(auth, async (firebaseUser) => {
      const check = ++latestCheck.current
      setLoading(true)
      let session = { isAdmin: false, secondFactorVerified: false }
      if (firebaseUser) {
        try {
          session = await resolveSession(firebaseUser)
        } catch {
          // treat as not admin
        }
      }
      if (check !== latestCheck.current) return
      setUser(firebaseUser)
      setIsAdmin(session.isAdmin)
      setSecondFactorVerified(session.secondFactorVerified)
      setLoading(false)
    })
  }, [])

  async function login(email, password, { remember = false } = {}) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password)

    let admin = false
    try {
      admin = (await resolveSession(firebaseUser)).isAdmin
    } catch {
      admin = false
    }

    if (!admin) {
      await recordSecurityEvent(firebaseUser.uid, 'admin_login_denied')
      await signOut(auth)
      const err = new Error('Not an administrator')
      err.code = 'auth/not-admin'
      throw err
    }

    await recordSecurityEvent(firebaseUser.uid, 'admin_login_password_verified')
    return firebaseUser
  }

  const refreshSession = useCallback(async () => {
    if (!auth.currentUser) return
    await auth.currentUser.getIdToken(true)
    const session = await resolveSession(auth.currentUser)
    setIsAdmin(session.isAdmin)
    setSecondFactorVerified(session.secondFactorVerified)
  }, [])

  const logout = useCallback(() => signOut(auth), [])

  const value = {
    user,
    isAdmin,
    secondFactorVerified,
    loading,
    login,
    refreshSession,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
