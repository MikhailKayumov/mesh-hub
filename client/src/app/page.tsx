export default async function MainPage() {
  return (
    <main className='mx-auto my-4 px-4'>
      <h1 className='font-headings'>MainPage</h1>
      <p className='font-sans'>MainPage</p>
      <p className='font-serif'>MainPage</p>
      <p className='font-mono'>MainPage</p>
      <form className='mt-4'>
        <div className='my-2'>
          <input type='text' className='bg-transparent' />
        </div>
        <div className='my-2'>
          <input type='number' className='bg-transparent' />
        </div>
        <div className='my-2'>
          <input type='password' className='bg-transparent' />
        </div>
        <div className='my-2'>
          <input type='checkbox' className='bg-transparent' />
        </div>
        <div className='my-2'>
          <input type='color' />
        </div>
      </form>
    </main>
  );
}
