import { Metadata } from 'next';
import { LoginForm } from '~/modules/auth/components/LoginForm';
import styles from './Login.module.scss';

export const metadata: Metadata = {
  title: 'MeshHub | Login',
  description: '',
};

export default async function Login() {
  return (
    <div className={styles.root}>
      <LoginForm />
    </div>
  );
}
