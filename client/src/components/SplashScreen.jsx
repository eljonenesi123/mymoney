import logo from '../assets/logo.png';
import styles from './SplashScreen.module.css';

function SplashScreen({ fadingOut }) {
  return (
    <div className={styles.splash} data-fading={fadingOut}>
      <div className={styles.content}>
        <img src={logo} alt="" className={styles.logo} />
        <span className={styles.name}>MyMoney</span>
      </div>
    </div>
  );
}

export default SplashScreen;
