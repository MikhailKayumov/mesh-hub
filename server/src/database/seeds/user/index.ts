import { SeedModule } from '../type';
import seedRoles from './seedRoles';
import seedUsers from './seedUsers';

const UsersSeedModule: SeedModule = {
  name: 'User seeds',
  seeds: [seedRoles],
  dev: [seedUsers],
};

export default UsersSeedModule;
