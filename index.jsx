import Didact from './lib/didact';

// const element = Didact.createElement(
//   'div',
//   {id: 'foo'},
//   Didact.createElement('a', null, 'bar'),
//   Didact.createElement('b')
// );

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a onClick={() => console.log(123)}>bar</a>
    <b/>
  </div>
);

Didact.render(element, document.querySelector('#root'));