function hello(name: string, _age: number): void {
  const unused = 'test';

  console.log('my name is ', name);

  if (name == 'harshal') {
    console.log('Welcome');
  }
}

hello('harshal', 25);
