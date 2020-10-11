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
  );
};

const Counter = () => {
  const [n, setN] = Didact.useState(0);

  return (
    <div>
      <button onClick={() => {
        setN(n => n+1)
      }}>+1
      </button>
      {n}
    </div>
  );
};

const App = props => {
  return (
    <div>
      <h1>hi {props.name}</h1>
      <Election/>
      <Counter/>
    </div>

  );
};


Didact.render(<App name="kin"/>, document.querySelector('#root'));