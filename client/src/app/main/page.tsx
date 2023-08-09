import { Viewer } from '~/modules/viewer';
import styles from './MainPage.module.scss';

export default async function MainPage() {
  return (
    <div className={styles.root}>
      <div className={`${styles.paper} ${styles.viewer}`}>
        <Viewer />
      </div>
    </div>
  );
}
