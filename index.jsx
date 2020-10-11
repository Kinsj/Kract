import Didact from './lib/didact';

// const element = Didact.createElement(
//   'div',
//   {id: 'foo'},
//   Didact.createElement('a', null, 'bar'),
//   Didact.createElement('b')
// );

/** @jsx Didact.createElement */
const Election = () => {
  return (
    <div id="foo">
      <a onClick={() => console.log(123)}>bar</a>
      <b/>
    </div>
  )
};

const App = props => {
  return (
    <div>
      <h1>hi {props.name}</h1>
      <Election/>
    </div>

  );
};


Didact.render(<App name="kin"/>, document.querySelector('#root'));