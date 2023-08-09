import { theme, ThemeConfig } from 'antd';
import { ComponentTokenMap } from 'antd/es/theme/interface/components';
import { OverrideToken } from 'antd/es/theme/interface';
import { ThemeModeName } from '~/theme/type';

const configs: Record<ThemeModeName | 'common', ThemeConfig> = {
  common: {
    token: {
      fontFamily: 'Inter',
    },
    components: {
      Layout: {},
      Typography: {
        titleMarginBottom: 0,
      },
      Input: {
        borderRadiusLG: 4,
      },
      Button: {
        borderRadiusLG: 4,
      },
    },
  },
  light: {
    algorithm: theme.defaultAlgorithm,
    components: {
      Layout: {
        colorBgHeader: '#ffffff',
      },
    },
  },
  dark: {
    algorithm: theme.darkAlgorithm,
  },
};

export const mergeConfigs = (...configs: ThemeConfig[]): ThemeConfig => {
  return configs.reduce<ThemeConfig>((acc, config) => {
    acc.algorithm = config.algorithm ?? acc.algorithm;
    acc.token = Object.assign(acc.token ?? {}, config.token ?? {});

    const components = Object.entries(config.components ?? {}) as [keyof ComponentTokenMap, any];
    acc.components = components.reduce<OverrideToken>((acc, item: [keyof ComponentTokenMap, any]) => {
      acc[item[0]] = Object.assign(acc[item[0]] ?? {}, item[1] ?? {});
      return acc;
    }, acc.components ?? {});

    return acc;
  }, {});
};

export const buildConfig = (name: ThemeModeName): ThemeConfig => {
  return mergeConfigs(configs.common, configs[name]);
};
