import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import styles from '../styles/layout.module.css'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getInitialUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleGetStarted = () => {
    window.location.href = '/login?signup=true'
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav className={styles.navbar}>
        <a href="/" className={styles.navbarBrand}>
          RealCV
        </a>
        
        {/* Desktop Navigation */}
        <div className={styles.navbarActions}>
          <a href="/dashboard" className={styles.navLink}>
            My Resumes
          </a>
          <a href="/login?signup=true&employer=true" className={styles.navLink}>
            Employers
          </a>
          <a href="/pricing" className={styles.navLink}>
            Pricing
          </a>
          <a href="/verify-code" className={styles.navLink}>
            Verify
          </a>
          {!loading && !user && (
            <>
              <a href="/login" className={styles.navLink}>
                Sign In
              </a>
              <button 
                onClick={handleGetStarted}
                className={styles.getStartedButton}
              >
                Get Started
              </button>
            </>
          )}
          {!loading && user && (
            <button 
              onClick={() => window.location.href = '/profile'}
              className={styles.accountButton}
            >
              Account
            </button>
          )}
          
          {/* Mobile Hamburger Button */}
          <button 
            onClick={toggleMobileMenu}
            className={styles.hamburgerButton}
            aria-label="Toggle mobile menu"
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className={styles.mobileMenuOverlay} 
            onClick={closeMobileMenu}
          ></div>
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuHeader}>
              <span className={styles.mobileMenuTitle}>Menu</span>
              <button 
                onClick={closeMobileMenu}
                className={styles.mobileMenuClose}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <div className={styles.mobileMenuContent}>
              <a href="/dashboard" className={styles.mobileMenuLink} onClick={closeMobileMenu}>
                My Resumes
              </a>
              <a href="/login?signup=true&employer=true" className={styles.mobileMenuLink} onClick={closeMobileMenu}>
                Employers
              </a>
              <a href="/pricing" className={styles.mobileMenuLink} onClick={closeMobileMenu}>
                Pricing
              </a>
              <a href="/verify-code" className={styles.mobileMenuLink} onClick={closeMobileMenu}>
                Verify
              </a>
              <a href="/contact" className={styles.mobileMenuLink} onClick={closeMobileMenu}>
                Contact Us
              </a>
              
              <div className={styles.mobileMenuDivider}></div>
              
              {!loading && !user && (
                <>
                  <a href="/login" className={styles.mobileMenuLink} onClick={closeMobileMenu}>
                    Sign In
                  </a>
                  <button 
                    onClick={() => {
                      handleGetStarted()
                      closeMobileMenu()
                    }}
                    className={styles.mobileMenuButton}
                  >
                    Get Started
                  </button>
                </>
              )}
              {!loading && user && (
                <button 
                  onClick={() => {
                    window.location.href = '/profile'
                    closeMobileMenu()
                  }}
                  className={styles.mobileMenuButton}
                >
                  Account
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.copyright}>©2025 RealCV |</span>
      <a className={styles.footerLink} href="/output-example">Output Example</a>
      <a className={styles.footerLink} href="/terms">Terms</a>
      <a className={styles.footerLink} href="/privacy">Privacy</a>
      <a className={styles.footerLink} href="/pricing">Pricing</a>
      <a className={styles.footerLink} href="/contact">Contact Us</a>
    </footer>
  )
}

interface LayoutProps {
  children: React.ReactNode
  showNavbar?: boolean
  title?: string
  className?: string
}

export default function Layout({ children, showNavbar = true, title, className = '' }: LayoutProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      {showNavbar && <Navbar />}
      <main className={showNavbar ? styles.mainWithNav : styles.main}>
        {title && <h1 className={styles.pageTitle}>{title}</h1>}
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}