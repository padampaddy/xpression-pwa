import React from 'react';
import FaceAnalyzer from './components/FaceAnalyzer';
import { ScanFace } from 'lucide-react';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <ScanFace className={styles.icon} size={28} />
          <h1 className={styles.title}>
            XPRESSION
          </h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.statusDot}></span>
          <span className={styles.statusText}>SYSTEM ONLINE</span>
        </div>
      </header>

      <main className={styles.main}>
        <FaceAnalyzer />
      </main>
    </div>
  );
}

export default App;
