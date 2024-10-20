import 'dayjs/locale/ru.js';

import { extend, locale } from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

extend(localeData);
extend(relativeTime);
extend(localizedFormat);

locale('ru');
