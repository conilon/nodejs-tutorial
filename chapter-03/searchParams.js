const { URL } = require('url');

const myURL = new URL('https://www.gilbut.co.kr/?page=3&limit=10&category=nodejs&category=javascript');

console.log('myURL.searchParams:', myURL.searchParams);
console.log('myURL.searchParmas.getAll():', myURL.searchParams.getAll('category'));
myURL.searchParams.getAll('category');
console.log('myURL.searchParams.get(\'limit\'):', myURL.searchParams.get('limit'));
console.log('myURL.searchParams.has(\'page\'):', myURL.searchParams.has('page'));

console.log('myURL.searchParams.keys():', myURL.searchParams.keys());
console.log('myURL.searchParams.values():', myURL.searchParams.values());

myURL.searchParams.append('filter', 'es3');
myURL.searchParams.append('filter', 'es5');
console.log(myURL.searchParams.getAll('filter'));

myURL.searchParams.set('filter', 'es6');
console.log(myURL.searchParams.getAll('filter'));

myURL.searchParams.delete('filter');
console.log(myURL.searchParams.getAll('filter'));

console.log('searchParams.toString():', myURL.searchParams.toString());
myURL.search = myURL.searchParams.toString();
