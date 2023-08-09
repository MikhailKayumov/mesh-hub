'use client';

function Debug(props: any) {
  return (
    <div>
      <pre>{JSON.stringify(props.result, null, 2)}</pre>
    </div>
  );
}

export default Debug;
