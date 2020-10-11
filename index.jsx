import Kract from './lib/kract';

// const element = Kract.createElement(
//   'div',
//   {id: 'foo'},
//   Kract.createElement('a', null, 'bar'),
//   Kract.createElement('b')
// );

/** @jsx Kract.createElement */
const Election = () => {
  return (
    <div id="foo">
      <a onClick={() => console.log(123)}>bar</a>
      <b/>
    </div>
  );
};

const Counter = () => {
  const [n, setN] = Kract.useState(0);

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


Kract.render(<App name="kin"/>, document.querySelector('#root'));