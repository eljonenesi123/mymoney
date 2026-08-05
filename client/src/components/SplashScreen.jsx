import logo from '../assets/logo.png';
import styles from './SplashScreen.module.css';

function SplashScreen({ fadingOut }) {
  return (
    <div className={styles.splash} data-fading={fadingOut}>
      <img src={logo} alt="MyMoney" className={styles.logo} />
    </div>
  );
}

export default SplashScreen;
