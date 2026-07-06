function hello(name: string, _age: number): void {
  console.log('my name is ', name);

  if (name == 'harshal') {
    console.log('Welcome');
  }
}

hello('harshal', 25);

// Deliberately messy code — the husky pre-commit hook (lint-staged) will reformat this on commit
const greeting = 'hello world';
const numbers = [1, 2, 3, 4, 5];
function add(a: number, b: number) {
  return a + b;
}
console.log(greeting, numbers, add(1, 2));
