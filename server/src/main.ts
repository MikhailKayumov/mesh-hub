import AppBootstrap from './app.bootstrap';

const main = async () => {
  let bootstrap: AppBootstrap | null = null;

  try {
    bootstrap = await new AppBootstrap().init();
    await bootstrap.run();
  } catch (error) {
    console.log('App bootstrap');

    if (bootstrap?.app) {
      bootstrap?.logger.error(error as Error, 'Main.AppBootstrap');
      await bootstrap?.app.close();
    }

    process.exit(1);
  }
};

process.on('exit', (code: number) => {
  console.log(`\nExited with the code ${code}`);
  main();
});

main();
