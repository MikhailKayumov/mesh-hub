import { SeedModule } from '../type';
import seedCGSoft from './seedCGSoft';
import seedCategories from './seedCategories';

const ResourcesSeedModule: SeedModule = {
  name: 'Resources seeds',
  seeds: [seedCGSoft, seedCategories],
  dev: [],
};

export default ResourcesSeedModule;
