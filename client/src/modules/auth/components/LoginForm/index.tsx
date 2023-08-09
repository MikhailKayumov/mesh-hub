'use client';
import { Button, Form, Input, Space, Typography, message as antMessage } from 'antd';
import { EyeInvisibleTwoTone, EyeTwoTone } from '@ant-design/icons';
import { useState } from 'react';
import { Paper } from '~/components/Paper';
import { validationRules } from '~/modules/auth/components/LoginForm/validation';
import styles from './LoginForm.module.scss';

export type LoginFormData = {
  email: string;
  password: string;
};

export const LoginForm = () => {
  const [message, context] = antMessage.useMessage();

  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword(prev => !prev);

  const onFinish = async (data: LoginFormData) => {
    try {
      // await authService.login(data);
      message.success('Вход выполнен успешно!', 3);
    } catch (e: unknown) {
      message.error((e as Error).message, 5);
    }
  };
  const test = async () => {
    try {
      // const result = await userService.current();
      // console.log(result);
      message.success('Пользователь получен успешно!', 3);
    } catch (e) {
      message.error((e as Error).message, 5);
    }
  };

  return (
    <Paper className={styles.root}>
      <Space size={24} direction='vertical'>
        <Typography.Title level={3}>Вход</Typography.Title>
        <div>
          <Typography.Text>Введите ваши адрес электронной почты и пароль</Typography.Text>
          <Typography.Text>{context}</Typography.Text>
        </div>
        <Form<LoginFormData>
          wrapperCol={{ xs: { span: 24 } }}
          initialValues={{
            email: process.env.NEXT_PUBLIC_TEST_USER_EMAIL ?? '',
            password: process.env.NEXT_PUBLIC_TEST_USER_PASSWORD ?? '',
          }}
          layout='vertical'
          onFinish={onFinish}
        >
          <Form.Item name='email' rules={validationRules.email}>
            <Input size='large' placeholder='Email' />
          </Form.Item>
          <Form.Item name='password' rules={validationRules.password}>
            <Input
              type={showPassword ? 'text' : 'password'}
              size='large'
              placeholder='Пароль'
              suffix={
                <div className={styles['show-password-btn']} onClick={toggleShowPassword}>
                  {showPassword ? <EyeInvisibleTwoTone /> : <EyeTwoTone />}
                </div>
              }
            />
          </Form.Item>
          <Space size={20} direction='horizontal'>
            <Button htmlType='submit' type='primary' size='large'>
              Войти
            </Button>
            <Button size='large' onClick={test}>
              Регистрация
            </Button>
          </Space>
        </Form>
      </Space>
    </Paper>
  );
};
